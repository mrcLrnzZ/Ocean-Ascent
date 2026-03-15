
import { drawSky, drawDock, drawBackground, drawGround, drawWaterBackground, drawWaterForeground, drawTransition, drawDeepSoil } from './render_map.js';
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
export const audio = new AudioManager();

    audio.play("ocean");

// HOMEPAGE RAIN SYSTEM & WEATHER SOUNDS
let gameStarted = false;
let audioStarted = false;
const homepage = document.getElementById('homepage');
const startBtn = document.getElementById('start-btn');
const rainCanvas = document.getElementById('rain-canvas');
const rainCtx = rainCanvas.getContext('2d');

// Start homepage weather sounds on first user interaction
function startHomepageAudio() {
    if (!audioStarted && !gameStarted) {
        audioStarted = true;
        audio.play('heavyrain');
        audio.play('thunder');
    }
}

// Enable audio on any user interaction
document.addEventListener('click', startHomepageAudio, { once: true });
document.addEventListener('keydown', startHomepageAudio, { once: true });
document.addEventListener('touchstart', startHomepageAudio, { once: true });

// Set canvas size
function resizeRainCanvas() {
    rainCanvas.width = window.innerWidth;
    rainCanvas.height = window.innerHeight;
}
resizeRainCanvas();
window.addEventListener('resize', resizeRainCanvas);

// Rain drop configuration
const RAIN_CONFIG = {
    count: 150,
    windX: 2,
    rainAlpha: 0.6,
    dropColor: '#c8dce8'
};

// Create rain drops
const rainDrops = Array.from({ length: RAIN_CONFIG.count }, () => ({
    x: Math.random() * rainCanvas.width,
    y: Math.random() * rainCanvas.height,
    len: 7 + Math.random() * 10,
    speed: 13 + Math.random() * 9
}));

// Check if point is near UI element
function isNearElement(x, y) {
    const titleRect = document.querySelector('.game-title').getBoundingClientRect();
    const buttonRect = document.querySelector('.start-button').getBoundingClientRect();
    
    // Check title collision
    if (x > titleRect.left && x < titleRect.right && y > titleRect.top && y < titleRect.bottom) {
        return { type: 'title', rect: titleRect };
    }
    
    // Check button collision
    if (x > buttonRect.left && x < buttonRect.right && y > buttonRect.top && y < buttonRect.bottom) {
        return { type: 'button', rect: buttonRect };
    }
    
    return null;
}

// Draw rain on canvas
function drawRain(timestamp) {
    if (gameStarted) return;
    
    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    rainCtx.strokeStyle = RAIN_CONFIG.dropColor;
    rainCtx.globalAlpha = RAIN_CONFIG.rainAlpha;
    rainCtx.lineWidth = 1.5;
    
    for (let i = 0; i < rainDrops.length; i++) {
        const drop = rainDrops[i];
        
        // Update position
        drop.y += drop.speed;
        drop.x += RAIN_CONFIG.windX * 0.3;
        
        // Wrap around
        if (drop.y > rainCanvas.height + 20) {
            drop.y = -12;
            drop.x = Math.random() * rainCanvas.width;
        }
        if (drop.x > rainCanvas.width + 20) {
            drop.x = -10;
        }
        if (drop.x < -20) {
            drop.x = rainCanvas.width + 10;
        }
        
        // Check collision with UI elements
        const collision = isNearElement(drop.x, drop.y);
        
        if (collision) {
            // Draw rain drop with glow/splash effect near UI
            rainCtx.globalAlpha = RAIN_CONFIG.rainAlpha * 0.8;
            rainCtx.shadowColor = 'rgba(200, 220, 255, 0.5)';
            rainCtx.shadowBlur = 4;
            
            rainCtx.beginPath();
            rainCtx.moveTo(drop.x, drop.y);
            rainCtx.lineTo(drop.x + RAIN_CONFIG.windX * 0.5, drop.y + drop.len);
            rainCtx.stroke();
            
            rainCtx.shadowColor = 'transparent';
        } else {
            // Normal rain
            rainCtx.globalAlpha = RAIN_CONFIG.rainAlpha;
            rainCtx.beginPath();
            rainCtx.moveTo(drop.x, drop.y);
            rainCtx.lineTo(drop.x + RAIN_CONFIG.windX * 0.5, drop.y + drop.len);
            rainCtx.stroke();
        }
    }
    
    // Draw droplets on title and button surfaces
    drawWetEffect();
    
    // Draw wind streaks during heavy rainstorm
    drawWindStreaks();
    
    rainCtx.globalAlpha = 1;
    requestAnimationFrame(drawRain);
}

// Draw wind streaks on homepage
function drawWindStreaks() {
    rainCtx.globalAlpha = RAIN_CONFIG.rainAlpha * 0.25;
    rainCtx.strokeStyle = RAIN_CONFIG.dropColor;
    rainCtx.lineWidth = 2;
    
    const windStrength = Math.abs(RAIN_CONFIG.windX) * 2;
    const streakCount = 20;
    
    for (let i = 0; i < streakCount; i++) {
        const y = (i * (rainCanvas.height / streakCount)) % rainCanvas.height;
        const streakLength = 60 + Math.sin(i * 0.5) * 30;
        const xOffset = Math.sin(i * 0.3) * 15;
        
        rainCtx.beginPath();
        rainCtx.moveTo(xOffset, y);
        rainCtx.lineTo(xOffset + streakLength, y);
        rainCtx.stroke();
        
        // Double streak for layered effect
        rainCtx.beginPath();
        rainCtx.moveTo(rainCanvas.width + xOffset - streakLength, y + 2);
        rainCtx.lineTo(rainCanvas.width + xOffset, y + 2);
        rainCtx.stroke();
    }
}

// Draw wet droplets on UI elements
function drawWetEffect() {
    const titleElement = document.querySelector('.game-title');
    const buttonElement = document.querySelector('.start-button');
    
    if (titleElement && buttonElement) {
        const titleRect = titleElement.getBoundingClientRect();
        const buttonRect = buttonElement.getBoundingClientRect();
        
        // Draw droplets on title
        rainCtx.globalAlpha = RAIN_CONFIG.rainAlpha * 0.5;
        for (let i = 0; i < 5; i++) {
            const x = titleRect.left + Math.random() * titleRect.width;
            const y = titleRect.bottom - 5;
            const radius = 1.5 + Math.random() * 2;
            
            rainCtx.beginPath();
            rainCtx.arc(x, y, radius, 0, Math.PI * 2);
            rainCtx.fillStyle = RAIN_CONFIG.dropColor;
            rainCtx.fill();
        }
        
        // Draw droplets on button
        for (let i = 0; i < 3; i++) {
            const x = buttonRect.left + Math.random() * buttonRect.width;
            const y = buttonRect.top + Math.random() * buttonRect.height;
            const radius = 1 + Math.random() * 1.5;
            
            rainCtx.beginPath();
            rainCtx.arc(x, y, radius, 0, Math.PI * 2);
            rainCtx.fillStyle = RAIN_CONFIG.dropColor;
            rainCtx.fill();
        }
    }
}

// Start rain animation
drawRain();

// Lightning Effect System
const lightningOverlay = document.getElementById('lightning-overlay');

function triggerLightning() {
    if (!gameStarted && lightningOverlay) {
        // Remove previous animation class
        lightningOverlay.classList.remove('lightning-flash');
        
        // Trigger reflow to restart animation
        void lightningOverlay.offsetWidth;
        
        // Add animation class to trigger flash
        lightningOverlay.classList.add('lightning-flash');
    }
}

// Trigger lightning every 3 seconds while on homepage
const lightningInterval = setInterval(() => {
    if (gameStarted) {
        clearInterval(lightningInterval);
    } else {
        triggerLightning();
    }
}, 3000);

startBtn.addEventListener('click', () => {
    if (!gameStarted) {
        gameStarted = true;
        // Stop homepage weather sounds
        audio.stop('heavyrain');
        audio.stop('thunder');
        // Fade out effect
        homepage.style.transition = 'opacity 0.8s ease-out';
        homepage.style.opacity = '0';
        setTimeout(() => {
            homepage.classList.add('hidden');
            homepage.style.opacity = '1';
        }, 800);
    }
});

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
const boat = new Boat(950, 650);

const keys = {};
let frame = 0;
let cameraX = 0;
let cameraY = 0;
let currentMap = 0;
let eWasUp = true;
let rWasUp = true;

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
    
    // --- WEATHER SOUND LOGIC ---
    const currentWeather = WeatherSystem.targetState;
    if (currentWeather === 'stormy') {
        if (audio.currentWeatherSound !== 'heavyrain') {
            audio.stop('heavyrain');
            audio.play('heavyrain');
            audio.currentWeatherSound = 'heavyrain';
        }
    } else {
        if (audio.currentWeatherSound === 'heavyrain') {
            audio.stop('heavyrain');
            audio.currentWeatherSound = null;
        }
    }
    
    player.update(1, G, boat, fishManager, currentMap); // then player follows
    fishManager.update();                    // all fish update
    boatMerchant.update();
    rodMerchant.update(boat, frame);

    // --- MAP TRANSITIONS & BOUNDARIES ---
    currentMap = transitionManager.updateTransition(currentMap, boat, player);
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
            if (Math.abs(boat.x - 950) < 100 && boat.state === 'idle') {
                player.state = 'walking';
                player.x = 1000;
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
            else if (playerRelCenterX > bounds.width - zoneWidth) boat.state = boat.state === 'sailing' ? 'idle' : 'sailing';
            else if (rodMerchant.isNear(player)) uiManager.openMerchantUI("rod", keys);
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
            boatMerchant.draw(ctx, cameraX, player);
            rodMerchant.draw(ctx, cameraX, player);
        } else {
            // Rod merchant follows on boat in other maps too
            rodMerchant.draw(ctx, cameraX, player);
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