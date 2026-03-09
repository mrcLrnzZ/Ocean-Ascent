// src/fish_manager.js
import { Fish } from './fish.js';
import { WATER_Y, getDepthStartLine, getDepthEndLine } from './constants.js';

export class FishManager {
    constructor() {
        this.fishes = []; // container ng isda
        this.spawnInitialFish();
    }

    spawnInitialFish() {
        const totalLevels = 6;
        const fishPerLevel = 30; // Amount of fish to spawn per level

        for (let level = 1; level <= totalLevels; level++) {
            for (let i = 0; i < fishPerLevel; i++) {
                // X spawns randomly across the playable area
                const x = Math.random() * 4000 + 700;

                // Y spawns within the boundaries of the current depth level
                // Example: Level 1 is WATER_Y to WATER_Y + 1500
                const minLevelY = getDepthStartLine(level);
                const maxLevelY = getDepthEndLine(level);
                const layerHeight = maxLevelY - minLevelY;

                // Keep fish slightly away from the exact boundaries
                const y = minLevelY + 100 + Math.random() * (layerHeight - 200);

                const type = getRandomFishTypeForLevel(level);
                this.fishes.push(new Fish(type, x, y));
            }
        }

        // Spawn a school of Anchovies directly under the dock
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 650 + 550;
            // Spawn them slightly below the water surface
            const y = WATER_Y + Math.random() * 80 + 30;
            this.fishes.push(new Fish('common', x, y)); // 'common' is Anchovy
        }
    }

    update() {
        for (const fish of this.fishes) {
            fish.update(); 
        }
    }

    draw(ctx, cameraX) {
        for (let fish of this.fishes) {
            fish.draw(ctx, cameraX);
        }
    }
}

const levelDistributions = {
    1: [
        { type: 'common', prob: 100 },
        { type: 'uncommon', prob: 0.30 },
        { type: 'rare', prob: 0.10 }
    ],
    2: [
        { type: 'common', prob: 0.30 },
        { type: 'uncommon', prob: 0.40 },
        { type: 'rare', prob: 0.20 },
        { type: 'epic', prob: 0.10 }
    ],
    3: [
        { type: 'uncommon', prob: 0.30 },
        { type: 'rare', prob: 0.40 },
        { type: 'epic', prob: 0.25 },
        { type: 'legendary', prob: 0.05 }
    ],
    4: [
        { type: 'rare', prob: 0.30 },
        { type: 'epic', prob: 0.50 },
        { type: 'legendary', prob: 0.20 }
    ],
    5: [
        { type: 'rare', prob: 0.10 },
        { type: 'epic', prob: 0.50 },
        { type: 'legendary', prob: 0.40 }
    ],
    6: [
        { type: 'legendary', prob: 1.00 }
    ]
};

function getRandomFishTypeForLevel(level) {
    const table = levelDistributions[level] || levelDistributions[1];
    const roll = Math.random();
    let cumulative = 0;

    for (let f of table) {
        cumulative += f.prob;
        if (roll <= cumulative) return f.type;
    }

    return table[0].type; // fallback
}
