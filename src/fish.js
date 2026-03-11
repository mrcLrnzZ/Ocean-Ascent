// src/fish.js

export const SPRITE_DATA = {
    // Level 1: Surface
    anchovy: { src: 'assets/anchovyy.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.2, name: 'Anchovy', rarity: 'common', desc: 'A tiny, silvery fish found swimming in large schools near the surface.' },
    sardine: { src: 'assets/anchovyy.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.22, name: 'Sardine', rarity: 'common', desc: 'Slightly larger than an anchovy, these quick fish are a staple food for many ocean predators.' },
    clownfish: { src: 'assets/anchovyy.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.18, name: 'Clownfish', rarity: 'common', desc: 'Bright orange with white stripes. Rarely strays far from the safety of its home.' },

    // Level 2: Mid-Shallows
    tuna: { src: 'assets/swordfish.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.2, name: 'Tuna', rarity: 'uncommon', desc: 'A fast, torpedo-shaped predator built for speed and endurance.' },
    swordfish: { src: 'assets/choifish.png', almanacSrc: 'assets/almanachoifish.png', frames: 6, renderScale: 0.29, name: 'Choifish', rarity: 'uncommon', desc: 'A graceful fish known for its flowing fins and vibrant colors. Often seen gliding peacefully through clear waters.' },
    mahi_mahi: { src: 'assets/devilfish.png', almanacSrc: 'assets/almanacdevilfish.png', frames: 6, renderScale: 0.25, name: 'DevilFish', rarity: 'uncommon', desc: 'A fast and agile ocean fish, known for its acrobatic leaps and energetic movements in open waters.' },

    // Level 3: Deep
    cod: { src: 'assets/anchovyy.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.3, name: 'Cod', rarity: 'rare', desc: 'A heavy-bodied fish that prefers colder, deeper waters.' },
    pufferfish: { src: 'assets/flowerhead.png', almanacSrc: 'assets/almanacflowerhead.png', frames: 6, renderScale: 0.2, name: 'FlowerHorn', rarity: 'rare', desc: 'A rare fish with a head shaped like blooming petals. Its vibrant colors and elegant movement make it a beautiful sight in calm waters.' },
    sunfish: { src: 'assets/swordfish.png', almanacSrc: 'assets/almanacEnchovy.png', frames: 4, renderScale: 0.4, name: 'Sunfish', rarity: 'rare', desc: 'A bizarre, flattened giant that often basks sideways near the surface, but dives deep for jellyfish.' },

    // Level 4: Trench
    oarfish: { src: 'assets/halfmoon.png', almanacSrc: 'assets/almanacHalfmoon.png', frames: 6, renderScale: 0.59, name: 'Halfmoon', rarity: 'epic', desc: 'A rare deep-sea fish with a glowing crescent tail that resembles a half moon. Known to appear only in calm waters at night, making it a prized catch among legendary anglers.' },
    anglerfish: { src: 'assets/veailtail.png', almanacSrc: 'assets/almanacveailtail.png', frames: 6, renderScale: 0.3, name: 'Veiltail', rarity: 'epic', desc: 'A mysterious deep-sea fish with a flowing veil-like tail. Its glowing lure attracts curious prey in the darkest depths of the ocean.' },
    coelacanth: { src: 'assets/anglerfish.png', almanacSrc: 'assets/almanacAnglerfish.png', frames: 6, renderScale: 0.35, name: 'Angler', rarity: 'epic', desc: 'A deep-sea predator known for the glowing lure that dangles from its head, attracting prey in the dark abyss.' },

    // Level 5 & 6: Abyss
    Beluga: { src: 'assets/Beluga.png', almanacSrc: 'assets/almanacBeluga.png', frames: 4, renderScale: 0.7, name: 'Beluga', rarity: 'legendary', desc: 'A large beluga whale patrols the cold waters ahead. It is highly aware of movement through sound and vibration, and will approach unfamiliar creatures that enter its territory. Its strong body and quick bursts of speed make close encounters dangerous.' },
    Mekong: { src: 'assets/Catfish.png', almanacSrc: 'assets/almanacBeluga.png', frames: 4, renderScale: 0.8, name: 'Mekong', rarity: 'legendary', desc: 'Mekong Giant Catfish detected. A massive freshwater fish capable of sudden bursts of speed. Its large size and powerful tail can easily knock aside smaller creatures that get too close.' },
    kraken: { src: 'assets/doomsday-oarfishF.png', almanacSrc: 'assets/almanacDoomsday-Oarfish.png', frames: 4, renderScale: 0.9, name: 'Kraken', rarity: 'legendary', desc: 'A mythic cephalopod of unimaginable size. Its tentacles can drag ships into the abyss.' }
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

        // Prevent fish from swimming into the physical soil overlap
        // The soil block visually occupies X <= 1250 and Y <= 900
        if (this.x <= 850 && this.y <= 900) {
            this.x = 851; // push out horizontally
            this.direction = 1; // force them to swim right
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
