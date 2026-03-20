// src/fish_manager.js
import { Fish } from './fish.js';
import { WATER_Y, MAPS, getDepthStartLine, getDepthEndLine, getDeepSoilX } from './constants.js';

export class FishManager {
    constructor() {
        this.fishes = []; // container ng isda
        this.spawnInitialFish();
    }

    spawnInitialFish() {
        const fishPerLevel = 90; // Amount of fish to spawn per depth level per map

        for (const map of MAPS) {
            const mapId = map.id;
            const minDepth = map.minDepth || 1;
            const maxDepth = map.maxDepth || 1;

            for (let depth = minDepth; depth <= maxDepth; depth++) {
                const minLevelY = getDepthStartLine(depth);
                const maxLevelY = getDepthEndLine(depth);
                const layerHeight = maxLevelY - minLevelY;

                for (let i = 0; i < fishPerLevel; i++) {
                    // Y spawns within the boundaries of the current depth level
                    const y = minLevelY + 100 + Math.random() * (layerHeight - 200);

                    // X spawn range varies per map — map 0 (shore) stays near origin,
                    // later maps extend far into the world
                    const groundX = getDeepSoilX(y);
                    const mapStartX = mapId === 0 ? 0 : 0;   // all maps share one world-space
                    const xRange = 8000 - groundX;
                    const x = groundX + 100 + Math.random() * xRange;

                    const type = getSpawnType(mapId, depth);
                    if (!type) continue; // no entry for this map/depth combo — skip
                    this.fishes.push(new Fish(type, x, y, depth, mapId));
                }
            }
        }

        // Spawn a small school of Anchovies under the shore dock (map 0)
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 650 + 550;
            const y = WATER_Y + Math.random() * 80 + 30;
            this.fishes.push(new Fish('anchovy', x, y, 1, 0));
        }
    }

    update() {
        for (const fish of this.fishes) {
            fish.update();
        }
    }

    /**
     * Draw fish.  Supply an optional filter function — only fish where filter(fish)===true
     * will be drawn.  Used by main.js to split depth-5 fish into a separate render pass.
     */
    draw(ctx, cameraX, filter = null) {
        for (const fish of this.fishes) {
            if (filter && !filter(fish)) continue;
            fish.draw(ctx, cameraX);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP × DEPTH SPAWN TABLES
//
// Structure: mapSpawnTable[mapId][depthLevel] = [ { type, prob }, ... ]
//
// Rules:
//   • Map 0 (Shore)  — maxDepth 2  — shallow, beginner fish only
//   • Map 1 (Ocean1) — maxDepth 5  — mid-tier fish, no abyssal legendaries
//   • Map 2 (Ocean2) — maxDepth 5  — deeper threats, rarer fish start appearing
//   • Map 3 (Ocean3) — maxDepth 5  — night ocean, full abyss fauna incl. Kraken
// ─────────────────────────────────────────────────────────────────────────────
const mapSpawnTable = {

    // ── MAP 0: Shore ─────────────────────────────────────────────────────────
    0: {
        1: [ // Surface — very shallow, common schooling fish
            { type: 'anchovy',   prob: 0.55 },
            { type: 'sardine',   prob: 0.35 },
            { type: 'clownfish', prob: 0.10 }
        ],
        2: [ // Mid-water — slightly deeper, still safe
            { type: 'sardine',   prob: 0.40 },
            { type: 'clownfish', prob: 0.35 },
            { type: 'devilfish', prob: 0.25 }
        ]
        // Depths 3-5 are not accessible on Shore (maxDepth: 2)
    },

    // ── MAP 1: Ocean 1 ───────────────────────────────────────────────────────
    1: {
        1: [ // Surface
            { type: 'anchovy',    prob: 0.40 },
            { type: 'sardine',    prob: 0.35 },
            { type: 'clownfish',  prob: 0.25 },
            { type: 'bluetang',  prob: 0.25 }
        ],
        2: [ // Shallows
            { type: 'sardine',    prob: 0.25 },
            { type: 'clownfish',  prob: 0.25 },
            { type: 'devilfish',  prob: 0.30 },
            { type: 'swordfish',  prob: 0.20 }
        ],
        3: [ // Mid-Deep
            { type: 'swordfish',  prob: 0.30 },
            { type: 'flowerhead', prob: 0.30 },
            { type: 'choifish',   prob: 0.25 },
            { type: 'turtle',     prob: 0.15 },
            { type: 'sunfish',  prob: 0.25 }
        ],
        4: [ // Deep Trench
            { type: 'turtle',     prob: 0.25 },
            { type: 'shark',      prob: 0.30 },
            { type: 'flowerhead', prob: 0.20 },
            { type: 'choifish',   prob: 0.25 }
        ],
        5: [ // Deep — NO abyssal legendaries yet on Map 1
            { type: 'veiltail',   prob: 0.35 },
            { type: 'anglerfish', prob: 0.35 },
            { type: 'orca',       prob: 0.30 }
        ]
    },

    // ── MAP 2: Ocean 2 ───────────────────────────────────────────────────────
    2: {
        1: [ // Surface
            { type: 'sardine',    prob: 0.40 },
            { type: 'clownfish',  prob: 0.30 },
            { type: 'devilfish',  prob: 0.30 }
        ],
        2: [ // Shallows
            { type: 'devilfish',  prob: 0.30 },
            { type: 'swordfish',  prob: 0.35 },
            { type: 'flowerhead', prob: 0.35 }
        ],
        3: [ // Mid-Deep
            { type: 'flowerhead', prob: 0.25 },
            { type: 'choifish',   prob: 0.25 },
            { type: 'turtle',     prob: 0.25 },
            { type: 'shark',      prob: 0.25 }
        ],
        4: [ // Trench — epic fish start appearing
            { type: 'shark',            prob: 0.25 },
            { type: 'orca',             prob: 0.20 },
            { type: 'veiltail',         prob: 0.25 },
            { type: 'doomsdayoarfish',  prob: 0.30 }
        ],
        5: [ // Abyss — dangerous, but Kraken not yet here
            { type: 'anglerfish',       prob: 0.30 },
            { type: 'doomsdayoarfish',  prob: 0.25 },
            { type: 'veiltail',         prob: 0.20 },
            { type: 'catfish',          prob: 0.25 }
        ]
    },

    // ── MAP 3: Ocean 3 ───────────────────────────────────────────────────────
    3: {
        1: [ // Surface (night sky)
            { type: 'sardine',    prob: 0.35 },
            { type: 'clownfish',  prob: 0.25 },
            { type: 'devilfish',  prob: 0.25 },
            { type: 'swordfish',  prob: 0.15 }
        ],
        2: [ // Shallows
            { type: 'swordfish',  prob: 0.30 },
            { type: 'flowerhead', prob: 0.30 },
            { type: 'choifish',   prob: 0.25 },
            { type: 'devilfish',  prob: 0.15 }
        ],
        3: [ // Mid-Deep
            { type: 'choifish',         prob: 0.25 },
            { type: 'turtle',           prob: 0.25 },
            { type: 'shark',            prob: 0.25 },
            { type: 'doomsdayoarfish',  prob: 0.25 }
        ],
        4: [ // Trench — heavy predators
            { type: 'orca',             prob: 0.25 },
            { type: 'veiltail',         prob: 0.20 },
            { type: 'anglerfish',       prob: 0.25 },
            { type: 'doomsdayoarfish',  prob: 0.20 },
            { type: 'beluga',           prob: 0.10 }
        ],
        5: [ // Abyss — full legendary spawns, Kraken exclusive to Map 3 Depth 5
            { type: 'anglerfish',  prob: 0.20 },
            { type: 'beluga',      prob: 0.20 },
            { type: 'catfish',     prob: 0.20 },
            { type: 'kraken',      prob: 0.40 }  // Kraken ONLY spawns here
        ]
    },

    // ── MAP 4: Ending — no fish spawned here ─────────────────────────────────
    4: {}
};

/**
 * Pick a random fish type for a given map + depth combination.
 * Falls back gracefully if no table exists for that combo.
 */
function getSpawnType(mapId, depth) {
    const mapTable = mapSpawnTable[mapId];
    if (!mapTable) return null;

    const table = mapTable[depth];
    if (!table || table.length === 0) return null;

    // Normalise probabilities so they always sum to 1 (handles designer errors)
    const total = table.reduce((s, e) => s + e.prob, 0);
    const roll = Math.random() * total;
    let cumulative = 0;

    for (const entry of table) {
        cumulative += entry.prob;
        if (roll <= cumulative) return entry.type;
    }

    return table[0].type; // fallback
}
