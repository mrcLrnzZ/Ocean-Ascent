import { waveSurf } from './environment.js';
import { W } from './constants.js';

export class Boat {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 40;
        this.scale = 6;

        this.img = new Image();
        this.img.src = 'assets/boatlvl1.png';

        this.floorYOffset = 140; // Adjust this to move player up/down on boat deck

        this.isPurchased = false;
        this.isFlipped = false;
        this.level = 0;
        this.state = 'idle'; // 'idle', 'sailing', 'fishing'
        this.vx = 0;
        this.speed = 5;
    }

    setLevel(lvl) {
        this.isPurchased = true;
        this.level = lvl;
        if (lvl === 1) {
            this.img.src = 'assets/boatlvl1.png';
            this.speed = 10;
            this.scale = 6;
            this.width = 80;
            this.height = 40;
            this.floorYOffset = 140;
        }
        if (lvl === 2) {
            this.img.src = 'assets/boatlvl2.png';
            this.speed = 20;
            this.scale = 4;
            this.width = 128;
            this.height = 128;
            this.floorYOffset = 370;
        }
        if (lvl === 3) {
            this.img.src = 'assets/boatlvl3.png';
            this.speed = 30;
            this.scale = 6;
            this.width = 128;
            this.height = 128;
            this.floorYOffset = 530;
        }
    }

    getBounds() {
        const drawW = this.width * this.scale;
        const drawH = this.height * this.scale;
        return {
            left: this.x,
            right: this.x + drawW,
            top: this.y,
            bottom: this.y + drawH,
            width: drawW,
            height: drawH
        };
    }

    update(G, rodMerchant) {
        if (!this.isPurchased) return;

        if (this.state === 'sailing') {
            // Prevent sailing if the merchant isn't onboard yet (except on the ending map or if he's already left permanently)
            if (rodMerchant && !rodMerchant.onBoat && G.currentMap !== 4 && !rodMerchant.hasLeftPermanently) {
                this.vx = 0;
                return;
            }

            if (G.keys['ArrowRight'] || G.keys['d']) {
                this.vx = this.speed;
            } else if (G.keys['ArrowLeft'] || G.keys['a']) {
                this.vx = -this.speed;
            } else {
                this.vx = 0;
            }
            this.x += this.vx;
        } else {
            this.vx = 0;
        }
    }

    draw(ctx, cx, frame, player) {
        if (!this.isPurchased) return;

        const bounds = this.getBounds();
        const screenX = this.x - cx;

        // Float with the wave surf
        const floatingY = waveSurf(this.x + bounds.width / 2, frame) - bounds.height * 0.8;

        // Buoyancy tilt logic
        let tiltAngle = 0;
        if (player.state === 'onBoat') {
            const playerRelCenter = player.x + (player.frameW * player.scale) / 2 - (this.x + bounds.width / 2);
            tiltAngle = (playerRelCenter / (bounds.width / 2)) * 0.1;
        }

        ctx.save();
        ctx.translate(screenX + bounds.width / 2, floatingY + bounds.height);
        ctx.rotate(tiltAngle);

        if (this.isFlipped) {
            ctx.scale(1, -1);
        }

        if (!this.img.complete || this.img.naturalWidth === 0) {
            ctx.fillStyle = "brown";
            ctx.fillRect(-bounds.width / 2, -bounds.height, bounds.width, bounds.height);
        } else {
            ctx.drawImage(this.img, -bounds.width / 2, -bounds.height, bounds.width, bounds.height);
        }
        ctx.restore();

        // Show interaction prompts if player is on boat OR near it at dock
        if (player.state === 'onBoat') {
            const playerRelCenterX = (player.x + 64) - this.x;
            const zoneWidth = bounds.width / 3;

            ctx.fillStyle = "white";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";

            // Anchor prompts above player's head instead of the boat top (which can be off-screen for Level 3)
            const promptY = player.y - 20;

            if (playerRelCenterX < zoneWidth) {
                // Left zone: Fishing
                const action = this.state === 'fishing' ? "Stop Fishing" : "Fish";
                ctx.fillText(`Press [E] to ${action}`, screenX + zoneWidth / 2, promptY);
            } else if (playerRelCenterX > bounds.width - zoneWidth) {
                // Right zone: Navigation
                const action = this.state === 'sailing' ? "Stop Sailing" : "Sail";
                ctx.fillText(`Press [E] to ${action}`, screenX + bounds.width - zoneWidth / 2, promptY);
            } else if (this.state === 'idle') {
                const isAtEndingDock = Math.abs(this.x - 2600) < 200;
                const isAtStartingDock = Math.abs(this.x - 750) < 100;
                if (isAtEndingDock || isAtStartingDock) {
                    ctx.fillText("Press [R] to Disembark", screenX + bounds.width / 2, promptY - 40);
                }
            }
        } else if (Math.abs(player.x - this.x) < 100 && player.state === 'walking') {
            // Near boat at dock
            ctx.fillStyle = "white";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Press [R] to Board Boat", screenX + bounds.width / 2, player.y - 20);
        }
    }
}
