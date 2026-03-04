import { GROUND_Y, PIER_END_X } from './constants.js';
import { Rod } from './fishing.js';

export class Player {
    constructor() {
        this.scale = 2; 
        this.frameW = 48; 
        this.frameH = 48;
        
        this.x = 180;
        this.y = GROUND_Y - (this.frameH * this.scale); 
        
        this.vx = 0;
        this.facing = 1; 

        this.walkImg = new Image();
        this.walkImg.src = 'assets/Fisherman_walk.png'; 
        
        this.idleImg = new Image();
        this.idleImg.src = 'assets/Fisherman_idle.png'; 

        this.currentFrame = 0;
        this.frameTimer = 0;
        this.isMoving = false;
        this.lastState = false; // To track if we just changed from walking to idle

        this.rod = new Rod(this);
    }

    update(dt, G) {
        // Track state from the previous frame
        this.lastState = this.isMoving;
        this.isMoving = false;
        const speed = 3;

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

        // RESET FRAME ON STATE CHANGE: 
        // This stops the "flicker" when swapping between Walk (6 frames) and Idle (4 frames)
        if (this.lastState !== this.isMoving) {
            this.currentFrame = 0;
            this.frameTimer = 0;
        }

        this.x += this.vx;
        this.x = Math.max(0, Math.min(this.x, PIER_END_X));

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
        this.rod.update(G.keys);
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
        
        // Using Math.floor on everything to prevent "Sub-pixel jitter" flickering
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