
import { drawSky, drawDock, drawBackground, drawGround, drawWaterBackground, drawWaterForeground, drawTransition, drawDeepSoil, drawDockOverlay } from './render_map.js';
import { Player } from './player.js';
import { Merchant, RodMerchant } from './merchant.js';
import { Boat } from './boat.js';
import { GROUND_Y, WATER_Y, MAPS, MAP_TRANSITION_X_LEFT, W, H, getDepthStartLine, getDepthEndLine } from './constants.js';
import { debugCam, toggleDebugCam } from './debugcam.js';
import { FishManager } from './fish_manager.js';
import { uiManager } from './ui.js';
import { camera } from './camera.js';
import { transitionManager } from './map_transition.js';
import { AudioManager } from './audio.js';
import { WeatherSystem, waveParams } from './environment.js';
import { effectManager } from './effects.js';
import { RadioManager } from './radio.js';
export const audio = new AudioManager();
export const radio = new RadioManager();

audio.play("ocean");
// 1. SETUP CANVAS
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

// 2. INITIALIZE GAME OBJECTS
const fishManager = new FishManager();
const player = new Player(fishManager); // pass fishManager to player
const boatMerchant = new Merchant(540, GROUND_Y, "boat");
const rodMerchant = new RodMerchant(300, GROUND_Y);
const boat = new Boat(750, 650);

const keys = {};
let frame = 0;
let cameraX = 0;
let cameraY = 0;
let currentMap = 0;
let eWasUp = true;
let rWasUp = true;
let hasReachedEndingDock = false;

uiManager.init(player, boat);

// 3. INPUT LISTENERS
window.addEventListener('keydown', e => {
    if (!uiManager.isOpen) keys[e.key] = true;
});
window.addEventListener('keyup', e => keys[e.key] = false);

const startBtn = document.getElementById("startBtn");
const video = document.getElementById("introVideo");
const homepage = document.getElementById("homepage");

if (startBtn && video) {
    startBtn.addEventListener("click", () => {
        if (homepage) homepage.style.display = "none";
        startBtn.style.display = "none";
        canvas.style.display = "none";
        video.style.display = "block";
        // video.play();
        video.style.display = "none";
        canvas.style.display = "block";
        requestAnimationFrame(loop);
    });

    // video.addEventListener("ended", () => {
    //     video.style.display = "none";
    //     canvas.style.display = "block";
    //     requestAnimationFrame(loop);
    // });

}



// Debug Camera logic
document.getElementById('debug-btn').addEventListener('click', () => {
    toggleDebugCam(cameraX, cameraY);
});

// Radio toggle logic
const radioContainer = document.getElementById('radio-container');
const radioToggleBtn = document.getElementById('radio-toggle-btn');
if (radioToggleBtn && radioContainer) {
    radioToggleBtn.addEventListener('click', () => {
        radioContainer.classList.toggle('visible');
        // If hiding, also remove centered
        if (!radioContainer.classList.contains('visible')) {
            radioContainer.classList.remove('centered');
        }
    });

    // Center the radio when clicked
    radioContainer.addEventListener('click', (e) => {
        // Don't toggle if clicking buttons
        if (e.target.closest('.radio-btn')) return;

        if (radioContainer.classList.contains('visible')) {
            radioContainer.classList.toggle('centered');
            // If centered, play music if not already playing
            if (radioContainer.classList.contains('centered') && !radio.isPlaying) {
                radio.play();
            }
        }
    });
}

// Weather Control — exposed to HTML buttons
window.setWeather = (weatherType) => {
    WeatherSystem.setWeather(weatherType);
    updateWeatherDisplay();
};

window.wxSetAuto = (enabled) => {
    WeatherSystem.autoWeather = enabled;
};

window.wxSetDuration = (frames) => {
    WeatherSystem.weatherDuration = frames;
    WeatherSystem.weatherTimer = 0; // reset so it doesn't fire immediately
    const el = document.getElementById('wx-timer-val');
    if (el) el.textContent = `${Math.round(frames / 60)}s`;
};

window.wxSetTransition = (frames) => {
    WeatherSystem.transitionDuration = frames;
    const el = document.getElementById('wx-trans-val');
    if (el) el.textContent = `${Math.round(frames / 60)}s`;
};

window.wxSetWeight = (type, value) => {
    WeatherSystem.weatherWeights[type] = +value;
};

// Build the weight sliders once the DOM is ready
function buildWeatherWeightPanel() {
    const panel = document.getElementById('wx-weights-panel');
    if (!panel) return;
    const icons = { clear: '☀', rainy: '🌧', stormy: '⛈', foggy: '🌫' };
    panel.innerHTML = '';
    for (const [type, weight] of Object.entries(WeatherSystem.weatherWeights)) {
        const id = `wx-w-${type}`;
        const row = document.createElement('div');
        row.style.cssText = 'margin-bottom:5px;';
        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:1px;">
                <span>${icons[type] || ''} ${type[0].toUpperCase() + type.slice(1)}</span>
                <span id="${id}-val" style="color:#ffe;">${weight}</span>
            </div>
            <input type="range" min="0" max="100" step="1" value="${weight}"
                oninput="window.wxSetWeight('${type}',+this.value); document.getElementById('${id}-val').textContent=this.value;"
                style="width:100%; cursor:pointer; accent-color:#5588cc;">`;
        panel.appendChild(row);
    }
}

// Update weather display in UI
function updateWeatherDisplay() {
    const weatherNames = {
        'clear': '☀ Clear',
        'rainy': '🌧 Rainy',
        'stormy': '⛈ Stormy',
        'foggy': '🌫 Foggy'
    };
    const label = weatherNames[WeatherSystem.targetState] || WeatherSystem.targetState;
    const el1 = document.getElementById('current-weather');
    const el2 = document.getElementById('h-wx');
    if (el1) el1.textContent = label;
    if (el2) el2.textContent = label;
}

// Wave descriptor for HUD
function waveLabel() {
    const amp = Math.round(waveParams.amp1);
    if (amp <= 6) return 'Calm';
    if (amp <= 12) return 'Choppy';
    if (amp <= 20) return 'Rough';
    return 'Violent';
}

buildWeatherWeightPanel();

// 5. MAIN LOOP
function loop() {
    frame++;

    // Game state object
    const G = { keys: transitionManager.active ? {} : keys, state: player.state || 'walking', frame, currentMap };

    // --- UPDATE LOGIC ---
    boat.update(G, rodMerchant);
    WeatherSystem.update(frame);  // Move boat first
    player.update(1, G, boat, fishManager, currentMap); // then player follows
    fishManager.update();                    // all fish update
    boatMerchant.update();
    rodMerchant.update(boat, frame);
    effectManager.update();

    // --- MAP TRANSITIONS & BOUNDARIES ---
    currentMap = transitionManager.updateTransition(currentMap, boat, player);
    if (currentMap !== 4) hasReachedEndingDock = false;
    
    // --- ENDING AUTO-DOCK CUTSCENE ---
    if (currentMap === 4 && !hasReachedEndingDock && !transitionManager.active) {
        boat.state = 'sailing';
        boat.x += 10; // Auto-move boat towards the dock
        if (boat.x >= 2900) {
            boat.x = 2900;
            boat.state = 'idle';
            hasReachedEndingDock = true;
            uiManager.showNotification("You've reached the end. [R] to Disembark.");

            // Auto-disembark merchant when boat stops at the final dock
            if (rodMerchant.onBoat) {
                rodMerchant.disembark(5500, true);
            }
        }
    }

    transitionManager.checkBoundaries(currentMap, boat, player, uiManager);

    // --- INTERACTIONS ---
    const ePressedNow = (keys['e'] || keys['E']) && eWasUp;
    eWasUp = !(keys['e'] || keys['E']);
    const rPressedNow = (keys['r'] || keys['R']) && rWasUp;
    rWasUp = !(keys['r'] || keys['R']);

    if (rPressedNow && !uiManager.isOpen) {
        if (player.state === 'walking') {
            if (boat.isPurchased && Math.abs(player.x - boat.x) < 200) {
                player.state = 'onBoat';
                player.x = boat.x + (boat.width * boat.scale) / 2;
                uiManager.showNotification("You are on the boat. [E] to Fish/Sail, [R] to Disembark.");
            }
        } else if (player.state === 'onBoat') {
            const isEnding = currentMap === 4;
            const dockX = isEnding ? 2600 : 750;
            const walkMin = isEnding ? 2500 : 0;
            const walkMax = isEnding ? 4500 : 1100;
            
            // Allow disembark if boat is near dock
            if (Math.abs(boat.x - dockX) < 300 && boat.state === 'idle') {
                player.state = 'walking';
                // Move player to ground area near boat
                player.x = isEnding ? (boat.x + 200) : 950;
                player.x = Math.max(walkMin, Math.min(player.x, walkMax));
                
                uiManager.showNotification("Disembarked boat.");
            }
        }
    }

    if (ePressedNow && !uiManager.isOpen) {
        audio.play('opentrade');
        if (!player.state) player.state = 'walking';

        if (player.state === 'walking') {
            if (boatMerchant.isNear(player)) uiManager.openMerchantUI("boat", keys);
            else if (rodMerchant.isNear(player)) uiManager.openMerchantUI("rod", keys);
        } else if (player.state === 'onBoat') {
            const bounds = boat.getBounds();
            const playerRelCenterX = (player.x + 64) - boat.x; // Use player center (~128px width, center is +64)
            const zoneWidth = bounds.width / 3;

            if (playerRelCenterX < zoneWidth) {
                if (boat.state === 'fishing') {
                    if (!player.rod.isCasting && !player.rod.reeling) {
                        boat.state = 'idle';
                    } else {
                        uiManager.showNotification("Reel in your line before leaving!");
                    }
                } else {
                    boat.state = 'fishing';
                }
            }
            else if (playerRelCenterX > bounds.width - zoneWidth) {
                if (rodMerchant.onBoat || currentMap === 4 || rodMerchant.hasLeftPermanently) {
                    boat.state = boat.state === 'sailing' ? 'idle' : 'sailing';
                } else {
                    uiManager.showNotification("Wait for the Rod Merchant to board first!");
                    boat.state = 'idle';
                }
            }
            else if (rodMerchant.isNear(player)) uiManager.openMerchantUI("rod", keys);
        }
    }

    // Depth Meter Logic
    uiManager.updateDepthMeter(cameraY + (H / 2), WATER_Y, getDepthEndLine);

    // Update weather/wave HUD every 60 frames (once per second at 60fps)
    if (frame % 60 === 0) {
        updateWeatherDisplay();
        const wvEl = document.getElementById('h-wave');
        const windEl = document.getElementById('h-wind');
        if (wvEl) wvEl.textContent = `Waves: ${waveLabel()}`;
        if (windEl) windEl.textContent = `Wind: ${Math.round(WeatherSystem.getCurrentWeather().windX * 3)}mph`;
    }

    // Camera logic: Follow player, boat, debug, or fishing hook
    camera.update(player, boat, debugCam, keys, W, H);
    cameraX = camera.x;
    cameraY = camera.y;

    // B. Clear and Draw
    try {
        ctx.clearRect(0, 0, W, H);

        ctx.save();
        ctx.translate(0, -Math.floor(cameraY));

        drawSky(ctx, frame, currentMap);
        drawWaterBackground(ctx, cameraX, currentMap);
        drawBackground(ctx, cameraX, currentMap);
        drawGround(ctx, cameraX, currentMap, frame);


        if (currentMap === 0) {
            boatMerchant.draw(ctx, cameraX, player);
        }

        drawDock(ctx, cameraX, currentMap);

        if (player.state !== 'onBoat' || player.state === 'onBoat') {
            player.draw(ctx, cameraX);
        }

        if (!rodMerchant.onBoat || rodMerchant.onBoat) {
            rodMerchant.draw(ctx, cameraX, player);
        }

        drawDockOverlay(ctx, cameraX, currentMap);

        fishManager.draw(ctx, cameraX);


        boat.draw(ctx, cameraX, frame, player);

        // 6. Foreground layers
        drawWaterForeground(ctx, cameraX, frame, currentMap);
        effectManager.draw(ctx, cameraX);
        drawDeepSoil(ctx, cameraX, currentMap);
        ctx.restore();

        // Weather effects drawn in SCREEN-SPACE (after restore) so they don't scroll
        WeatherSystem.drawWeatherEffects(ctx, cameraY);

        if (transitionManager.active) {
            drawTransition(ctx, transitionManager.progress, transitionManager.direction, transitionManager.sweepDir);
        }

        if (!uiManager.isOpen) {
            requestAnimationFrame(loop);
        } else {
            requestAnimationFrame(loop);
        }
    } catch (e) {
        console.log(e);
    }
}

// video.addEventListener("ended", () => {

//     video.style.display = "none";
//     canvas.style.display = "block";

//     loop(); // start the game loop

// });

// Loop is now started via the startBtn and video end listener
// loop(); // Removed auto-start to wait for button click