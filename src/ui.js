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

        // Total catches (sum of counts in slots)
        let totalCaught = 0;
        if (Array.isArray(this.player.inventory)) {
            this.player.inventory.forEach(slot => {
                if (slot) totalCaught += slot.count;
            });
        }
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
        this.selectedSlot = null;
        this.renderBag();
        document.getElementById('bag-popup').style.display = 'flex';
        audio.play('click');

        // Hide eat/sell panel on open
        const panel = document.getElementById('eat-sell-panel');
        if (panel) panel.style.display = 'none';
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
        const slots = document.querySelectorAll('.inv-slot');
        if (!slots || slots.length === 0) return;

        const inv = this.player.inventory;

        slots.forEach((slotEl, i) => {
            const fish = inv[i];
            slotEl.innerHTML = '';
            slotEl.className = fish ? 'inv-slot occupied' : 'inv-slot empty';
            if (this.selectedSlot === i) slotEl.classList.add('active');

            if (fish) {
                slotEl.innerHTML = `
                    <img src="${fish.almanacSrc}" class="inv-fish-img">
                    <span class="inv-fish-qty">x${fish.count}</span>
                `;
            }

            // Remove old listener and add new one
            slotEl.onclick = () => this.onSlotClick(i);
        });

        // Update info panel if something is selected
        if (this.selectedSlot !== null && inv[this.selectedSlot]) {
            this.updateInfoPanel(inv[this.selectedSlot]);
        } else {
            const panel = document.getElementById('eat-sell-panel');
            if (panel) panel.style.display = 'none';
        }
    }

    onSlotClick(index) {
        const inv = this.player.inventory;
        const fish = inv[index];
        
        if (!fish) {
            this.selectedSlot = null;
            document.getElementById('eat-sell-panel').style.display = 'none';
        } else {
            this.selectedSlot = index;
            document.getElementById('eat-sell-panel').style.display = 'flex';
            this.updateInfoPanel(fish);
        }
        
        this.renderBag();
        audio.play('click');
    }

    updateInfoPanel(fish) {
        document.getElementById('info-hunger').textContent = `+${fish.hungerValue} Hunger`;
        document.getElementById('info-coins').textContent = `+$${fish.sellValue} Coins`;
        
        // Update buttons
        document.getElementById('eat-btn').onclick = () => {
            this.player.eatFish(this.selectedSlot);
            audio.play('click');
        };
        document.getElementById('sell-btn').onclick = () => {
            this.player.sellFish(this.selectedSlot);
            audio.play('click');
        };
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
