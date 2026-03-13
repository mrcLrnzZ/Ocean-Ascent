import { GROUND_Y } from './constants.js';
import { waveSurf } from './environment.js';
import { audio } from './main.js';
export class Merchant {
    constructor(x, y, type = "boat") {
        this.x = x;
        this.y = y;
        this.type = type;
        this.frameW = 90;
        this.frameH = 90;
        this.scale = 1.5;

        this.img = new Image();
        this.img.src = type === "boat" ? 'assets/merchant_idle.png' : 'assets/Fishermanred_idlev2.png';

        this.currentFrame = 0;
        this.frameTimer = 0;
        this.interactionRadius = 150;
        this.facing = 1;
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
            ctx.fillStyle = this.type === "boat" ? "purple" : "blue";
            ctx.fillRect(this.x - cx, this.y - (this.frameH * this.scale), this.frameW * this.scale, this.frameH * this.scale);
            return;
        }

        const screenX = this.x - cx;
        const drawW = this.frameW * this.scale;
        const drawH = this.frameH * this.scale;
        const drawY = this.y - drawH;

        ctx.save();
        ctx.translate(Math.floor(screenX + drawW / 2), Math.floor(drawY));
        ctx.scale(this.facing, 1);
        ctx.drawImage(
            this.img,
            Math.floor(this.currentFrame * this.frameW), 0,
            this.frameW, this.frameH,
            Math.floor(-drawW / 2), 0,
            drawW, drawH
        );
        ctx.restore();

        // Interaction prompt
        if (this.isNear(player)) {
            ctx.fillStyle = "white";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.fillText(`Press [E] to Trade (${this.type === "boat" ? "Boat" : "Rod"})`, screenX + drawW / 2, drawY - 30);

            // Subtle floating effect for prompt
            const bounce = Math.sin(Date.now() * 0.005) * 5;
            ctx.fillText("▼", screenX + drawW / 2, drawY - 15 + bounce);
        }
    }
}

export class RodMerchant extends Merchant {
    constructor(x, y) {
        super(x, y, "rod");
        this.onBoat = false;
        this.walkingToBoat = false;
        this.walkImg = new Image();
        this.walkImg.src = 'assets/Fisherman_walkv2.png';
        this.idleImg = this.img;
        this.speed = 2;
    }

    update(boat, frame) {
        if (this.onBoat) {
            const bounds = boat.getBounds();
            // Middle of the boat
            this.x = boat.x + (bounds.width / 2) - (this.frameW * this.scale) / 2;
            
            // Floating with waves (similar to boat/player logic)
            const floatingY = waveSurf(boat.x + bounds.width / 2, frame) - bounds.height * 0.8;
            this.y = floatingY + boat.floorYOffset; // Higher than player slightly? No, use floor offset.
            
            this.img = this.idleImg;
            this.interactionRadius = 100;
        } else if (boat.isPurchased) {
            this.walkingToBoat = true;
            const targetX = boat.x + (boat.width * boat.scale / 2);
            if (Math.abs(this.x - targetX) > 5) {
                this.facing = this.x < targetX ? 1 : -1;
                this.x += this.facing * this.speed;
                this.img = this.walkImg;
                
                // Animation
                this.frameTimer++;
                if (this.frameTimer >= 7) {
                    this.currentFrame = (this.currentFrame + 1) % 6;
                    this.frameTimer = 0;
                }
            } else {
                this.onBoat = true;
                this.walkingToBoat = false;
            }
        } else {
            // Normal idle update
            super.update();
        }
    }
}
