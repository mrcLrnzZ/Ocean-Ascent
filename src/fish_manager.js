// src/fish_manager.js
import { Fish } from './fish.js';
import { WATER_Y } from './constants.js';

export class FishManager {
    constructor() {
        this.fishes = [];
        this.spawnInitialFish();
    }

    spawnInitialFish() {
        for (let i = 0; i < 10; i++) {
            // ✅ Spawn near the visible area (around cameraX = 0 start)
            const x = Math.random() * 1200 + 100;
            const y = WATER_Y + Math.random() * 120 + 20;
            const type = Math.random() < 0.7 ? "small" : "medium";
            this.fishes.push(new Fish(type, x, y));
        }
    }

    update() {
        for (let fish of this.fishes) {
            fish.update();
        }
    }

    draw(ctx, cameraX) {
        for (let fish of this.fishes) {
            fish.draw(ctx, cameraX);
        }
    }
}