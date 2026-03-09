// src/fishing.js
import { WATER_Y, GRAVITY, SHORE_LINE_DEPTH, SHORE_END, getDepthEndLine } from './constants.js';
import { SPRITE_DATA } from './fish.js';

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
        // state variables
        this.isCasting = false;
        this.isBaitInWater = false;
        this.isSinking = false;

        this.baitImg = new Image();
        this.baitImg.src = 'assets/doomsday-oarfish.png';
        this.baitSize = 16;

        this.reeling = false;
        this.reelTimer = 0;
        this.reelDuration = 500;
        // landing variables
        this.landedX = null;
        this.landedY = null;
        this.sinkSpeed = 0.8;
        this.sinkDepth = SHORE_LINE_DEPTH;
        this.depthOffset = 0;
        this.maxDepthOffset = 0;

        this.baitRadius = 32;
        this.caughtFish = null;

        this.eWasUp = true;
        this.hookFlash = 0;

        // Catch Minigame
        this.catchProgress = 0;
        this.struggling = false; // true when a fish is hooked but not yet fully caught
    }

    update(keys) {
        const ePressedNow = keys['f'] && this.eWasUp;
        this.eWasUp = !keys['f'];

        if (this.fishManager) {
            for (const fish of this.fishManager.fishes) fish.inHitbox = false;
        }

        if (this.hookFlash > 0) this.hookFlash--;

        // Dynamic bait radius based on rod level. +15px per level. Level 1 = 32. Level 5 = 92
        this.baitRadius = 32 + (this.player.rodLevel - 1) * 15;

        // Determine rod origin (player or boat)
        let originX = this.player.x + 20; // default origin
        let originY = this.player.y + 30; // adjusted for rod height
        if (this.player.state === 'onBoat' && this.player.boatRef) {
            originX = this.player.boatRef.x + (this.player.x - this.player.boatRef.x) + 20;
            originY = this.player.y; // y adjusted by player.js for tilt
        }

        // ---------- Casting ----------
        if (!this.isCasting) {
            // Require explicit boat fishing state if on a boat
            if (this.player.state === 'onBoat' && this.player.boatRef) {
                if (this.player.boatRef.state !== 'fishing') {
                    this.power = 0; // Prevent power charging
                    return;         // Exit completely
                }
            }

            if (keys['w'] || keys['ArrowUp']) this.angle -= 0.02;
            if (keys['s'] || keys['ArrowDown']) this.angle += 0.02;
            if (keys[' ']) this.power = Math.min(this.power + 0.3, this.maxPower);

            if (!keys[' '] && this.power > 0) {
                const projectedX = originX + Math.cos(this.angle) * this.power * 10;
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
                this.depthOffset = 0;
                this.sinkDepth = (this.player.state === 'onBoat') ? 200 + 100 * (this.player.boatLevel - 1) : SHORE_LINE_DEPTH;
            }
        }

        // ---------- Physics ----------
        if (this.isCasting && !this.reeling) {
            if (!this.isBaitInWater) {
                if (ePressedNow) {
                    this.reeling = true;
                    return;
                }

                this.vy += GRAVITY;
                this.x += this.vx;
                this.y += this.vy;

                if (this.y >= WATER_Y) {
                    this.y = WATER_Y;
                    this.vx = 0; this.vy = 0;
                    this.isBaitInWater = true;
                    this.isSinking = true;
                    this.landedX = this.x;
                    this.depthOffset = 0;
                }
            } else if (this.isSinking) {
                if (ePressedNow) {
                    this.reeling = true;
                    return;
                }

                this.x = this.landedX;
                this.depthOffset += this.sinkSpeed;

                // Max depth based on rod level
                // Player's rodLevel handles this, defaults to Level 1
                this.maxDepthOffset = getDepthEndLine(Math.min(6, this.player.rodLevel)) - WATER_Y;

                // Vertical bait control override
                const depthSpeed = 4.0; // Responsive manual speed

                if (keys['ArrowUp'] || keys['w']) {
                    this.depthOffset -= depthSpeed;
                    this.isSinking = false; // override auto-sink if they pull up
                }
                if (keys['ArrowDown'] || keys['s']) {
                    this.depthOffset += depthSpeed;
                    this.isSinking = false; // override auto-sink if they pull down manually
                }

                // Hard bounds for depth
                this.depthOffset = Math.max(0, Math.min(this.maxDepthOffset, this.depthOffset));

                this.y = WATER_Y + this.depthOffset;
                this.landedY = this.y;

                // If auto-sinking reached limit, gracefully stop sinking state
                if (this.isSinking && this.depthOffset >= this.maxDepthOffset) {
                    this.depthOffset = this.maxDepthOffset;
                    this.isSinking = false;
                }

            } else {
                this.x = this.landedX;

                // Max depth based on rod level
                this.maxDepthOffset = getDepthEndLine(Math.min(6, this.player.rodLevel)) - WATER_Y;

                // Vertical bait control
                const depthSpeed = 4.0;

                if (keys['ArrowUp'] || keys['w']) {
                    this.depthOffset -= depthSpeed;
                }
                if (keys['ArrowDown'] || keys['s']) {
                    this.depthOffset += depthSpeed;
                }

                // Hard bounds for depth
                this.depthOffset = Math.max(0, Math.min(this.maxDepthOffset, this.depthOffset));

                // Apply depth
                this.y = WATER_Y + this.depthOffset;
                this.landedY = this.y;

                if (!this.caughtFish) {
                    for (const fish of this.fishManager.fishes) {
                        if (fish.caught) continue;
                        const dist = Math.hypot(fish.x - this.x, fish.y - this.y);
                        fish.inHitbox = dist <= this.baitRadius;
                        if (fish.inHitbox && ePressedNow) {
                            fish.caught = true;
                            this.caughtFish = fish;
                            this.struggling = true;
                            this.catchProgress = 0;
                            this.hookFlash = 120;
                            break;
                        }
                    }
                    if (!this.caughtFish && ePressedNow) {
                        this.reeling = true; // reel empty hook
                    }
                }
            }
        }

        // ---------- Struggle Minigame ----------
        if (this.struggling && this.caughtFish) {
            // Fish stays attached to the struggle point
            this.caughtFish.x = this.x;
            this.caughtFish.y = this.y;

            let requiredTaps = 2; // default for common
            let escapeChance = 0; // chance to escape per frame

            switch (SPRITE_DATA[this.caughtFish.type].rarity) {
                case 'common': requiredTaps = 2; escapeChance = 0.000; break;
                case 'uncommon': requiredTaps = 4; escapeChance = 0.000; break;
                case 'rare': requiredTaps = 8; escapeChance = 0.0005; break; // ~6% per second
                case 'epic': requiredTaps = 15; escapeChance = 0.001; break; // ~18% per second
                case 'legendary': requiredTaps = 25; escapeChance = 0.002; break; // ~30% per second
                default: requiredTaps = 2; escapeChance = 0.000; break;
            }

            // RNG Escape Roll
            if (Math.random() < escapeChance) {
                console.log(`${this.caughtFish.type} snapped the line and got away!`);
                this.caughtFish.caught = false;
                this.caughtFish = null;
                this.struggling = false;
                this.reeling = true; // reels empty hook in shame
            } else {
                if (ePressedNow) {
                    this.catchProgress += 1;
                }

                // Win fish if taps reached
                if (this.catchProgress >= requiredTaps) {
                    this.catchProgress = requiredTaps;
                    this.caughtFish.requiredTaps = requiredTaps; // for UI reference if needed briefly
                    this.struggling = false;
                    this.reeling = true; // now smoothly reel the caught fish in
                }
            }
        }

        // ---------- Reel ----------
        if (this.reeling) {
            if (this.caughtFish) {
                this.caughtFish.x = this.x;
                this.caughtFish.y = this.y;
            }

            const dx = originX - this.x;
            const dy = originY - this.y;
            const dist = Math.hypot(dx, dy);
            const reelSpeed = 5;

            if (dist < reelSpeed) {
                if (this.caughtFish) {
                    // Log catch to Player Inventory
                    const fishId = this.caughtFish.type;
                    if (this.player.inventory[fishId] !== undefined) {
                        this.player.inventory[fishId] += 1;
                    }

                    this.fishManager.fishes = this.fishManager.fishes.filter(f => f !== this.caughtFish);
                    console.log(`Landed a ${this.caughtFish.type}!`);

                    // Update caught notification ui
                    // uiManager.showNotification(`Caught a ${this.caughtFish.name}!`); // you can enable this later

                    // Update HUD to reflect new total catch count
                    import('./ui.js').then(module => {
                        module.uiManager.updateHUD();
                    });

                    this.caughtFish = null;
                }
                this.reset();
            } else {
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * reelSpeed;
                this.y += Math.sin(angle) * reelSpeed;
            }
        }

        // ---------- Idle bait ----------
        if (!this.isCasting && !this.reeling) {
            this.x = originX;
            this.y = originY;
        }
    }

    draw(ctx, cameraX = 0) {
        const screenX = this.x - cameraX;
        const screenY = this.y;

        // Rod line
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const rodTipX = this.player.x - cameraX + 24;
        const rodTipY = this.player.y + 30;
        ctx.moveTo(rodTipX, rodTipY);

        let sag = 0;
        if (!this.reeling && this.isCasting) {
            sag = Math.min(100, Math.abs(rodTipX - screenX) * 0.3);
        }
        ctx.quadraticCurveTo((rodTipX + screenX) / 2, Math.min(rodTipY, screenY) + sag, screenX, screenY);
        ctx.stroke();

        // Preview angle
        if (!this.isCasting) {
            const previewLength = 50 + this.power * 2;
            const px = this.player.x + 24 + Math.cos(this.angle) * previewLength - cameraX;
            const py = this.player.y + 20 + Math.sin(this.angle) * previewLength;
            ctx.strokeStyle = 'rgba(229, 255, 0, 0.6)';
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
        if (fishNearby && !this.caughtFish && !this.struggling) {
            const pulse = 1 + 0.2 * Math.sin(Date.now() / 100);
            const size = this.baitSize * pulse;
            if (this.baitImg.complete && this.baitImg.naturalWidth !== 0) {
                ctx.drawImage(this.baitImg, screenX - size / 2, screenY - size / 2, size, size);
            }
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.strokeText('[F] Hook!', screenX, screenY - 50);
            ctx.fillText('[F] Hook!', screenX, screenY - 50);
        } else {
            if (this.baitImg.complete && this.baitImg.naturalWidth !== 0) {
                ctx.drawImage(this.baitImg, screenX - this.baitSize / 2, screenY - this.baitSize / 2, this.baitSize, this.baitSize);
            } else {
                ctx.fillStyle = 'red';
                ctx.fillRect(screenX - this.baitSize / 2, screenY - this.baitSize / 2, this.baitSize, this.baitSize);
            }
        }

        // Struggle minigame UI
        if (this.struggling && this.caughtFish) {
            let requiredTaps = 2;
            switch (this.caughtFish.type) {
                case 'common': requiredTaps = 2; break;
                case 'uncommon': requiredTaps = 4; break;
                case 'rare': requiredTaps = 8; break;
                case 'epic': requiredTaps = 15; break;
                case 'legendary': requiredTaps = 25; break;
            }

            // Draw progress bar above the fish
            const barW = 100;
            const barH = 10;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(screenX - barW / 2, screenY - 40, barW, barH);

            // Progress fill
            const fillRatio = Math.max(0, Math.min(1.0, this.catchProgress / requiredTaps));
            ctx.fillStyle = fillRatio > 0.8 ? '#00ff00' : (fillRatio > 0.3 ? '#ffff00' : '#ff0000');
            ctx.fillRect(screenX - barW / 2, screenY - 40, barW * fillRatio, barH);

            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.strokeText('Spam [F]!', screenX, screenY - 50);
            ctx.fillText('Spam [F]!', screenX, screenY - 50);
        }

        ctx.restore();

        // Hitbox
        ctx.strokeStyle = fishNearby ? 'rgba(255,80,80,0.7)' : 'rgba(255,255,0,0.3)';
        ctx.lineWidth = fishNearby ? 2 : 1;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.baitRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Hooked flash
        if (this.hookFlash > 0) {
            const alpha = Math.min(1, this.hookFlash / 20);
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

        // Reeling label
        if (this.caughtFish && this.reeling) {
            const playerScreenX = this.player.x - cameraX;
            ctx.save();
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            const label = `Reeling: ${this.caughtFish.name}...`;
            ctx.strokeText(label, playerScreenX, this.player.y - 12);
            ctx.fillText(label, playerScreenX, this.player.y - 12);
            ctx.restore();
        }
    }

    reset() {
        this.isCasting = false;
        this.isBaitInWater = false;
        this.isSinking = false;
        this.vx = 0; this.vy = 0;
        this.x = this.player.x + 20;
        this.y = this.player.y;
        this.angle = -Math.PI / 4;
        this.power = 0;
        this.reeling = false;
        this.struggling = false;
        this.catchProgress = 0;
        this.reelTimer = 0;
        this.landedX = null;
        this.landedY = null;
        this.caughtFish = null;
        this.depthOffset = 0;
    }
}