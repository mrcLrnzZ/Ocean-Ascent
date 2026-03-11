// src/fish.js
import { getDeepSoilY, getDeepSoilX } from './constants.js';

export const SPRITE_DATA = {
    // Level 1: Surface
    anchovy: { src: 'assets/anchovyy.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.2, name: 'Anchovy', rarity: 'common', desc: 'A tiny, silvery fish found swimming in large schools near the surface.' },
    sardine: { src: 'assets/anchovyy.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.22, name: 'Sardine', rarity: 'common', desc: 'Slightly larger than an anchovy, these quick fish are a staple food for many ocean predators.' },
    clownfish: { src: 'assets/anchovyy.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.18, name: 'Clownfish', rarity: 'common', desc: 'Bright orange with white stripes. Rarely strays far from the safety of its home.' },

    // Level 2: Mid-Shallows
    tuna: { src: 'assets/swordfish.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.2, name: 'Tuna', rarity: 'uncommon', desc: 'A fast, torpedo-shaped predator built for speed and endurance.' },
    swordfish: { src: 'assets/swordfish.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.29, name: 'Swordfish', rarity: 'uncommon', desc: 'Recognized by its elongated, sword-like bill used to slash at prey.' },
    mahi_mahi: { src: 'assets/swordfish.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.25, name: 'Mahi Mahi', rarity: 'uncommon', desc: 'Also known as the dolphinfish, it dazzles with vibrant green and golden hues.' },

    // Level 3: Deep
    cod: { src: 'assets/anchovyy.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.3, name: 'Cod', rarity: 'rare', desc: 'A heavy-bodied fish that prefers colder, deeper waters.' },
    pufferfish: { src: 'assets/anchovyy.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.2, name: 'Pufferfish', rarity: 'rare', desc: 'Inflates into a spiky ball when threatened. Highly toxic if prepared incorrectly.' },
    sunfish: { src: 'assets/swordfish.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.4, name: 'Sunfish', rarity: 'rare', desc: 'A bizarre, flattened giant that often basks sideways near the surface, but dives deep for jellyfish.' },

    // Level 4: Trench
    oarfish: { src: 'assets/doomsday-oarfishF.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.59, name: 'Doomsday Oarfish', rarity: 'epic', desc: 'A long, ribbon-like creature. Often mistaken for a sea serpent by sailors.' },
    anglerfish: { src: 'assets/doomsday-oarfishF.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.3, name: 'Anglerfish', rarity: 'epic', desc: 'Uses a bioluminescent lure sprouting from its head to attract prey in the pitch black.' },
    coelacanth: { src: 'assets/doomsday-oarfishF.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.35, name: 'Coelacanth', rarity: 'epic', desc: 'A living fossil with lobed fins, thought to be extinct for millions of years.' },

    // Level 5 & 6: Abyss
    reaper: { src: 'assets/doomsday-oarfishF.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.7, name: 'Reaper Leviathan', rarity: 'legendary', desc: 'A terrifying apex predator with mandibles designed to crush reinforced hulls.' },
    megalodon: { src: 'assets/doomsday-oarfishF.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.8, name: 'Megalodon', rarity: 'legendary', desc: 'An ancient, massive shark. Only the bravest or most foolish would try to catch one.' },
    kraken: { src: 'assets/doomsday-oarfishF.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.9, name: 'Kraken', rarity: 'legendary', desc: 'A mythic cephalopod of unimaginable size. Its tentacles can drag ships into the abyss.' }
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
        const data = SPRITE_DATA[type] || SPRITE_DATA.anchovy;
        this.frames = data.frames;
        this.renderScale = data.renderScale;
        this.name = data.name;

        // Frame dimensions will be set after image loads
        this.frameW = null;
        this.frameH = null;
        this.renderW = null;
        this.renderH = null;

        // Randomize starting frame for animation
        this.frameIndex = Math.floor(Math.random() * this.frames); // start at random frame
        this.frameTick = 0; // counts game ticks for frame switching
        this.frameRate = 30; // ticks per frame change (lower = faster animation)

        this.img = new Image();
        this.img.onload = () => {
            this.frameW = this.img.naturalWidth / this.frames; // width of one frame
            this.frameH = this.img.naturalHeight;
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

        // Prevent fish from swimming into the deep soil slope
        const groundY = getDeepSoilY(this.x);
        if (this.y >= groundY) {
            // Push out horizontally
            this.direction = 1; // force them to swim right
            this.x = getDeepSoilX(this.y) + 1;
        }

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
