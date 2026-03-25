// src/ui.js
import { SPRITE_DATA } from './fish.js';
import { audio } from './main.js';
import { AlmanacManager } from './almanac.js';
import { TutorialManager } from './tutorial.js';
import { MechanicsManager } from './mechanics.js';
import { toggleDebugCam, debugCam } from './debugcam.js';
import { camera } from './camera.js';

export const boatPrices = [0, 50, 500, 1000];
export const rodPrices = [0, 0, 50, 150, 400, 800, 1500];
export const rodNames = ["", "Stick Rod", "Hot Rod", "Bamboo Rod", "Corrupted Rod", "Lightning Rod"];

export class UIManager {
    constructor() {
        this.isOpen = false;
        this.cheatboxOpen = false;
        this.currentDepthLevel = 1;

        // Define missing functions correctly on the window to retain HTML onClick handlers
        window.buyBoat = this.buyBoat.bind(this);
        window.buyRod = this.buyRod.bind(this);
        window.closeUI = this.closeUI.bind(this);
        window.openBag = this.openBag.bind(this);
        window.closeBag = this.closeBag.bind(this);
        window.eatFish = (index) => { if (this.player) this.player.eatFish(index); };
        window.sellFish = (index) => { if (this.player) this.player.sellFish(index); };
        window.toggleBurgerMenu = this.toggleBurgerMenu.bind(this);
        window.openMechanics = this.openMechanics.bind(this);
        window.openTutorial = this.openTutorial.bind(this);
        window.closeTutorial = this.closeTutorial.bind(this);
        window.changeTutorialPage = this.changeTutorialPage.bind(this);
        window.closeMechanics = this.closeMechanics.bind(this);
        window.changeMechanicsPage = this.changeMechanicsPage.bind(this);
        
        window.showFirstCatchUI = this.showFirstCatchUI.bind(this);
        window.closeFirstCatchUI = this.closeFirstCatchUI.bind(this);
        window.captureFirstCatch = this.captureFirstCatch.bind(this);
        
        this.tutorial = new TutorialManager();
        this.almanac = new AlmanacManager(this);
        this.mechanics = new MechanicsManager();
        this.initCheatBox();
    }

    // Dependencies injected to prevent heavy coupling
    init(playerRef, boatRef, fishManagerRef, updateHUDCallback) {
        this.player = playerRef;
        this.boat = boatRef;
        this.fishManager = fishManagerRef;
        this.onUpdateHUD = updateHUDCallback;
        this.updateHUD(); // initial render
        this.mechanics.init(audio);

        // Almanac listener
        document.getElementById('almanac-btn').addEventListener('click', () => {
            if (!this.isOpen) this.almanac.openAlmanacUI();
        });
    }

    updateHUD() {
        if (!this.player) return;
        document.getElementById('h-money').textContent = `$${this.player.money}`;
        document.getElementById('h-rod').textContent = rodNames[this.player.rodLevel];
        document.getElementById('h-boat').textContent = this.player.boatLevel === 0 ? "None" : `Level ${this.player.boatLevel} Boat`;

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
            this.selectedSlot = null; // Reset selection if slot is now empty
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
            this.renderBag(); // Update bag UI
            this.updateHUD(); // Sync health/hunger bars
            audio.play('click');
        };
        document.getElementById('sell-btn').onclick = () => {
            this.player.sellFish(this.selectedSlot);
            this.renderBag(); // Update bag UI
            this.updateHUD(); // Sync money display
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

                // Show level change notification

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

            if (this.notifTimeout) clearTimeout(this.notifTimeout);
            this.notifTimeout = setTimeout(() => {
                notif.style.opacity = "0";
            }, duration);
        }
    }

    showLevelPopup(title, duration = 4000) {
        const notif = document.getElementById('level-notif');
        if (notif) {
            notif.innerHTML = `<div class="level-label">NOW ENTERING</div>
                               <div class="level-title">${title}</div>`;

            notif.classList.add('show');

            if (this.levelNotifTimeout) clearTimeout(this.levelNotifTimeout);

            this.levelNotifTimeout = setTimeout(() => {
                notif.classList.remove('show');
                setTimeout(() => { if (!notif.classList.contains('show')) notif.innerHTML = ""; }, 1200);
            }, duration);
        }
    }

    toggleBurgerMenu() {
        const dropdown = document.getElementById('burger-dropdown');
        if (!dropdown) return;

        const isHidden = dropdown.classList.toggle('hidden');

        if (!isHidden) {
            const onOutsideClick = (e) => {
                const menu = document.getElementById('burger-menu');
                if (menu && !menu.contains(e.target)) {
                    dropdown.classList.add('hidden');
                    document.removeEventListener('click', onOutsideClick);
                }
            };
            setTimeout(() => document.addEventListener('click', onOutsideClick), 0);
        }
    }
    // Mechanics
    openMechanics() {
        document.getElementById('burger-dropdown')?.classList.add('hidden');
        if (this.isOpen) return;
        this.isOpen = true;
        this.mechanics.open();
    }

    closeMechanics() {
        this.mechanics.close();
        this.isOpen = false;
    }

    changeMechanicsPage(dir) {
        this.mechanics.changePage(dir);
    }
    // Tutorial
    openTutorial() {
        document.getElementById('burger-dropdown')?.classList.add('hidden');
        if (this.isOpen) return;
        this.isOpen = true;
        this.tutorial.open(audio);
    }

    closeTutorial() {
        this.tutorial.close();
        this.isOpen = false;
    }

    changeTutorialPage(dir) {
        this.tutorial.changePage(dir, audio);
    }

    initCheatBox() {
        this.cheatbox = document.getElementById('cheatbox');
        this.cheatInput = document.getElementById('cheat-input');

        window.addEventListener('keydown', (e) => {
            if (e.key === '/' && !this.isOpen) {
                e.preventDefault();
                this.openCheatBox();
            }
        });

        this.cheatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.processCheat(this.cheatInput.value.trim().toLowerCase());
                this.closeCheatBox();
            } else if (e.key === 'Escape') {
                this.closeCheatBox();
            }
        });

        // Close when clicking outside
        window.addEventListener('mousedown', (e) => {
            if (this.isOpen && this.cheatboxOpen && !this.cheatbox.contains(e.target)) {
                this.closeCheatBox();
            }
        });
    }

    showFirstCatchUI(fishId, fishData) {
        if (this.isOpen && this.cheatboxOpen) this.closeCheatBox();
        this.isOpen = true;
        
        const popup = document.getElementById('first-catch-popup');
        const img = document.getElementById('fc-image');
        const nameText = document.getElementById('fc-name');
        
        img.src = fishData.almanacSrc || fishData.src;
        nameText.textContent = fishData.name || fishId;
        
        popup.style.display = 'flex';
    }

    closeFirstCatchUI() {
        const popup = document.getElementById('first-catch-popup');
        popup.style.display = 'none';
        setTimeout(() => this.isOpen = false, 100);
        audio.play('click');
    }

    captureFirstCatch(event) {
        audio.play('click');
        
        if (event && event.target) {
            event.target.blur(); // Remove focus to prevent spacebar triggering again
        }

        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Draw background
        ctx.fillStyle = '#223344'; // dark aesthetic blue
        ctx.fillRect(0, 0, 800, 600);
        
        // Inner screenshot border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 20, 760, 560);
        
        ctx.textAlign = 'center';
        ctx.font = '40px "upheaval", cursive, monospace';
        
        // Draw congrats text
        ctx.fillStyle = '#fbff00ff'; // Gold
        ctx.shadowColor = 'black';
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.fillText('Congrats! You caught', 400, 100);
        
        // Draw name
        const nameText = document.getElementById('fc-name').textContent;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(nameText, 400, 520);
        ctx.shadowColor = 'transparent';
        
        // Draw Image
        const img = document.getElementById('fc-image');
        try {
            const size = 300;
            ctx.drawImage(img, 400 - size/2, 150, size, size);
        } catch(e) { console.error('Error drawing image on canvas', e); }
        
        const link = document.createElement('a');
        link.download = `First_Catch_${nameText.replace(/ /g, '_')}.png`;
        link.href = canvas.toDataURL();
        
        // Temporarily disable the "Are you sure you want to leave" alert
        const wasStarted = window.gameStarted;
        window.gameStarted = false;
        
        link.click();
        
        // Restore after a short delay to ensure download initiates first
        setTimeout(() => {
            window.gameStarted = wasStarted;
        }, 100);
    }

    openCheatBox() {
        this.isOpen = true;
        this.cheatboxOpen = true;
        this.cheatbox.style.display = 'flex';
        // Use a tiny timeout to ensure display: flex is set before adding the class for transition
        setTimeout(() => {
            this.cheatbox.classList.add('visible');
            this.cheatInput.focus();
        }, 10);
    }

    closeCheatBox() {
        this.cheatbox.classList.remove('visible');
        this.cheatInput.value = '';
        setTimeout(() => {
            if (!this.cheatbox.classList.contains('visible')) {
                this.cheatbox.style.display = 'none';
                this.isOpen = false;
                this.cheatboxOpen = false;
            }
        }, 300);
    }

    processCheat(code) {
        if (!this.player) return;

        if (code === 'moremoney') {
            this.player.money += 10000;
            this.updateHUD();
            this.showNotification("$$$$ MORE MONEY $$$$");
            audio.play('buy');
        } else if (code === 'tootired') {
            // Complete almanac
            const fishKeys = Object.keys(SPRITE_DATA);
            fishKeys.forEach(fishId => {
                this.player.caughtFishCounts[fishId] = Math.max(this.player.caughtFishCounts[fishId] || 0, 1);
            });
            this.showNotification("ALMANAC COMPLETED! RELAX...");
            audio.play('sell'); // Using sell sound as a "success" sound
        } else if (code === 'kenjimasarap0123') {
            if (this.boat) {
                this.boat.isFlipped = !this.boat.isFlipped;
                this.showNotification(this.boat.isFlipped ? "BOAT FLIPPED! OH NO!" : "BOAT RESTORED! PHEW!");
                audio.play('buy');
            }
        } else if (code === 'gitreset') {
            // Revert all cheats
            this.player.money = 20;
            this.player.caughtFishCounts = {};
            if (this.boat) {
                this.boat.isFlipped = false;
                this.boat.setLevel(this.boat.level); // Reset speed/size properties
            }

            this.updateHUD(); // Refresh HUD with new money count
            this.showNotification("SYSTEM RESET COMPLETE");
            audio.play('click');
        } else if (code === 'hesoyam') {
            // Max health and hunger
            this.player.health = this.player.maxHealth;
            this.player.hunger = this.player.maxHunger;
            this.showNotification("HEALTH & HUNGER RESTORED");
            audio.play('buy');
        } else if (code === 'speed1000') {
            if (this.boat) {
                this.boat.speed = 1000; // 1000 is likely too fast (warping through maps)
                this.showNotification("BOAT SUPER SPEED: ON");
                audio.play('buy');
            }
        } else if (code === 'cjaythedev') {
            if (this.fishManager) {
                this.fishManager.spawnExtraFish(1000); // Add 100 more fish per map/level
                this.showNotification("MORE FISH TO SPAWN! REEL 'EM IN!");
                audio.play('buy');
            }
        } else if (code === 'no clip') {
            if (!debugCam.enabled) {
                toggleDebugCam(camera.x, camera.y);
                this.showNotification("NO CLIP MODE: ENABLED");
            }
        } else if (code === 'pilc on') {
            if (debugCam.enabled) {
                toggleDebugCam(camera.x, camera.y);
                this.showNotification("NO CLIP MODE: DISABLED");
            }
        } else if (code === 'uodparty') {
            if (this.fishManager) {
                this.fishManager.fishes.forEach(fish => {
                    fish.frames = 4;
                    fish.renderScale = 0.5; // adjust for uod size
                    fish.name = 'Uod';
                    fish.img.src = 'assets/fish/uod.png';
                    // The onload listener in the Fish class will re-trigger and update frameW/H
                });
                this.showNotification("!!! UOD PARTY TIME !!!");
                audio.play('buy');
            }
        } else if (code === 'giantfih') {
            if (this.fishManager) {
                this.fishManager.fishes.forEach(fish => {
                    fish.renderScale *= 5;
                    fish.renderW = fish.frameW * fish.renderScale;
                    fish.renderH = fish.frameH * fish.renderScale;
                });
                this.showNotification("GIANT FISH HAVE ARRIVED!");
                audio.play('buy');
            }
        } else {
            this.showNotification("Invalid command");
        }
    }
}

// Export singleton instance
export const uiManager = new UIManager();
