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
        popup.classList.add('dialogue-mode');
        popup.innerHTML = `<div id="dialogue-text"></div>`;
        popup.style.display = 'block';

        const textContainer = document.getElementById('dialogue-text');

        let price = null;
        let nextLevel = null;
        let textToType = "";
        let onBuy = null;

        if (type === "boat") {
            // Boat Upgrades
            if (this.player.boatLevel < 3) {
                nextLevel = this.player.boatLevel + 1;
                price = boatPrices[nextLevel];
                textToType = `Ah, a sailor! Want to upgrade to a Level ${nextLevel} Boat for $${price}? [Y] Buy   [N] Leave`;
                onBuy = () => { this.cleanupMerchantUI(); this.buyBoat(nextLevel, price); };
            } else {
                textToType = `Your boat is fully upgraded! You're a true master of the seas! [N] Leave`;
            }
        } else {
            // Rod Upgrades
            if (this.player.rodLevel < 5) {
                nextLevel = this.player.rodLevel + 1;
                price = rodPrices[nextLevel];
                let name = rodNames[nextLevel];
                textToType = `Need better gear? I can sell you a ${name} for $${price}.         [Y] Buy   [N] Leave`;
                onBuy = () => { this.cleanupMerchantUI(); this.buyRod(nextLevel, price); };
            } else {
                textToType = `You have the best rod I can offer! Good luck out there! [N] Leave`;
            }
        }

        this.cleanupMerchantUI();

        let charIndex = 0;
        this.typewriterInterval = setInterval(() => {
            if (charIndex < textToType.length) {
                textContainer.innerHTML += textToType.charAt(charIndex);
                charIndex++;
            } else {
                clearInterval(this.typewriterInterval);
            }
        }, 20);

        this.merchantKeyListener = (e) => {
            const key = e.key.toLowerCase();
            if (key === 'y' && onBuy) {
                onBuy();
            } else if (key === 'n') {
                this.closeUI();
            }
        };
        window.addEventListener('keydown', this.merchantKeyListener);
    }

    cleanupMerchantUI() {
        if (this.typewriterInterval) {
            clearInterval(this.typewriterInterval);
            this.typewriterInterval = null;
        }
        if (this.merchantKeyListener) {
            window.removeEventListener('keydown', this.merchantKeyListener);
            this.merchantKeyListener = null;
        }
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
            this.closeUI();
            if (this.onUpdateHUD) this.onUpdateHUD();
        } else {
            this.showNotification("Not enough money!");
            this.closeUI();
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
            this.closeUI();
            if (this.onUpdateHUD) this.onUpdateHUD();
        } else {
            this.showNotification("Not enough money!");
            this.closeUI();
        }
    }

    closeUI() {
        const popup = document.getElementById('popup');
        popup.style.display = 'none';
        popup.classList.remove('dialogue-mode');
        this.cleanupMerchantUI();
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
