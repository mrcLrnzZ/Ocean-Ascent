import { GROUND_Y } from './constants.js';
import { audio } from './main.js';
export class Merchant {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.frameW = 90;
        this.frameH = 90;
        this.scale = 1.5;

        this.img = new Image();
        this.img.src = 'assets/merchant_idle.png';

        this.currentFrame = 0;
        this.frameTimer = 0;
        this.interactionRadius = 250;
    }

    update() {
        this.frameTimer++;
        if (this.frameTimer >= 12) {
            this.currentFrame = (this.currentFrame + 1) % 4; // 4-frame idle
            this.frameTimer = 0;
        }
    }

    isNear(player) {
        const dx = (this.x + (this.frameW * this.scale) / 2) - (player.x + (player.frameW * player.scale) / 2);
        const dist = Math.abs(dx);
        return dist < this.interactionRadius;
    }

    draw(ctx, cx, player) {
        if (!this.img.complete || this.img.naturalWidth === 0) {
            ctx.fillStyle = "purple";
            ctx.fillRect(this.x - cx, this.y - (this.frameH * this.scale), this.frameW * this.scale, this.frameH * this.scale);
            return;
        }

        const screenX = this.x - cx;
        const drawW = this.frameW * this.scale;
        const drawH = this.frameH * this.scale;
        const drawY = this.y - drawH;

        ctx.drawImage(
            this.img,
            Math.floor(this.currentFrame * this.frameW), 0,
            this.frameW, this.frameH,
            Math.floor(screenX), Math.floor(drawY),
            drawW, drawH
        );

        // Interaction prompt
        if (this.isNear(player)) {
            ctx.fillStyle = "white";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Press [E] to Trade", screenX + drawW / 2, this.y - 120);

            // Subtle floating effect for prompt
            const bounce = Math.sin(Date.now() * 0.005) * 5;
            ctx.fillText("▼", screenX + drawW / 2, drawY - 5 + bounce);
        }
    }
}
