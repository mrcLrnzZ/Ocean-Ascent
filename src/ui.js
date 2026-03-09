// src/ui.js

export const boatPrices = [0, 20, 50, 100];
export const rodPrices = [0, 0, 50, 150, 400, 800];
export const rodNames = ["", "Bamboo Rod", "Fiberglass Rod", "Graphite Rod", "Carbon Rod", "Master Rod"];

export class UIManager {
    constructor() {
        this.isOpen = false;

        // Define missing functions correctly on the window to retain HTML onClick handlers
        window.buyBoat = this.buyBoat.bind(this);
        window.buyRod = this.buyRod.bind(this);
        window.closeUI = this.closeUI.bind(this);
    }

    // Dependencies injected to prevent heavy coupling
    init(playerRef, boatRef, updateHUDCallback) {
        this.player = playerRef;
        this.boat = boatRef;
        this.onUpdateHUD = updateHUDCallback;
        this.updateHUD(); // initial render
    }

    updateHUD() {
        if (!this.player) return;
        document.getElementById('h-money').textContent = `$${this.player.money}`;
        document.getElementById('h-rod').textContent = rodNames[this.player.rodLevel];
        document.getElementById('h-boat').textContent = this.player.boatLevel === 0 ? "None" : `Level ${this.player.boatLevel} Boat`;
    }

    openMerchantUI(keys) {
        this.isOpen = true;
        // Release specific keys to prevent getting stuck
        for (let k of ['e', 'E', 'ArrowLeft', 'ArrowRight', 'a', 'd']) {
            if (keys && keys[k] !== undefined) keys[k] = false;
        }

        const popup = document.getElementById('popup');
        let html = `<h2>Merchant</h2>`;

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

        html += `<button onclick="closeUI()" style="margin-top:15px">Close</button>`;
        popup.innerHTML = html;
        popup.style.display = 'block';
    }

    buyBoat(level, price) {
        if (this.player && this.player.money >= price) {
            this.player.money -= price;
            this.player.boatLevel = level;
            if (this.boat) {
                this.boat.setLevel(level);
                this.boat.isPurchased = true;
            }
            this.updateHUD();
            this.openMerchantUI();
            if (this.onUpdateHUD) this.onUpdateHUD();
        } else {
            alert("Not enough money!");
        }
    }

    buyRod(level, price) {
        if (this.player && this.player.money >= price) {
            this.player.money -= price;
            this.player.rodLevel = level;
            this.player.rod.maxPower = 5 + level * 3.5; // pampalakas ng bato based sa level
            this.updateHUD();
            this.openMerchantUI();
            if (this.onUpdateHUD) this.onUpdateHUD();
        } else {
            alert("Not enough money!");
        }
    }

    closeUI() {
        document.getElementById('popup').style.display = 'none';
        setTimeout(() => this.isOpen = false, 100);
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
