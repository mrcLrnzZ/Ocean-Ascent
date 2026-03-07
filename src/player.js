import { GROUND_Y, PIER_END_X } from './constants.js';
import { waveSurf } from './environment.js';
      import { Rod } from './fishing.js';

export class Player {
    constructor() {
        this.scale = 1.5;
        this.frameW = 90;
        this.frameH = 90;

        this.x = 100;
        this.y = GROUND_Y - (this.frameH * this.scale);

        this.vx = 0;

        this.facing = 1;

        this.walkImg = new Image();
        this.walkImg.src = 'assets/Fisherman_walkv2.png';

        this.idleImg = new Image();
        this.idleImg.src = 'assets/Fishermanred_idlev2.png';

        this.currentFrame = 0;
        this.frameTimer = 0;
        this.isMoving = false;
        this.lastState = false;
       this.rod = new Rod(this, fishManager);
        this.state = 'walking'; // 'walking', 'onBoat'

        // Progression logic
        this.money = 1000;
        this.boatLevel = 0; // 0 = none, 1 = lvl1, 2 = lvl2, 3 = lvl3
        this.rodLevel = 1;  // 1 to 5
    }

    update(dt, G, boat) {
        this.lastState = this.isMoving;
        this.isMoving = false;

        if (this.state === 'onBoat' && boat) {
            // Player movement restricted to boat width
            const bounds = boat.getBounds();
            const playerSpeed = 3;

            if (boat.state === 'sailing') {
                this.vx = 0;
                this.isMoving = false;
                this.x += boat.vx; // player moves exactly with the boat
            } else {
                if (G.keys['ArrowRight'] || G.keys['d']) {
                    this.vx = playerSpeed;
                    this.facing = 1;
                    this.isMoving = true;
                } else if (G.keys['ArrowLeft'] || G.keys['a']) {
                    this.vx = -playerSpeed;
                    this.facing = -1;
                    this.isMoving = true;
                } else {
                    this.vx = 0;
                }
                this.x += (this.vx + boat.vx) * dt;
            }

            // Keep player on boat
            this.x = Math.max(bounds.left, Math.min(this.x, bounds.right - this.frameW * this.scale));

            // Adjust vertical position with boat tilt and floor offset + wave bouncing
            const playerRelCenter = this.x + (this.frameW * this.scale) / 2 - (boat.x + bounds.width / 2);
            const tiltAngle = (playerRelCenter / (bounds.width / 2)) * 0.1;
            const yOffset = playerRelCenter * Math.sin(tiltAngle);
            const floatingY = waveSurf(boat.x + bounds.width / 2, G.frame) - bounds.height * 0.8;
            this.y = floatingY - (this.frameH * this.scale) + yOffset + boat.floorYOffset;

        } else {
            // Normal walking logic
            const speed = 30;

            if (G.keys['ArrowRight'] || G.keys['d']) {
                this.vx = speed;
                this.facing = 1;
                this.isMoving = true;
            } else if (G.keys['ArrowLeft'] || G.keys['a']) {
                this.vx = -speed;
                this.facing = -1;
                this.isMoving = true;
            } else {
                this.vx = 0;
            }

            this.x += this.vx * dt;
            this.x = Math.max(0, Math.min(this.x, PIER_END_X));

            this.y = GROUND_Y - (this.frameH * this.scale);
        }

        if (this.lastState !== this.isMoving) {
            this.currentFrame = 0;
            this.frameTimer = 0;
        }

        this.frameTimer++;

        if (this.isMoving) {
            if (this.frameTimer >= 7) {
                this.currentFrame = (this.currentFrame + 1) % 6; // 6-frame walk
                this.frameTimer = 0;
            }
        } else {
            if (this.frameTimer >= 12) {
                this.currentFrame = (this.currentFrame + 1) % 4; // 4-frame idle
                this.frameTimer = 0;
            }
        }
        this.rod.update(G.keys); // Update the rod with current input state
    }

    draw(ctx, cx) {
        const activeImg = this.isMoving ? this.walkImg : this.idleImg;

        if (!activeImg.complete || activeImg.naturalWidth === 0) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fillRect(this.x - cx, this.y, this.frameW * this.scale, this.frameH * this.scale);
            return;
        }

        const screenX = this.x - cx;
        const drawW = this.frameW * this.scale;
        const drawH = this.frameH * this.scale;

        ctx.save();

        ctx.translate(Math.floor(screenX + drawW / 2), Math.floor(this.y));

        ctx.scale(this.facing, 1);

        ctx.drawImage(
            activeImg,
            Math.floor(this.currentFrame * this.frameW), 0,
            this.frameW, this.frameH,
            Math.floor(-drawW / 2), 0,
            drawW, drawH
        );

        ctx.restore();
        this.rod.draw(ctx, cx); // draw rod & bait after player so they appear in front of the water and ground
    }
}
