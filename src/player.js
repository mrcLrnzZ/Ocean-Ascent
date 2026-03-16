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
        this.idleImg = new Image();
        this.throwImg = new Image();
        this.fishIdleImg = new Image();
        
        this.rodLevel = 1;
        this.updateRodSprites();

        // Throw spritesheet: varies, 94px tall, each frame 127px wide
        this.throwFrameW = 127;
        this.throwFrameH = 94;
        this.throwFrameCount = 10;
        this.throwspeed = 1;

        // Fish-idle spritesheet: 508x94, 4 frames (127px each)
        this.fishIdleFrameW = 127; // 508 / 4
        this.fishIdleFrameH = 94;
        this.fishIdleFrameCount = 4;
        this.fishIdleFrameSpeed = 10; // ticks per frame (~6 fps)
        this.isFishIdle = false;
        this.fishIdleFrame = 0;
        this.fishIdleTimer = 0;

        this.currentFrame = 0;
        this.frameTimer = 0;
        this.isMoving = false;
        this.lastState = false;

        // Throw animation state
        this.isThrowAnim = false;
        this.throwFrame = 0;
        this.throwTimer = 0;
        // 1 second total / 10 frames = 6 ticks per frame at 60fps
        this.throwFrameDuration = Math.ceil((this.throwspeed * 60) / this.throwFrameCount); // 6 ticks
        // Pending cast data stored when spacebar released, used after anim
        this._pendingCast = null;

        // --- Game state ---
        this.state = 'walking'; // 'walking', 'onBoat'
        this.money = 2000;
        this.boatLevel = 0;

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

    update(dt, G, boat, fishManager, currentMap = 0) {
        this.lastState = this.isMoving;
        this.isMoving = false;

        const speed = 30;

        if (this.state === 'onBoat' && boat) {
            this.boatRef = boat;
            const bounds = boat.getBounds();

            // Initialize relative X if needed
            if (this.relBoatX === undefined) {
                this.relBoatX = this.x - boat.x;
            }

            if (boat.state === 'sailing' || boat.state === 'fishing') {
                this.vx = 0;
                this.isMoving = false;
                // Position is locked relative to boat while sailing/fishing
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

                // Move relative to boat
                this.relBoatX += this.vx * dt;
            }

            // Keep player on boat deck
            this.relBoatX = Math.max(0, Math.min(this.relBoatX, bounds.width - this.frameW * this.scale));
            
            // Sync absolute world position
            this.x = boat.x + this.relBoatX;

            // Vertical position with waves & tilt
            const playerRelCenter = this.relBoatX + (this.frameW * this.scale) / 2 - (bounds.width / 2);
            const tiltAngle = (playerRelCenter / (bounds.width / 2)) * 0.1;
            const yOffset = playerRelCenter * Math.sin(tiltAngle);
            const floatingY = waveSurf(boat.x + bounds.width / 2, G.frame) - bounds.height * 0.8;
            this.y = floatingY - (this.frameH * this.scale) + yOffset + boat.floorYOffset;

            // Dynamic rod sink depth for boat
            this.rod.sinkDepth = 200 + 100 * (boat.level - 1); 
        } else {
            this.boatRef = null;
            this.relBoatX = undefined; // Reset when not on boat
            // Walking logic
            const isFishing = this.rod.isCasting || this.rod.power > 0 || this.rod.reeling || this.rod.struggling || this.isThrowAnim;

            if (isFishing) {
                this.vx = 0;
                this.isMoving = false;
            } else if (G.keys['ArrowRight'] || G.keys['d']) {
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

            // Shore rod depth
            this.rod.sinkDepth = 100;
        }

        // Rod update runs FIRST so this.originX/Y is fresh for the throw/fishidle ticks below.
        // This ensures _fireCast() launches the hook from the exact rod tip of the final throw frame.
        this.rod.update(G.keys, this.isThrowAnim, currentMap);

        // --- Throw animation tick ---
        if (this.isThrowAnim) {
            this.throwTimer++;
            if (this.throwTimer >= this.throwFrameDuration) {
                this.throwTimer = 0;
                this.throwFrame++;
                if (this.throwFrame >= this.throwFrameCount) {
                    // Animation done — fire the cast from the CURRENT rod tip
                    this.throwFrame = this.throwFrameCount - 1;
                    this.isThrowAnim = false;
                    if (this._pendingCast) {
                        this.rod._fireCast(this._pendingCast);
                        this._pendingCast = null;
                    }
                    // Start fish-idle loop
                    this.isFishIdle = true;
                    this.fishIdleFrame = 0;
                    this.fishIdleTimer = 0;
                }
            }
        }

        // --- Fish-idle animation tick (loops while hook is in water) ---
        if (this.isFishIdle) {
            // Exit when the rod resets (fish caught or empty reel returns)
            if (!this.rod.isCasting && !this.rod.reeling && !this.rod.struggling) {
                this.isFishIdle = false;
                this.fishIdleFrame = 0;
                this.fishIdleTimer = 0;
            } else {
                this.fishIdleTimer++;
                if (this.fishIdleTimer >= this.fishIdleFrameSpeed) {
                    this.fishIdleTimer = 0;
                    this.fishIdleFrame = (this.fishIdleFrame + 1) % this.fishIdleFrameCount;
                }
            }
        }

        // Walk/idle sprite frame counter
        if (this.lastState !== this.isMoving) {
            this.currentFrame = 0;
            this.frameTimer = 0;
        }
        this.frameTimer++;
        if (this.isMoving) {
            if (this.frameTimer >= 7) { this.currentFrame = (this.currentFrame + 1) % 6; this.frameTimer = 0; }
        } else {
            if (this.frameTimer >= 12) { this.currentFrame = (this.currentFrame + 1) % 4; this.frameTimer = 0; }
        }
    }

    updateRodSprites() {
        console.log(`Updating rod sprites for level ${this.rodLevel}`);
        if (this.rodLevel == 2) {
            // Level 2+ uses the new rod folder sprites (currently only red is provided)
            // We can extend this logic as more tiers (blue, gold, etc) are added.
            const folder = 'assets/rod/';
            this.walkImg.src = `${folder}walk_red.png`;
            this.idleImg.src = `${folder}idle_red.png`;
            this.throwImg.src = `${folder}fullthrow_red.png`;
            this.fishIdleImg.src = `${folder}fishidle_red.png`;
        }else if (this.rodLevel === 3) {
            const folder = 'assets/rod/';
            this.walkImg.src = `${folder}walk_green.png`;
            this.idleImg.src = `${folder}idle_green.png`;
            this.throwImg.src = `${folder}fullthrow_green.png`;
            this.fishIdleImg.src = `${folder}fishidle_green.png`;
        }else if (this.rodLevel === 4) {
            const folder = 'assets/rod/';
            this.walkImg.src = `${folder}walk_gold.png`;
            this.idleImg.src = `${folder}idle_gold.png`;
            this.throwImg.src = `${folder}fullthrow_gold.png`;
            this.fishIdleImg.src = `${folder}fishidle_gold.png`;
        }else if (this.rodLevel === 5) {
            const folder = 'assets/rod/';
            this.walkImg.src = `${folder}walk_legendary.png`;
            this.idleImg.src = `${folder}idle_legendary.png`;
            this.throwImg.src = `${folder}fullthrow_legendary.png`;
            this.fishIdleImg.src = `${folder}fishidle_legendary.png`;
        } else {
            // Default Level 1
            this.walkImg.src = 'assets/Fisherman_walkv2.png';
            this.idleImg.src = 'assets/Fishermanred_idlev2.png';
            this.throwImg.src = 'assets/Fisherman_throw10.png';
            this.fishIdleImg.src = 'assets/Fisherman_fishidle.png';
        }
    }

    draw(ctx, cx) {
        const screenX = this.x - cx;

        if (this.isThrowAnim && this.throwImg.complete && this.throwImg.naturalWidth !== 0) {
            // Draw throw spritesheet frame
            const drawW = this.throwFrameW * this.scale;
            const drawH = this.throwFrameH * this.scale;
            ctx.save();
            ctx.translate(Math.floor(screenX + drawW / 2), Math.floor(this.y));
            ctx.scale(this.facing, 1);
            ctx.drawImage(
                this.throwImg,
                Math.floor(this.throwFrame * this.throwFrameW), 0,
                this.throwFrameW, this.throwFrameH,
                Math.floor(-drawW / 2), 0,
                drawW, drawH
            );
            ctx.restore();
            this.rod.draw(ctx, cx);
            return;
        }

        if (this.isFishIdle && this.fishIdleImg.complete && this.fishIdleImg.naturalWidth !== 0) {
            // Draw looping fish-idle spritesheet
            const drawW = this.fishIdleFrameW * this.scale;
            const drawH = this.fishIdleFrameH * this.scale;
            ctx.save();
            ctx.translate(Math.floor(screenX + drawW / 2), Math.floor(this.y));
            ctx.scale(this.facing, 1);
            ctx.drawImage(
                this.fishIdleImg,
                Math.floor(this.fishIdleFrame * this.fishIdleFrameW), 0,
                this.fishIdleFrameW, this.fishIdleFrameH,
                Math.floor(-drawW / 2), 0,
                drawW, drawH
            );
            ctx.restore();
            this.rod.draw(ctx, cx);
            return;
        }

        const activeImg = this.isMoving ? this.walkImg : this.idleImg;
        if (!activeImg.complete || activeImg.naturalWidth === 0) {
            ctx.fillStyle = "rgba(255,0,0,0.5)";
            ctx.fillRect(this.x - cx, this.y, this.frameW * this.scale, this.frameH * this.scale);
            return;
        }

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