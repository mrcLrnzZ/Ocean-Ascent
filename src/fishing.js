// src/fishing.js
import { WATER_Y, GRAVITY, SHORE_LINE_DEPTH, SHORE_END } from './constants.js';

export class Rod {
    constructor(player, fishManager) {
        this.player = player;
        this.fishManager = fishManager;

        this.x = player.x;
        this.y = player.y;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 4;
        this.power = 0;
        this.maxPower = 7.5;
        this.isCasting = false;
        this.isBaitInWater = false;
        this.isSinking = false;

        this.baitImg = new Image();
        this.baitImg.src = 'assets/doomsday-oarfish.png';
        this.baitSize = 16;

        this.reeling = false;
        this.reelTimer = 0;
        this.reelDuration = 500;

        this.landedX = null;
        this.landedY = null;

        this.sinkSpeed = 0.8;
        this.sinkDepth = SHORE_LINE_DEPTH;

        this.baitRadius = 32;
        this.caughtFish = null;

        // Debounce 'e' so one press = one hook attempt
        this.eWasUp = true;
        this.hookFlash = 0;
    }

    update(keys) {
        // Track 'e' press edge (pressed this frame, not held)
        const ePressedNow = keys['e'] && this.eWasUp;
        this.eWasUp = !keys['e'];
        // Clear inHitbox on all fish each frame so it doesn't stay stale
        if (this.fishManager) {
            for (const fish of this.fishManager.fishes) {
                fish.inHitbox = false;
            }
        }

        if (this.hookFlash > 0) this.hookFlash--;

        // ---------- 1️⃣ Angle & power ----------
        if (!this.isCasting) {
            if (keys['w'] || keys['ArrowUp'])   this.angle -= 0.02;
            if (keys['s'] || keys['ArrowDown'])  this.angle += 0.02;
            if (keys[' ']) this.power = Math.min(this.power + 0.3, this.maxPower);

            if (!keys[' '] && this.power > 0) {
                const projectedX = this.player.x + Math.cos(this.angle) * this.power * 10;
                if (projectedX <= SHORE_END) { this.power = 0; return; }

                this.isCasting = true;
                this.vx = Math.cos(this.angle) * this.power;
                this.vy = Math.sin(this.angle) * this.power;
                this.power = 0;
                this.reelTimer = 0;
                this.landedX = null;
                this.landedY = null;
                this.isSinking = false;
                this.caughtFish = null;
            }
        }

        // ---------- 2️⃣ Physics ----------
        if (this.isCasting && !this.reeling) {
            if (!this.isBaitInWater) {
                this.vy += GRAVITY;
                this.x += this.vx;
                this.y += this.vy;

                if (this.y >= WATER_Y && this.x >= SHORE_END) {
                    this.y = WATER_Y;
                    this.vx = 0;
                    this.vy = 0;
                    this.isBaitInWater = true;
                    this.isSinking = true;
                    this.landedX = this.x;
                }
            } else if (this.isSinking) {
                this.x = this.landedX;
                this.y += this.sinkSpeed;

                if (this.y >= WATER_Y + this.sinkDepth) {
                    this.y = WATER_Y + this.sinkDepth;
                    this.landedY = this.y;
                    this.isSinking = false;
                }
            } else {
                // ---------- 3️⃣ Settled — check for hooks ----------
                this.x = this.landedX;
                this.y = this.landedY;

                if (!this.caughtFish) {
                    for (const fish of this.fishManager.fishes) {
                        if (fish.caught) continue; // already hooked by something else
                        const dist = Math.hypot(fish.x - this.x, fish.y - this.y);
                        fish.inHitbox = dist <= this.baitRadius;

                        // ✅ Use edge-triggered press, not held key
                        if (fish.inHitbox && ePressedNow) {
                            fish.caught = true;
                            this.caughtFish = fish;
                            this.reeling = true; // ✅ start reeling immediately on hook
                            this.hookFlash = 90;
                            break;
                        }
                    }
                }

                // Auto-reel after timeout (only if nothing hooked)
                if (!this.caughtFish) {
                    this.reelTimer++;
                    if (this.reelTimer >= this.reelDuration) {
                        this.reeling = true;
                    }
                }
            }
        }

        // ---------- 4️⃣ Reel-in ----------
        if (this.reeling) {
            // Drag caught fish with bait
            if (this.caughtFish) {
                this.caughtFish.x = this.x;
                this.caughtFish.y = this.y;
            }

            const dx = this.player.x + 20 - this.x;
            const dy = this.player.y - this.y;
            const dist = Math.hypot(dx, dy);
            const reelSpeed = 2;

            if (dist < reelSpeed) {
                if (this.caughtFish) {
                    // ✅ Remove caught fish from the pool on arrival
                    this.fishManager.fishes = this.fishManager.fishes.filter(f => f !== this.caughtFish);
                    console.log(`Landed a ${this.caughtFish.type}!`);
                    this.caughtFish = null;
                }
                this.reset();
            } else {
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * reelSpeed;
                this.y += Math.sin(angle) * reelSpeed;
            }
        }

        // ---------- 5️⃣ Keep bait at player when idle ----------
        if (!this.isCasting && !this.reeling) {
            this.x = this.player.x + 20;
            this.y = this.player.y;
        }
    }

    draw(ctx, cameraX = 0) {
        const screenX = this.x - cameraX;
        const screenY = this.y;

        // Rod line
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.player.x - cameraX + 24, this.player.y + 20);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();

        // Angle indicator
        if (!this.isCasting) {
            const previewLength = 50 + this.power * 2;
            const px = this.player.x + 24 + Math.cos(this.angle) * previewLength - cameraX;
            const py = this.player.y + 20 + Math.sin(this.angle) * previewLength;
            ctx.strokeStyle = 'rgba(0,0,255,0.6)';
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(this.player.x - cameraX + 24, this.player.y + 20);
            ctx.lineTo(px, py);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Power meter
        if (!this.isCasting) {
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.player.x - cameraX, this.player.y - 10, this.maxPower * 4, 5);
            ctx.fillStyle = 'lime';
            ctx.fillRect(this.player.x - cameraX, this.player.y - 10, this.power * 4, 5);
        }

        const fishNearby = this.fishManager?.fishes.some(f => f.inHitbox);
        ctx.save();
        if (fishNearby && !this.caughtFish) {
                    // Pulse the bait size when fish is in range
                    const pulse = 1 + 0.2 * Math.sin(Date.now() / 100);
                    const size = this.baitSize * pulse;
                    if (this.baitImg.complete && this.baitImg.naturalWidth !== 0) {
                        ctx.drawImage(this.baitImg,
                            screenX - size / 2, screenY - size / 2, size, size);
                    }
                    // "Press E" prompt
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 3;
                    ctx.font = 'bold 13px monospace';
                    ctx.textAlign = 'center';
                    ctx.strokeText('[E] Hook!', screenX, screenY - 20);
                    ctx.fillText('[E] Hook!', screenX, screenY - 20);
                } else {
                  // Bait
                  if (this.baitImg.complete && this.baitImg.naturalWidth !== 0) {
                    ctx.drawImage(this.baitImg,
                      screenX - this.baitSize / 2, screenY - this.baitSize / 2,
                      this.baitSize, this.baitSize);
                    } else {
                      ctx.fillStyle = 'red';
                      ctx.fillRect(screenX - this.baitSize / 2, screenY - this.baitSize / 2,
                        this.baitSize, this.baitSize);
                      }
                }
                ctx.restore();
        // Hitbox
        ctx.strokeStyle = fishNearby ? 'rgba(255,80,80,0.7)' : 'rgba(255,255,0,0.3)';
        ctx.lineWidth = fishNearby ? 2 : 1;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.baitRadius, 0, Math.PI * 2);
        ctx.stroke();

        if (this.hookFlash > 0) {
          const alpha = Math.min(1, this.hookFlash / 20); // fade out
          const playerScreenX = this.player.x - cameraX;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.font = 'bold 22px monospace';
          ctx.textAlign = 'center';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 4;
          ctx.fillStyle = '#FFD700';
          ctx.strokeText('HOOKED!', playerScreenX, this.player.y - 30);
          ctx.fillText('HOOKED!', playerScreenX, this.player.y - 30);
          ctx.restore();
      }
      // Caught fish type label while reeling
        if (this.caughtFish && this.reeling) {
            const playerScreenX = this.player.x - cameraX;
            ctx.save();
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            const label = `Reeling: ${this.caughtFish.type}...`;
            ctx.strokeText(label, playerScreenX, this.player.y - 12);
            ctx.fillText(label, playerScreenX, this.player.y - 12);
            ctx.restore();
        }
    }

    reset() {
        this.isCasting = false;
        this.isBaitInWater = false;
        this.isSinking = false;
        this.vx = 0;
        this.vy = 0;
        this.x = this.player.x + 20;
        this.y = this.player.y;
        this.angle = -Math.PI / 4;
        this.power = 0;
        this.reeling = false;
        this.reelTimer = 0;
        this.landedX = null;
        this.landedY = null;
        this.caughtFish = null;
    }
}
