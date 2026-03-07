// src/fish_manager.js
import { Fish } from './fish.js';
import { WATER_Y } from './constants.js';

export class FishManager {
    constructor() {
        this.fishes = []; // container ng isda
        this.spawnInitialFish();
    }

    spawnInitialFish() {
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 1200 + 700; // constraint saan pwedeng mag-spawn (hindi sa shore dapat)
            const y = WATER_Y + Math.random() * 120 + 60; // random depth sa tubig

            const type = getRandomFishType();
            this.fishes.push(new Fish(type, x, y)); // kumukuha sa fish.js constructor then stores sa array
        }
    }

    update() {
        for (const fish of this.fishes) {
            fish.update(); // Fish.update() already guards against moving when caught
        }
    }

    draw(ctx, cameraX) {
        for (let fish of this.fishes) {
            fish.draw(ctx, cameraX);
        }
    }
}

    // fish type probabilities
    const fishTypes = [
        { type: 'common',    prob: 0.4 },  // 40%
        { type: 'uncommon',  prob: 0.3 },  // 30%
        { type: 'rare',      prob: 0.15 }, // 15%
        { type: 'epic',      prob: 0.1 },  // 10%
        { type: 'legendary', prob: 0.05 }  // 5%
    ];

    function getRandomFishType() {
        const roll = Math.random(); // 0–1
        let cumulative = 0;

        for (let f of fishTypes) { 
            cumulative += f.prob; // 
            if (roll < cumulative) return f.type;
        }

        return fishTypes[0].type; // fallback to common
    }
