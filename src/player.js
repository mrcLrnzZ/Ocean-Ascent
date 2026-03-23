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

        this.throwFrameW = 127;
        this.throwFrameH = 94;
        this.throwFrameCount = 10;
        this.throwspeed = 1;

        this.fishIdleFrameW = 127; 
        this.fishIdleFrameH = 94;
        this.fishIdleFrameCount = 4;
        this.fishIdleFrameSpeed = 10; 
        this.isFishIdle = false;
        this.fishIdleFrame = 0;
        this.fishIdleTimer = 0;

        this.currentFrame = 0;
        this.frameTimer = 0;
        this.isMoving = false;
        this.lastState = false;

        this.isThrowAnim = false;
        this.throwFrame = 0;
        this.throwTimer = 0;
        this.throwFrameDuration = Math.ceil((this.throwspeed * 60) / this.throwFrameCount); 
        this._pendingCast = null;

        // --- Game state ---
        this.state = 'walking'; 
        this.money = 20000;
        this.boatLevel = 0;

        // --- Fishing ---
        this.rod = new Rod(this, fishManager);

        this.inventory = new Array(6).fill(null);
        this.maxSlots = 6;

        // --- Survival System ---
        this.maxHealth = 10;    // 10 hearts
        this.health = 10;
        this.maxHunger = 5;     // 5 hunger units
        this.hunger = 5;

        // Hunger drain timer (hunger decreases every 30 seconds during play)
        this._hungerTimer = 0;
        this._hungerDrainInterval = 10; // seconds between each -0.5 hunger
        this._hungerDrainAmount = 1.5;

        // Starvation: -0.5 HP every 5 seconds when hunger = 0
        this._starvationTimer = 0;
        this._starvationInterval = 2;  // seconds
        this._starvationDamage = 1.5;
        this._isStarving = false;

        // Prevent stacking multiple starvation loops
        this._starvationActive = false;

        // --- Regeneration Settings ---
        this._regenTimer = 0;
        this._regenInterval = 2;    // How often to heal (every X seconds)
        this._regenAmount = 0.5;     // Health gained per tick (+0.5 is half a heart)
    }

    /**
     * Add a fish to the inventory with stacking and 6-slot limit logic.
     * Returns true if successfully added, false otherwise.
     */
    addFish(fishId, fishData) {
        // 1. Check if it already exists to stack
        for (let i = 0; i < this.maxSlots; i++) {
            if (this.inventory[i] && this.inventory[i].type === fishId) {
                this.inventory[i].count++;
                return true;
            }
        }

        // 2. Not found, find an empty slot
        for (let i = 0; i < this.maxSlots; i++) {
            if (this.inventory[i] === null) {
                this.inventory[i] = {
                    type: fishId,
                    count: 1,
                    name: fishData.name || fishId,
                    hungerValue: fishData.hungerValue || 1,
                    sellValue: fishData.price || 10,
                    rarity: fishData.rarity || 'common',
                    almanacSrc: fishData.almanacSrc || 'assets/almanac/almanacPlaceholderfish.png'
                };
                return true;
            }
        }

        // 3. No space
        return false;
    }

    /**
     * Eat a fish from a specific slot index.
     */
    eatFish(slotIndex) {
        const slot = this.inventory[slotIndex];
        if (!slot) return;

        const restore = slot.hungerValue || 1;
        this.hunger = Math.min(this.maxHunger, this.hunger + restore);

        slot.count--;
        if (slot.count <= 0) {
            this.inventory[slotIndex] = null;
        }

        this._updateSurvivalUI();
        // Re-render inventory
        import('./ui.js').then(m => m.uiManager.renderBag());
    }

    /**
     * Sell a fish from a specific slot index.
     */
    sellFish(slotIndex) {
        const slot = this.inventory[slotIndex];
        if (!slot) return;

        this.money += slot.sellValue || 0;

        slot.count--;
        if (slot.count <= 0) {
            this.inventory[slotIndex] = null;
        }

        // Re-render bag + HUD
        import('./ui.js').then(m => {
            m.uiManager.renderBag();
            m.uiManager.updateHUD();
        });
    }

    update(dt, G, boat, fishManager, currentMap = 0) {
        // --- Survival tick ---
        this.updateSurvival(dt);

        this.lastState = this.isMoving;
        this.isMoving = false;

        const speed = 150;

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

            // Map-specific boundaries for walking
            const isEnding = currentMap === 4; // Map 4 is Ending
            let minX = 0;
            let maxX = 1100; // PIER_END_X
            if (isEnding) {
                minX = 2500; // Start of the ending shore/dock area
                maxX = 4000; // End of map
            }
            this.x = Math.max(minX, Math.min(this.x, maxX));
            this.y = 500 - (this.frameH * this.scale); // GROUND_Y

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

    /**
     * Survival system update — called every frame (dt in seconds from the game loop).
     * Handles hunger drain, starvation damage, and death.
     */
    updateSurvival(dt) {
        // --- Hunger drain over time ---
        this._hungerTimer += dt;
        if (this._hungerTimer >= this._hungerDrainInterval) {
            this._hungerTimer = 0;
            this.hunger = Math.max(0, this.hunger - this._hungerDrainAmount);
        }

        // --- Starvation mechanic ---
        if (this.hunger <= 0) {
            this._isStarving = true;
            this._starvationTimer += dt;
            if (this._starvationTimer >= this._starvationInterval) {
                this._starvationTimer = 0;
                this.health = Math.max(0, this.health - this._starvationDamage);
                // Trigger game-over or death when health hits 0
                if (this.health <= 0) {
                    this._onDeath();
                }
            }
        } else {
            // Hunger restored — stop starvation
            this._isStarving = false;
            this._starvationTimer = 0;

            // --- Regeneration mechanic (Minecraft style!) ---
            // If the player is well-fed (max hunger), they slowly regain health.
            if (this.hunger >= this.maxHunger && this.health < this.maxHealth) {
                this._regenTimer += dt;
                if (this._regenTimer >= this._regenInterval) {
                    this._regenTimer = 0;
                    this.health = Math.min(this.maxHealth, this.health + this._regenAmount);
                }
            } else {
                this._regenTimer = 0;
            }
        }

        // Update HTML UI survival bars
        this._updateSurvivalUI();
    }

    _updateSurvivalUI() {
        // Throttle DOM rebuild to every ~6 frames (~100ms at 60fps) to stay performant.
        // We still update the starvation warning each frame.
        this._survivalUITick = (this._survivalUITick || 0) + 1;
        const shouldRebuild = this._survivalUITick % 6 === 0;

        // --- Starvation warning (every frame) ---
        const starvWarn = document.getElementById('starvation-warning');
        if (starvWarn) starvWarn.style.display = this._isStarving ? 'flex' : 'none';

        if (!shouldRebuild) return;

        // ── HEARTS ────────────────────────────────────────────────────────────
        // maxHealth = 10  →  10 heart icons, each represents 1 HP
        // health tracks in 0.5 increments
        const healthRow = document.getElementById('health-icons');
        if (healthRow) {
            let html = '';
            for (let i = 0; i < this.maxHealth; i++) {
                // filled fraction for this slot: [i .. i+1]
                const filled = Math.max(0, Math.min(1, this.health - i));
                let src;
                if (filled >= 1) src = 'assets/fullheart.png';
                else if (filled >= 0.5) src = 'assets/halftheart.png';   // filename has extra 't'
                else src = 'assets/emptyheart.png';
                html += `<img src="${src}" class="stat-icon heart-icon" alt="heart" width="25" height="27">`;
            }
            healthRow.innerHTML = html;
        }

        // ── HUNGER ─────────────────────────────────────────────────────────────
        // maxHunger = 5  →  5 hunger icons, each represents 1 unit
        // hunger tracks in 0.5 increments
        const hungerRow = document.getElementById('hunger-icons');
        if (hungerRow) {
            let html = '';
            // Add blink class to the container when hungry/starving
            let rowClass = 'survival-row';
            if (this.hunger <= 0) rowClass += ' hunger-row-empty';
            else if (this.hunger <= 1) rowClass += ' hunger-row-low';
            hungerRow.className = rowClass;

            for (let i = 0; i < this.maxHunger; i++) {
                const filled = Math.max(0, Math.min(1, this.hunger - i));
                let src;
                if (filled >= 1) src = 'assets/fullhunger.png';
                else if (filled >= 0.5) src = 'assets/halfhunger.png';
                else src = 'assets/emptyhunger.png';
                html += `<img src="${src}" class="stat-icon hunger-icon" alt="hunger" width="55" height="59">`;
            }
            hungerRow.innerHTML = html;
        }
    }

    _onDeath() {
        // Stop survival timers so the loop doesn't keep firing
        this.health = 0;
        this._isStarving = false;
        this._starvationTimer = 0;
        this._hungerTimer = 0;

        // Populate stats on the game-over screen
        const moneyEl = document.getElementById('gameover-money');
        if (moneyEl) moneyEl.textContent = `Money earned: $${this.money}`;
        const fishEl = document.getElementById('gameover-fish');
        if (fishEl) {
            const count = this.inventory.filter(slot => slot !== null).length;
            fishEl.textContent = `Fish in bag: ${count}`;
        }

        // Show the game-over overlay
        const screen = document.getElementById('gameover-screen');
        if (screen) {
            screen.classList.add('visible');
        }

        // Signal the game loop to pause (checked in main.js)
        window._gameOver = true;
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
        } else if (this.rodLevel === 3) {
            const folder = 'assets/rod/';
            this.walkImg.src = `${folder}walk_green.png`;
            this.idleImg.src = `${folder}idle_green.png`;
            this.throwImg.src = `${folder}fullthrow_green.png`;
            this.fishIdleImg.src = `${folder}fishidle_green.png`;
        } else if (this.rodLevel === 4) {
            const folder = 'assets/rod/';
            this.walkImg.src = `${folder}walk_black.png`;
            this.idleImg.src = `${folder}idle_black.png`;
            this.throwImg.src = `${folder}fullthrow_black.png`;
            this.fishIdleImg.src = `${folder}fishidle_black.png`;
        } else if (this.rodLevel === 5) {
            const folder = 'assets/rod/';
            this.walkImg.src = `${folder}walk_blue.png`;
            this.idleImg.src = `${folder}idle_blue.png`;
            this.throwImg.src = `${folder}fullthrow_blue.png`;
            this.fishIdleImg.src = `${folder}fishidle_blue.png`;
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