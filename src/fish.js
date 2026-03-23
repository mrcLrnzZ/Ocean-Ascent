// src/fish.js
import { getDeepSoilY, getDeepSoilX, MAPS } from './constants.js';

export const SPRITE_DATA = {

    // Level 1: Surface
    anchovy: { src: 'assets/fish/anchovyy.png', almanacSrc: 'assets/almanac/almanacAnchovy.png', frames: 4, renderScale: 0.3, name: 'Anchovy', rarity: 'common', price: 10, hungerValue: 5.5, desc: 'A small silvery fish that travels in massive schools near the surface.', scale: 1 },
    bluetang: { src: 'assets/fish/bluetang.png', almanacSrc: 'assets/almanac/almanacBluetang.png', frames: 5, renderScale: 1, name: 'Bluetang', rarity: 'rare', price: 12, hungerValue: 0.8, desc: 'A swift schooling fish often found in shimmering clusters.', scale: 1.3 },
    clownfish: { src: 'assets/fish/clownfish.png', almanacSrc: 'assets/almanac/almanacClownfish.png', frames: 5, renderScale: 1, name: 'Clownfish', rarity: 'common', price: 15, hungerValue: 1, desc: 'A vibrant reef dweller known for its bright colors.', scale: 1.4 },

    // Level 2: Shallows
    swordfish: { src: 'assets/fish/swordfish.png', almanacSrc: 'assets/almanac/almanacSwordfish.png', frames: 4, renderScale: 0.29, name: 'Swordfish', rarity: 'uncommon', price: 28, hungerValue: 1.5, desc: 'Recognized by its long, blade-like snout.', scale: 1.2 },
    flowerhead: { src: 'assets/fish/flowerhead.png', almanacSrc: 'assets/almanac/almanacFlowerhead.png', frames: 6, renderScale: 0.29, name: 'Flowerhead', rarity: 'uncommon', price: 35, hungerValue: 1.8, desc: 'An agile fish with elegant movements.', scale: 1.4 },
    devilfish: { src: 'assets/fish/devilfish.png', almanacSrc: 'assets/almanac/almanacDevilfish.png', frames: 6, renderScale: 0.29, name: 'Devilfish', rarity: 'uncommon', price: 30, hungerValue: 1.5, desc: 'A sleek and aggressive predator built for speed.', scale: 1 },
    // Level 3: Mid-Deep
    choifish: { src: 'assets/fish/choifish.png', almanacSrc: 'assets/almanac/almanacChoifish.png', frames: 6, renderScale: 0.45, name: 'Choifish', rarity: 'rare', price: 60, hungerValue: 2.5, desc: 'A deep-water species with a sturdy build.', scale: 1.9 },
    shark: { src: 'assets/fish/shark.png', almanacSrc: 'assets/almanac/almanacShark.png', frames: 5, renderScale: 2.45, name: 'Shark', rarity: 'rare', price: 70, hungerValue: 3.5, desc: 'Apex predator often found patrolling the mid-depths.', scale: 1.8 },
    turtle: { src: 'assets/fish/turtle.png', almanacSrc: 'assets/almanac/almanacTurtle.png', frames: 5, renderScale: 2.88, name: 'Turtle', rarity: 'rare', price: 75, hungerValue: 3, desc: 'A massive, slow-moving marine reptile.', scale: 1.4 },
    sunfish: { src: 'assets/fish/sunfish.png', almanacSrc: 'assets/almanac/almanacSunfish.png', frames: 4, renderScale: 2.88, name: 'Sunfish', rarity: 'rare', price: 65, hungerValue: 2.5, desc: 'Bizarre creature that basks near the surface.', scale: 1.5 },
    // Level 4: Trench
    halfmoon: { src: 'assets/fish/halfmoon.png', almanacSrc: 'assets/almanac/almanacHalfmoon.png', frames: 6, renderScale: 0.59, name: 'Halfmoon', rarity: 'epic', price: 200, hungerValue: 4, desc: 'A rare deep-sea creature with a glowing crescent tail.', scale: 2.2 },
    orca: { src: 'assets/fish/orca.png', almanacSrc: 'assets/almanac/almanacOrca.png', frames: 6, renderScale: 2.59, name: 'Orca', rarity: 'epic', price: 200, hungerValue: 4.5, desc: 'Legendary predator of the deep trench.', scale: 1.5 },
    veiltail: { src: 'assets/fish/veiltail.png', almanacSrc: 'assets/almanac/almanacVeiltail.png', frames: 6, renderScale: 0.39, name: 'Veiltail', rarity: 'epic', price: 180, hungerValue: 3.5, desc: 'A mysterious fish with flowing, veil-like fins.', scale: 1.3 },
    anglerfish: { src: 'assets/fish/anglerfish.png', almanacSrc: 'assets/almanac/almanacAnglerfish.png', frames: 6, renderScale: 0.35, name: 'Angler', rarity: 'epic', price: 220, hungerValue: 4, desc: 'Lurking predator with a bioluminescent lure.', scale: 1.6 },
    doomsdayoarfish: { src: 'assets/fish/doomsday-oarfish.png', almanacSrc: 'assets/almanac/almanacDoomsdayoarfish.png', frames: 6, renderScale: 0.90, name: 'Doomsday Oarfish', rarity: 'epic', price: 250, hungerValue: 5, desc: 'Colossal ribbon-like creature, sign of bad luck.', scale: 1.12 },

    // Level 5: Abyss
    vampiresquid: { src: 'assets/fish/vampiresquid.png', almanacSrc: 'assets/almanac/almanacVampiresquid.png', frames: 4, renderScale: 3.5, name: 'Vampire Squid', rarity: 'legendary', price: 600, hungerValue: 5, desc: 'Cephalopod that thrives in oxygen-poor waters.', scale: 1.9 },
    beluga: { src: 'assets/fish/Beluga.png', almanacSrc: 'assets/almanac/almanacBeluga.png', frames: 4, renderScale: 2.5, name: 'Beluga', rarity: 'legendary', price: 800, hungerValue: 5, desc: 'Territorial marine mammal of the abyss.', scale: 1.8 },
    catfish: { src: 'assets/fish/Catfish.png', almanacSrc: 'assets/almanac/almanacCatfish.png', frames: 4, renderScale: 0.8, name: 'Mekong', rarity: 'legendary', price: 750, hungerValue: 5, desc: 'Immense giant with sudden bursts of strength.', scale: 1.4 },
    kraken: { src: 'assets/fish/kraken.png', almanacSrc: 'assets/almanac/almanacKraken.png', frames: 4, renderScale: 5, name: 'Kraken', rarity: 'legendary', price: 1000, hungerValue: 5, desc: 'The ultimate apex monster of the deep.', scale: 2.0 }
};

export class Fish {
    constructor(type, x, y, depthLevel = 1, mapId = 0) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.depthLevel = depthLevel;
        this.mapId = mapId;

        // Movement
        this.baseSpeed = (Math.random() * 1.2) + 0.4;
        this.speed = this.baseSpeed;
        this.targetSpeed = this.baseSpeed;
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
            this.frameW = Math.floor(this.img.naturalWidth / this.frames); // width of one frame, rigorously typed as integer
            this.frameH = Math.floor(this.img.naturalHeight);
            this.renderW = this.frameW * this.renderScale; // how wide it appears on screen
            this.renderH = this.frameH * this.renderScale; // how tall it appears on screen
        };
        this.img.onerror = () => {
            console.error(`Failed to load sprite for type "${type}": ${data.src}`);
        };
        this.img.src = data.src;
    }

    update() {
        if (this.caught) {
            // If caught, we still want to animate, and maybe even faster to show struggle
            this.frameTick += 3; // speed up animation when caught (3x faster)
            if (this.frameTick >= this.frameRate) {
                this.frameTick = 0;
                this.frameIndex = (this.frameIndex + 1) % this.frames;
            }
            return;
        }

        // Behavior: Adjust target speed occasionally
        if (Math.random() < 0.01) {
            this.targetSpeed = this.baseSpeed * ((Math.random() * 0.8) + 0.6); // 60% to 140% of base speed
        }

        // Smoothly interpolate current speed to target speed
        this.speed += (this.targetSpeed - this.speed) * 0.05;

        // X Movement Boundaries (Let them go far into the map)
        const mapLength = MAPS[this.mapId].length;
        const margin = 100;

        if (this.x < margin) {
            this.direction = 1;
        } else if (this.x > mapLength - margin) {
            this.direction = -1;
        }

        // Randomly turn around occasionally
        if (Math.random() < 0.003) {
            this.direction *= -1;
        }

        this.x += this.speed * this.direction; // move left or right

        // Prevent fish from swimming left into the deep soil slope wall
        const groundX = getDeepSoilX(this.y);
        if (this.x <= groundX) {
            this.x = groundX + 1;
            if (this.direction === -1) {
                this.direction = 1;
            }
        }

        this.frameTick++;
        if (this.frameTick >= this.frameRate) {
            this.frameTick = 0;
            this.frameIndex = (this.frameIndex + 1) % this.frames;
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
