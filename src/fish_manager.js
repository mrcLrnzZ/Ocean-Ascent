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
            const x = Math.random() * 1200 + 100;
            const y = WATER_Y + Math.random() * 120 + 20;

            const roll = Math.random();
            const type = roll < 0.6 ? 'small' : roll < 0.9 ? 'medium' : 'boss'; // 👈 added boss
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