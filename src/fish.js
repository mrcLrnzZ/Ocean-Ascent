// src/fish.js

// Only src, frames count, and desired render scale needed per type.
// frameW/frameH are derived automatically from the loaded image.
const SPRITE_DATA = {
    small:  { src: 'assets/anchovyy.png',          frames: 4, renderScale: 0.2 },
    medium: { src: 'assets/doomsday-oarfishF.png', frames: 4, renderScale: 0.4 },
    rare:   { src: 'assets/swordfish.png',          frames: 4, renderScale: 0.5 },
    boss: { src: 'assets/doomsday-oarfishF.png', frames: 6, renderScale: 10 },
};

export class Fish {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;

        this.speed = (Math.random() * 0.5) + 0.2;
        this.direction = Math.random() < 0.5 ? -1 : 1;

        const data = SPRITE_DATA[type] || SPRITE_DATA.small;
        this.frames      = data.frames;
        this.renderScale = data.renderScale;

        // These are set once the image loads
        this.frameW  = null;
        this.frameH  = null;
        this.renderW = null;
        this.renderH = null;

        this.frameIndex = Math.floor(Math.random() * this.frames);
        this.frameTick  = 0;
        this.frameRate  = 30;

        this.img = new Image();
        this.img.onload = () => {
            // ✅ Derive frame size from actual image dimensions at load time
            this.frameW  = this.img.naturalWidth / this.frames;
            this.frameH  = this.img.naturalHeight;
            this.renderW = this.frameW * this.renderScale;
            this.renderH = this.frameH * this.renderScale;
        };
        this.img.src = data.src;
    }

    update() {
        this.x += this.speed * this.direction;

        this.frameTick++;
        if (this.frameTick >= this.frameRate) {
            this.frameTick = 0;
            this.frameIndex = (this.frameIndex + 1) % this.frames;
        }

        if (Math.random() < 0.005) {
            this.direction *= -1;
        }
    }

    draw(ctx, cameraX = 0) {
        // Skip until image and dimensions are ready
        if (!this.img.complete || !this.frameW) {
            return;
        }

        const screenX = this.x - cameraX;
        const screenY = this.y;
        const sx = this.frameIndex * this.frameW;

        ctx.save();

        if (this.direction < 0) {
            ctx.translate(screenX, screenY);
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.img,
                sx, 0, this.frameW, this.frameH,
                -this.renderW / 2, -this.renderH / 2,
                this.renderW, this.renderH
            );
        } else {
            ctx.drawImage(
                this.img,
                sx, 0, this.frameW, this.frameH,
                screenX - this.renderW / 2, screenY - this.renderH / 2,
                this.renderW, this.renderH
            );
        }

        ctx.restore();
    }
}