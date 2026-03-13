
import { drawSky, drawDock, drawBackground, drawGround, drawWaterBackground, drawWaterForeground, drawTransition, drawDeepSoil } from './render_map.js';
import { Player } from './player.js';
import { Merchant } from './merchant.js';
import { Boat } from './boat.js';
import { GROUND_Y, WATER_Y, MAPS, MAP_TRANSITION_X_LEFT, W, H, getDepthStartLine, getDepthEndLine } from './constants.js';
import { debugCam, toggleDebugCam } from './debugcam.js';
import { FishManager } from './fish_manager.js';
import { uiManager } from './ui.js';
import { camera } from './camera.js';
import { transitionManager } from './map_transition.js';
import { AudioManager } from './audio.js';
import { WeatherSystem, waveParams } from './environment.js';
export const audio = new AudioManager();

    audio.play("ocean");
// 1. SETUP CANVAS
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

// 2. INITIALIZE GAME OBJECTS
const fishManager = new FishManager();
const player = new Player(fishManager); // pass fishManager to player
const merchant = new Merchant(540, GROUND_Y);
const boat = new Boat(950, 650);

const keys = {};
let frame = 0;
let cameraX = 0;
let cameraY = 0;
let currentMap = 0;
let eWasUp = true;

uiManager.init(player, boat);

// 3. INPUT LISTENERS
window.addEventListener('keydown', e => {
    if (!uiManager.isOpen) keys[e.key] = true;
});
window.addEventListener('keyup', e => keys[e.key] = false);



// Debug Camera logic
document.getElementById('debug-btn').addEventListener('click', () => {
    toggleDebugCam(cameraX, cameraY);
});

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
                <span>${icons[type] || ''} ${type[0].toUpperCase()+type.slice(1)}</span>
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
        'clear':  '☀ Clear',
        'rainy':  '🌧 Rainy',
        'stormy': '⛈ Stormy',
        'foggy':  '🌫 Foggy'
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
    if (amp <= 6)  return 'Calm';
    if (amp <= 12) return 'Choppy';
    if (amp <= 20) return 'Rough';
    return 'Violent';
}

buildWeatherWeightPanel();

// 5. MAIN LOOP
function loop() {
    frame++;

    // Game state object
    const G = { keys: transitionManager.active ? {} : keys, state: player.state || 'walking', frame };

    // --- UPDATE LOGIC ---
    boat.update(G);   
  WeatherSystem.update(frame);  // Move boat first
    player.update(1, G, boat, fishManager, currentMap); // then player follows
    fishManager.update();                    // all fish update
    merchant.update();

    // --- MAP TRANSITIONS & BOUNDARIES ---
    currentMap = transitionManager.updateTransition(currentMap, boat, player);
    transitionManager.checkBoundaries(currentMap, boat, player, uiManager);

    // --- INTERACTIONS ---
    const ePressedNow = (keys['e'] || keys['E']) && eWasUp;
    eWasUp = !(keys['e'] || keys['E']);

    if (ePressedNow && !uiManager.isOpen) {
        audio.play('opentrade');
        if (!player.state) player.state = 'walking';

        if (player.state === 'walking') {
            if (merchant.isNear(player)) uiManager.openMerchantUI(keys);
            else if (boat.isPurchased && Math.abs(player.x - boat.x) < 200) {
                player.state = 'onBoat';
                player.x = boat.x + (boat.width * boat.scale) / 2;
                uiManager.showNotification("You are on the boat. Press E at ends to Fish/Sail.");
            }
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
            else if (playerRelCenterX > bounds.width - zoneWidth) boat.state = boat.state === 'sailing' ? 'idle' : 'sailing';
            else if (Math.abs(boat.x - 950) < 100 && boat.state === 'idle') {
                player.state = 'walking';
                player.x = 1000;
                uiManager.showNotification("Disembarked boat.");
            }
        }
    }

    // Depth Meter Logic
    uiManager.updateDepthMeter(cameraY + (H / 2), WATER_Y, getDepthEndLine);

    // Update weather/wave HUD every 60 frames (once per second at 60fps)
    if (frame % 60 === 0) {
        updateWeatherDisplay();
        const wvEl   = document.getElementById('h-wave');
        const windEl = document.getElementById('h-wind');
        if (wvEl)   wvEl.textContent   = `Waves: ${waveLabel()}`;
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
            merchant.draw(ctx, cameraX, player);
        }
        fishManager.draw(ctx, cameraX);  // the fish

        if (player.state == 'onBoat') {

            drawDock(ctx, cameraX, currentMap);
            player.draw(ctx, cameraX);


        } else {
            player.draw(ctx, cameraX);
            drawDock(ctx, cameraX, currentMap);



        }
        boat.draw(ctx, cameraX, frame, player);
        drawWaterForeground(ctx, cameraX, frame, currentMap);
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

loop();