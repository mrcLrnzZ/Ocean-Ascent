// src/fishing.js
import { WATER_Y, GRAVITY } from './constants.js';

export class Rod {
    constructor(player) {
        this.player = player;
        this.x = player.x;
        this.y = player.y;

        // Physics
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 4; // initial angle
        this.power = 0;
        this.maxPower = 15;
        this.isCasting = false;
        this.isBaitInWater = false;

        // Bait sprite
        this.baitImg = new Image();
        this.baitImg.src = 'assets/doomsday-oarfish.png';
        this.baitSize = 16;

        // Reel-in
        this.reeling = false;
        this.reelTimer = 0;
        this.reelDuration = 500; // frames until reel back (~2 sec at 60fps)

        // Where the bait actually landed
        this.landedX = null;
        this.landedY = null;
    }

    update(keys) {
        // 1️⃣ Adjust angle & power if not casting
        if (!this.isCasting) {
            if (keys['w'] || keys['ArrowUp']) this.angle -= 0.02;
            if (keys['s'] || keys['ArrowDown']) this.angle += 0.02;

            if (keys[' ']) this.power = Math.min(this.power + 0.3, this.maxPower);

            // Release cast
            if (!keys[' ']) {
                if (this.power > 0) {
                    this.isCasting = true;
                    this.vx = Math.cos(this.angle) * this.power;
                    this.vy = Math.sin(this.angle) * this.power;
                    this.power = 0;
                    this.reelTimer = 0;
                    this.landedX = null;
                    this.landedY = null;
                }
            }
        }

        // 2️⃣ Update physics if casting
        if (this.isCasting && !this.reeling) {
            this.vy += GRAVITY;
            this.x += this.vx;
            this.y += this.vy;

            // Stop bait at water and save exact landing position
            if (!this.isBaitInWater && this.y >= WATER_Y) {
                this.y = WATER_Y;
                this.vx = 0;
                this.vy = 0;
                this.isBaitInWater = true;
                this.landedX = this.x; // ✅ save where it actually landed
                this.landedY = this.y;
            }

            // Lock bait to landed position while waiting
            if (this.isBaitInWater && this.landedX !== null) {
                this.x = this.landedX;
                this.y = this.landedY;
            }

            // Start automatic reeling after timer
            if (this.isBaitInWater) {
                this.reelTimer++;
                if (this.reelTimer >= this.reelDuration) {
                    this.reeling = true;
                }
            }
        }

        // 3️⃣ Reel-in animation
        if (this.reeling) {
            const dx = (this.player.x + 20 - this.x);
            const dy = (this.player.y - this.y);
            const dist = Math.hypot(dx, dy);

            const reelSpeed = 5;
            if (dist < reelSpeed) {
                this.reset();
            } else {
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * reelSpeed;
                this.y += Math.sin(angle) * reelSpeed;
            }
        }

        // 4️⃣ Keep bait near player before casting
        if (!this.isCasting && !this.reeling) {
            this.x = this.player.x + 20;
            this.y = this.player.y;
        }
    }

    draw(ctx, cameraX = 0) {
        const screenX = this.x - cameraX;
        const screenY = this.y;

        // --- Rod line ---
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.player.x - cameraX + 24, this.player.y + 20);

        if (this.isBaitInWater && !this.reeling && this.landedX !== null) {
            // Draw line to exact landed position, not a hardcoded offset
            ctx.lineTo(this.landedX - cameraX, this.landedY);
        } else {
            // In-flight or reeling: draw straight to current bait position
            ctx.lineTo(screenX, screenY);
        }
        ctx.stroke();

        // --- Angle indicator ---
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

        // --- Power meter ---
        if (!this.isCasting) {
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.player.x - cameraX, this.player.y - 10, this.maxPower * 4, 5);
            ctx.fillStyle = 'lime';
            ctx.fillRect(this.player.x - cameraX, this.player.y - 10, this.power * 4, 5);
        }

        // --- Draw bait ---
        if (this.baitImg.complete && this.baitImg.naturalWidth !== 0) {
            ctx.drawImage(
                this.baitImg,
                screenX - this.baitSize / 2,
                screenY - this.baitSize / 2,
                this.baitSize,
                this.baitSize
            );
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(screenX - this.baitSize / 2, screenY - this.baitSize / 2, this.baitSize, this.baitSize);
        }
    }

    reset() {
        this.isCasting = false;
        this.isBaitInWater = false;
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
    }
}
