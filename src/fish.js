// src/fish.js

const SPRITE_DATA = {
    common:  { src: 'assets/anchovyy.png',          frames: 4, renderScale: 0.2, name: 'Anchovy' },
    uncommon: { src: 'assets/swordfish.png', frames: 4, renderScale: 0.29, name: 'Swordfish' },
    rare:   { src: 'assets/doomsday-oarfishF.png',          frames: 4, renderScale: 0.59, name: 'Doomsday Oarfish' },
    epic:   { src: 'assets/swordfish.png',            frames: 4, renderScale: 0.2, name: 'Epic Fish' },
    legendary: { src: 'assets/swordfish.png',     frames: 4, renderScale: 0.2, name: 'Legendary Fish' }
};

export class Fish {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;

        // Movement
        this.speed = (Math.random() * 0.5) + 0.2;
        this.direction = Math.random() < 0.5 ? -1 : 1;

        this.caught = false;
        this.inHitbox = false;

        // Sprite info based on type
        const data = SPRITE_DATA[type] || SPRITE_DATA.small;
        this.frames      = data.frames;
        this.renderScale = data.renderScale;
        this.name        = data.name;

        // Frame dimensions will be set after image loads
        this.frameW  = null;
        this.frameH  = null;
        this.renderW = null;
        this.renderH = null;

        // Randomize starting frame for animation
        this.frameIndex = Math.floor(Math.random() * this.frames); // start at random frame
        this.frameTick  = 0; // counts game ticks for frame switching
        this.frameRate  = 30; // ticks per frame change (lower = faster animation)

        this.img = new Image();
        this.img.onload = () => {
            this.frameW  = this.img.naturalWidth / this.frames; // width of one frame
            this.frameH  = this.img.naturalHeight;
            this.renderW = this.frameW * this.renderScale; // how wide it appears on screen
            this.renderH = this.frameH * this.renderScale; // how tall it appears on screen
        };
        this.img.onerror = () => {
            console.error(`Failed to load sprite for type "${type}": ${data.src}`);
        };
        this.img.src = data.src;
    }

    update() {
        if (this.caught) return; // stop moving if caught
        this.x += this.speed * this.direction; // move left or right

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
        if (!this.img.complete || !this.frameW) return;

        const screenX = this.x - cameraX; // adjust for camera
        const screenY = this.y;
        const sx = this.frameIndex * this.frameW; // source x in sprite sheet

        ctx.save();

        if (this.direction < 0) {
            ctx.translate(screenX, screenY); // move to fish position
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
        if (this.inHitbox && !this.caught) {
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, (this.renderW || 20) / 2 + 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}
