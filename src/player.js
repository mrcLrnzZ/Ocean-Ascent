// src/player.js
import { GROUND_Y, PIER_END_X } from './constants.js';
import { waveSurf } from './environment.js';
import { Rod } from './fishing.js';

export class Player {
    constructor(fishManager) {
        // --- Graphics ---
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

        // --- Game state ---
        this.state = 'walking'; // 'walking', 'onBoat'
        this.money = 2000;
        this.boatLevel = 0;
        this.rodLevel = 1;

        // --- Fishing ---
        this.rod = new Rod(this, fishManager);

        // --- Inventory ---
        this.inventory = {
            anchovy: 0, sardine: 0, clownfish: 0,
            tuna: 0, swordfish: 0, mahi_mahi: 0,
            cod: 0, pufferfish: 0, sunfish: 0,
            oarfish: 0, anglerfish: 0, coelacanth: 0,
            reaper: 0, megalodon: 0, kraken: 0
        };
    }

    update(dt, G, boat, fishManager) {
        this.lastState = this.isMoving;
        this.isMoving = false;

        const speed = 30;

        if (this.state === 'onBoat' && boat) {
            this.boatRef = boat;
            const bounds = boat.getBounds();

            if (boat.state === 'sailing' || boat.state === 'fishing') {
                this.vx = 0;
                this.isMoving = false;
                if (boat.state === 'sailing') {
                    this.x += boat.vx; // move with boat
                }
            } else {
                if (G.keys['ArrowRight'] || G.keys['d']) {
                    this.vx = speed;
                    this.facing = 1;
                    this.isMoving = true;
                } else if (G.keys['ArrowLeft'] || G.keys['a']) {
                    this.vx = -speed;
                    this.facing = -1;
                    this.isMoving = true;
                } else this.vx = 0;

                this.x += (this.vx + boat.vx) * dt;
            }

            // Keep player on boat
            this.x = Math.max(bounds.left, Math.min(this.x, bounds.right - this.frameW * this.scale));

            // Vertical position with waves & tilt
            const playerRelCenter = this.x + (this.frameW * this.scale) / 2 - (boat.x + bounds.width / 2);
            const tiltAngle = (playerRelCenter / (bounds.width / 2)) * 0.1;
            const yOffset = playerRelCenter * Math.sin(tiltAngle);
            const floatingY = waveSurf(boat.x + bounds.width / 2, G.frame) - bounds.height * 0.8;
            this.y = floatingY - (this.frameH * this.scale) + yOffset + boat.floorYOffset;

            // Dynamic rod sink depth for boat
            this.rod.sinkDepth = 200 + 100 * (boat.level - 1); // example: deeper with upgraded boat
        } else {
            this.boatRef = null;
            // Walking logic
            if (G.keys['ArrowRight'] || G.keys['d']) {
                this.vx = speed;
                this.facing = 1;
                this.isMoving = true;
            } else if (G.keys['ArrowLeft'] || G.keys['a']) {
                this.vx = -speed;
                this.facing = -1;
                this.isMoving = true;
            } else this.vx = 0;

            this.x += this.vx * dt;
            this.x = Math.max(0, Math.min(this.x, PIER_END_X));
            this.y = GROUND_Y - (this.frameH * this.scale);

            // Shore rod depth
            this.rod.sinkDepth = 100;
        }

        // Reset frame on state change
        if (this.lastState !== this.isMoving) {
            this.currentFrame = 0;
            this.frameTimer = 0;
        }

        this.frameTimer++;
        if (this.isMoving) {
            if (this.frameTimer >= 7) {
                this.currentFrame = (this.currentFrame + 1) % 6;
                this.frameTimer = 0;
            }
        } else {
            if (this.frameTimer >= 12) {
                this.currentFrame = (this.currentFrame + 1) % 4;
                this.frameTimer = 0;
            }
        }

        // Update rod every frame
        this.rod.update(G.keys);
    }

    draw(ctx, cx) {
        const activeImg = this.isMoving ? this.walkImg : this.idleImg;
        if (!activeImg.complete || activeImg.naturalWidth === 0) {
            ctx.fillStyle = "rgba(255,0,0,0.5)";
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

        // Draw rod & bait in front of player
        this.rod.draw(ctx, cx);
    }
}