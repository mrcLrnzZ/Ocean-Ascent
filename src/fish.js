// src/fish.js
import { getDeepSoilY, getDeepSoilX } from './constants.js';

export const SPRITE_DATA = {
    // Level 1: Surface
    anchovy: { src: 'assets/fish/anchovyy.png', almanacSrc: 'assets/almanac/almanacAnchovy.png', frames: 4, renderScale: 0.2, name: 'Anchovy', rarity: 'common', price: 10, desc: 'A tiny, silvery fish found swimming in large schools near the surface.', scale: 1 },
    sardine: { src: 'assets/fish/placeholderfish.png', almanacSrc: 'assets/almanac/almanacPlaceholderfish.png', frames: 3, renderScale: 0.22, name: 'Sardine', rarity: 'common', price: 12, desc: 'Slightly larger than an anchovy, these quick fish are a staple food for many ocean predators.', scale: 1 },
    clownfish: { src: 'assets/fish/placeholderfish.png', almanacSrc: 'assets/almanac/almanacPlaceholderfish.png', frames: 3, renderScale: 0.18, name: 'Clownfish', rarity: 'common', price: 15, desc: 'Bright orange with white stripes. Rarely strays far from the safety of its home.', scale: 1 },

    // Level 2: Mid-Shallows
    devilfish: { src: 'assets/fish/devilfish.png', almanacSrc: 'assets/almanac/almanacDevilfish.png', frames: 6, renderScale: 0.29, name: 'Devilfish', rarity: 'uncommon', price: 30, desc: 'A fast, torpedo-shaped predator built for speed and endurance.', scale: 1 },
    swordfish: { src: 'assets/fish/swordfish.png', almanacSrc: 'assets/almanac/almanacSwordfish.png', frames: 4, renderScale: 0.29, name: 'Swordfish', rarity: 'uncommon', price: 28, desc: 'A graceful fish known for its flowing fins and vibrant colors. Often seen gliding peacefully through clear waters.', scale: 1.2 },
    flowerhead: { src: 'assets/fish/flowerhead.png', almanacSrc: 'assets/almanac/almanacFlowerhead.png', frames: 6, renderScale: 0.29, name: 'Flowerhead', rarity: 'uncommon', price: 35, desc: 'A fast and agile ocean fish, known for its acrobatic leaps and energetic movements in open waters.', scale: 1.4 },

    // Level 3: Deep
    choifish: { src: 'assets/fish/choifish.png', almanacSrc: 'assets/almanac/almanacChoifish.png', frames: 6, renderScale: 0.45, name: 'Choifish', rarity: 'rare', price: 60, desc: 'A heavy-bodied fish that prefers colder, deeper waters.', scale: 1.4 },
    pufferfish: { src: 'assets/fish/placeholderfish.png', almanacSrc: 'assets/almanac/almanacPlaceholderfish.png', frames: 3, renderScale: 0.45, name: 'Pufferfish', rarity: 'rare', price: 70, desc: 'A rare fish with a head shaped like blooming petals. Its vibrant colors and elegant movement make it a beautiful sight in calm waters.', scale: 1 },
    turtle: { src: 'assets/fish/turtle.png', almanacSrc: 'assets/almanac/almanacTurtle.png', frames: 5, renderScale: 0.88, name: 'Turtle', rarity: 'rare', price: 75, desc: 'A bizarre, flattened giant that often basks sideways near the surface, but dives deep for jellyfish.', scale: 1.8 },

    // Level 4: Trench
    halfmoon: { src: 'assets/fish/halfmoon.png', almanacSrc: 'assets/almanac/almanacHalfmoon.png', frames: 6, renderScale: 0.59, name: 'Halfmoon', rarity: 'epic', price: 200, desc: 'A rare deep-sea fish with a glowing crescent tail that resembles a half moon. Known to appear only in calm waters at night, making it a prized catch among legendary anglers.', scale: 1.8 },
    veiltail: { src: 'assets/fish/veiltail.png', almanacSrc: 'assets/almanac/almanacVeiltail.png', frames: 6, renderScale: 0.39, name: 'Veiltail', rarity: 'epic', price: 180, desc: 'A mysterious deep-sea fish with a flowing veil-like tail. Its glowing lure attracts curious prey in the darkest depths of the ocean.', scale: 1.3 },
    anglerfish: { src: 'assets/fish/anglerfish.png', almanacSrc: 'assets/almanac/almanacAnglerfish.png', frames: 6, renderScale: 0.35, name: 'Angler', rarity: 'epic', price: 220, desc: 'A deep-sea predator known for the glowing lure that dangles from its head, attracting prey in the dark abyss.', scale: 1.6 },
    doomsdayoarfish: { src: 'assets/fish/doomsday-oarfish.png', almanacSrc: 'assets/almanac/almanacDoomsdayoarfish.png', frames: 6, renderScale: 0.90, name: 'Doomsday Oarfish', rarity: 'epic', price: 250, desc: 'A colossal deep-sea creature with a distinctive ribbon-like tail. Its appearance is said to herald the arrival of natural disasters.', scale: 1.12 },

    // Level 5 & 6: Abyss
    beluga: { src: 'assets/fish/Beluga.png', almanacSrc: 'assets/almanac/almanacBeluga.png', frames: 4, renderScale: 2.5, name: 'Beluga', rarity: 'legendary', price: 800, desc: 'A large beluga whale patrols the cold waters ahead. It is highly aware of movement through sound and vibration, and will approach unfamiliar creatures that enter its territory. Its strong body and quick bursts of speed make close encounters dangerous.', scale: 1.8 },
    catfish: { src: 'assets/fish/Catfish.png', almanacSrc: 'assets/almanac/almanacCatfish.png', frames: 4, renderScale: 0.8, name: 'Mekong', rarity: 'legendary', price: 750, desc: 'Mekong Giant Catfish detected. A massive freshwater fish capable of sudden bursts of speed. Its large size and powerful tail can easily knock aside smaller creatures that get too close.', scale: 1.4 },
    kraken: { src: 'assets/fish/kraken.png', almanacSrc: 'assets/almanac/almanacKraken.png', frames: 4, renderScale: 5, name: 'Kraken', rarity: 'legendary', price: 1000, desc: 'A mythic cephalopod of unimaginable size. Its tentacles can drag ships into the abyss.', scale: 2.0 }
};

export class Fish {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;

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
        if (this.x < 100) {
            this.direction = 1;
        } else if (this.x > 8000) {
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
