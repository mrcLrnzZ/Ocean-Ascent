// src/ui.js
import { SPRITE_DATA } from './fish.js';
import { audio } from './main.js';
import { AlmanacManager } from './almanac.js';

export const boatPrices = [0, 20, 50, 100];
export const rodPrices = [0, 0, 50, 150, 400, 800];
export const rodNames = ["", "Bamboo Rod", "Fiberglass Rod", "Graphite Rod", "Carbon Rod", "Master Rod"];

export class UIManager {
    constructor() {
        this.isOpen = false;

        // Define missing functions correctly on the window to retain HTML onClick handlers
        window.buyBoat  = this.buyBoat.bind(this);
        window.buyRod   = this.buyRod.bind(this);
        window.closeUI  = this.closeUI.bind(this);
        window.openBag  = this.openBag.bind(this);
        window.closeBag = this.closeBag.bind(this);
        window.eatFish  = (index) => { if (this.player) this.player.eatFish(index); };
        window.sellFish = (index) => { if (this.player) this.player.sellFish(index); };
        
        this.almanac = new AlmanacManager(this);
    }

    // Dependencies injected to prevent heavy coupling
    init(playerRef, boatRef, updateHUDCallback) {
        this.player = playerRef;
        this.boat = boatRef;
        this.onUpdateHUD = updateHUDCallback;
        this.updateHUD(); // initial render

        // Almanac listener
        document.getElementById('almanac-btn').addEventListener('click', () => {
            if (!this.isOpen) this.almanac.openAlmanacUI();
        });
    }

    updateHUD() {
        if (!this.player) return;
        document.getElementById('h-money').textContent = `$${this.player.money}`;
        document.getElementById('h-rod').textContent   = rodNames[this.player.rodLevel];
        document.getElementById('h-boat').textContent  = this.player.boatLevel === 0 ? "None" : `Level ${this.player.boatLevel} Boat`;

        // Total catches from array inventory
        const totalCaught = Array.isArray(this.player.inventory) ? this.player.inventory.length : 0;
        document.getElementById('h-catch').textContent = `${totalCaught} fish`;
    }

    openMerchantUI(type = "boat", keys = null) {
        this.isOpen = true;
        this.lastMerchantType = type;
        // Release specific keys to prevent getting stuck
        if (keys) {
            for (let k of ['e', 'E', 'ArrowLeft', 'ArrowRight', 'a', 'd']) {
                if (keys[k] !== undefined) keys[k] = false;
            }
        }

        const popup = document.getElementById('popup');
        let html = `<h2>${type === "boat" ? "Boat Dealer" : "Rod Specialist"}</h2>`;

        if (type === "boat") {
            // Boat Upgrades
            if (this.player.boatLevel < 3) {
                const nextBoat = this.player.boatLevel + 1;
                const price = boatPrices[nextBoat];
                html += `<div class="row">
                    Level ${nextBoat} Boat - $${price}
                    <button onclick="buyBoat(${nextBoat}, ${price})" class="gold">Buy</button>
                </div>`;
            } else {
                html += `<div class="row">Boat: Fully Upgraded!</div>`;
            }
        } else {
            // Rod Upgrades
            if (this.player.rodLevel < 5) {
                const nextRod = this.player.rodLevel + 1;
                const price = rodPrices[nextRod];
                const name = rodNames[nextRod];
                html += `<div class="row">
                    ${name} - $${price}
                    <button onclick="buyRod(${nextRod}, ${price})" class="gold">Buy</button>
                </div>`;
            } else {
                html += `<div class="row">Rod: Fully Upgraded!</div>`;
            }
        }

        html += `<button onclick="closeUI()" style="margin-top:15px">Close</button>`;
        popup.innerHTML = html;
        popup.style.display = 'block';
    }

    buyBoat(level, price) {
        if (this.player && this.player.money >= price) {
            audio.play('buy');
            this.player.money -= price;
            this.player.boatLevel = level;
            if (this.boat) {
                this.boat.setLevel(level);
                this.boat.isPurchased = true;
            }
            this.updateHUD();
            this.openMerchantUI("boat");
            if (this.onUpdateHUD) this.onUpdateHUD();
        } else {
            alert("Not enough money!");
        }
    }

    buyRod(level, price) {
        if (this.player && this.player.money >= price) {
            audio.play('buy');
            this.player.money -= price;
            this.player.rodLevel = level;
            this.player.rod.maxPower = 5 + level * 3.5; // pampalakas ng bato based sa level
            this.player.updateRodSprites();
            this.updateHUD();
            this.openMerchantUI("rod");
            if (this.onUpdateHUD) this.onUpdateHUD();
        } else {
            alert("Not enough money!");
        }
    }

    closeUI() {
        document.getElementById('popup').style.display = 'none';
        setTimeout(() => this.isOpen = false, 100);
        audio.play('click');
    }

    /** Open the bag (fish inventory) popup */
    openBag() {
        if (this.isOpen) return;  // block if another popup is open
        this.isOpen = true;
        this.renderBag();
        document.getElementById('bag-popup').style.display = 'flex';
        audio.play('click');
    }

    /** Close the bag popup */
    closeBag() {
        document.getElementById('bag-popup').style.display = 'none';
        setTimeout(() => this.isOpen = false, 100);
        audio.play('click');
    }

    /** Render bag contents into the bag-popup element */
    renderBag() {
        if (!this.player) return;
        const grid = document.getElementById('bag-grid');
        if (!grid) return;

        const inv    = this.player.inventory;
        const max    = this.player.maxInventory || 20;
        const isFull = inv.length >= max;

        // Update header title with capacity counter
        const titleEl = document.querySelector('#bag-header h2');
        if (titleEl) {
            const countColor = isFull ? '#ff6666' : 'rgba(180, 255, 150, 0.9)';
            titleEl.innerHTML = `🎒 Fish Bag <span style="font-size:13px; color:${countColor};">(${inv.length}/${max})</span>`;
        }

        if (!inv || inv.length === 0) {
            grid.innerHTML = '<div class="bag-empty">Your bag is empty.<br>Go catch some fish! 🎣</div>';
            return;
        }


        const rarityColors = {
            common:    '#a0c8ff',
            uncommon:  '#88ff99',
            rare:      '#aa88ff',
            epic:      '#ffaa44',
            legendary: '#ffd700',
        };

        grid.innerHTML = inv.map((fish, i) => {
            const color  = rarityColors[fish.rarity] || '#ccc';
            const rLabel = fish.rarity ? fish.rarity.charAt(0).toUpperCase() + fish.rarity.slice(1) : '';
            return `
            <div class="bag-item" id="bag-item-${i}">
                <div class="bag-item-name" style="color:${color}">${fish.name}</div>
                <div class="bag-item-rarity" style="color:${color}">${rLabel}</div>
                <div class="bag-item-stats">
                    <span>🍖 +${fish.hungerValue}</span>
                    <span>💰 $${fish.sellValue}</span>
                </div>
                <div class="bag-item-actions">
                    <button class="bag-eat-btn"   onclick="eatFish(${i})">🍽 Eat</button>
                    <button class="bag-sell-btn"  onclick="sellFish(${i})">💵 Sell</button>
                </div>
            </div>`;
        }).join('');
    }

    updateDepthMeter(cameraCenterY, waterY, getDepthEndLineFunc) {
        const depthMeter = document.getElementById('sea-depth-meter');
        if (depthMeter) {
            // Only show if we're near or under water (WATER_Y = 600, screen center approx cameraY + H/2)
            if (cameraCenterY >= waterY) {
                depthMeter.style.display = 'block';
                // Convert pixels to meters (e.g., 20px = 1m)
                const metersDeep = Math.floor((cameraCenterY - waterY) / 20);

                // Determine level dynamically based on variable heights
                let levelNum = 6;
                if (getDepthEndLineFunc) {
                    for (let i = 1; i <= 5; i++) {
                        if (cameraCenterY < getDepthEndLineFunc(i)) {
                            levelNum = i;
                            break;
                        }
                    }
                }

                depthMeter.textContent = `Depth: ${metersDeep}m (Level ${levelNum})`;
            } else {
                depthMeter.style.display = 'none';
            }
        }
    }

    showNotification(msg, duration = 3000) {
        const notif = document.getElementById('notif');
        if (notif) {
            notif.textContent = msg;
            notif.style.opacity = "1";
            setTimeout(() => notif.style.opacity = "0", duration);
        }
    }
}

// Export singleton instance
export const uiManager = new UIManager();
