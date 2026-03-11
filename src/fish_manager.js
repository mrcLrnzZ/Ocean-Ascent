// src/fish_manager.js
import { Fish } from './fish.js';
import { WATER_Y, getDepthStartLine, getDepthEndLine, getDeepSoilX } from './constants.js';

export class FishManager {
    constructor() {
        this.fishes = []; // container ng isda
        this.spawnInitialFish();
    }

    spawnInitialFish() {
        const totalLevels = 5;
        const fishPerLevel = 30; // Amount of fish to spawn per level

        for (let level = 1; level <= totalLevels; level++) {
            for (let i = 0; i < fishPerLevel; i++) {
                // Y spawns within the boundaries of the current depth level
                const minLevelY = getDepthStartLine(level);
                const maxLevelY = getDepthEndLine(level);
                const layerHeight = maxLevelY - minLevelY;

                // Keep fish slightly away from the exact boundaries
                const y = minLevelY + 100 + Math.random() * (layerHeight - 200);

                // Ensure X spawns to the right of the slope at that specific depth
                const groundX = getDeepSoilX(y);
                const xRange = 8000 - groundX;
                const x = groundX + 100 + Math.random() * xRange;

                const type = getRandomFishTypeForLevel(level);
                this.fishes.push(new Fish(type, x, y));
            }
        }

        // Spawn a school of Anchovies directly under the dock
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 650 + 550;
            // Spawn them slightly below the water surface
            const y = WATER_Y + Math.random() * 80 + 30;
            this.fishes.push(new Fish('anchovy', x, y));
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
    1: [ // Surface
        { type: 'anchovy', prob: 0.50 },
        { type: 'sardine', prob: 0.35 },
        { type: 'clownfish', prob: 0.15 }
    ],
    2: [ // Mid-Shallows
        { type: 'sardine', prob: 0.20 },
        { type: 'clownfish', prob: 0.20 },
        { type: 'tuna', prob: 0.30 },
        { type: 'swordfish', prob: 0.20 },
        { type: 'mahi_mahi', prob: 0.10 }
    ],
    3: [ // Deep
        { type: 'tuna', prob: 0.20 },
        { type: 'swordfish', prob: 0.20 },
        { type: 'cod', prob: 0.30 },
        { type: 'pufferfish', prob: 0.20 },
        { type: 'sunfish', prob: 0.10 }
    ],
    4: [ // Trench
        { type: 'cod', prob: 0.20 },
        { type: 'pufferfish', prob: 0.20 },
        { type: 'sunfish', prob: 0.20 },
        { type: 'oarfish', prob: 0.20 },
        { type: 'anglerfish', prob: 0.15 },
        { type: 'coelacanth', prob: 0.05 }
    ],
    5: [ // Abyss
        { type: 'reaper', prob: 0.40 },
        { type: 'megalodon', prob: 0.40 },
        { type: 'kraken', prob: 0.20 }
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
