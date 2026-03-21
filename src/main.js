
import { drawSky, drawDock, drawBackground, drawGround, drawWaterBackground, drawWaterForeground, drawTransition, drawDeepSoil, drawDockOverlay } from './render_map.js';
import { Player } from './player.js';
import { Merchant, RodMerchant } from './merchant.js';
import { Boat } from './boat.js';
import { GROUND_Y, WATER_Y, W, H, getDepthEndLine } from './constants.js';
import { debugCam, toggleDebugCam } from './debugcam.js';
import { FishManager } from './fish_manager.js';
import { uiManager } from './ui.js';
import { camera } from './camera.js';
import { transitionManager } from './map_transition.js';
import { AudioManager } from './audio.js';
import { WeatherSystem, HomeWeather, updateWeatherDisplay, buildWeatherWeightPanel } from './environment.js';
import { effectManager } from './effects.js';
import { RadioManager } from './radio.js';
export const audio = new AudioManager();
export const radio = new RadioManager();


let gameStarted = false;
let audioStarted = false;
const homepage = document.getElementById('homepage');
const startBtn = document.getElementById('startBtn');

// Start homepage weather sounds on first user interaction
function startHomepageAudio() {
    if (!audioStarted && !gameStarted) {
        audioStarted = true;
        audio.play("ocean");
        audio.play('heavyrain');
        audio.play('thunder');
    }
}

document.addEventListener('click', startHomepageAudio, { once: true });
document.addEventListener('keydown', startHomepageAudio, { once: true });
document.addEventListener('touchstart', startHomepageAudio, { once: true });

// Start rain animation
HomeWeather.init();

startBtn.addEventListener('click', () => {
    if (!gameStarted) {
        gameStarted = true;
        HomeWeather.stop(); // Stops homepage rain/lightning

        // Stop all homepage sounds while video plays
        audio.stop('ocean');
        audio.stop('heavyrain');
        audio.stop('thunder');

        // Show and play the intro video
        const introVideo = document.getElementById('introVideo');
        const gameCanvas = document.getElementById('gameCanvas');

 const banana = false;

        if (banana) {

              introVideo.style.display = 'block';
        gameCanvas.style.display = 'none';
        homepage.style.display = 'none';

        introVideo.play();

        // When video ends, start the game
        introVideo.addEventListener('ended', () => {
            introVideo.style.display = 'none';
            gameCanvas.style.display = 'block';
            requestAnimationFrame(loop);
        }, { once: true });

        }else{
            introVideo.style.display = 'none';
        homepage.style.display = 'none';
            gameCanvas.style.display = 'block';
            requestAnimationFrame(loop);

        }







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
const boat = new Boat(750, 650);

const keys = {};
let frame = 0;
let cameraX = 0;
let cameraY = 0;
let currentMap = 0;
let eWasUp = true;
let rWasUp = true;
let hasReachedEndingDock = false;
let _lastTime = null; // for real delta-time

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

buildWeatherWeightPanel();
updateWeatherDisplay();

// 5. MAIN LOOP
function loop(timestamp) {
    frame++;

    audio.play("ocean");
    // Real delta time in seconds (capped at 0.1s to prevent large jumps on tab-switch)
    if (_lastTime === null) _lastTime = timestamp;
    const dt = Math.min((timestamp - _lastTime) / 1000, 0.1);
    _lastTime = timestamp;

    // Game state object
    const G = { keys: transitionManager.active ? {} : keys, state: player.state || 'walking', frame, currentMap };

    // --- UPDATE LOGIC ---
    boat.update(G, rodMerchant);
    WeatherSystem.update(frame, audio);
    player.update(dt, G, boat, fishManager, currentMap);
    fishManager.update();                    // all fish update
    boatMerchant.update();
    rodMerchant.update(boat, frame, currentMap);
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
                rodMerchant.disembark(5500, true, currentMap);
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
                // Position player at front for boat 3, center for others
                if (boat.level === 3) {
                    player.x = boat.x + (boat.width * boat.scale) * 0.75;
                } else {
                    player.x = boat.x + (boat.width * boat.scale) / 2;
                }
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

    // Update seasonal / weather UI
    if (frame % 60 === 0) {
        updateWeatherDisplay();
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

        if (rodMerchant.onBoat || rodMerchant.currentMapId === currentMap) {
            rodMerchant.draw(ctx, cameraX, player);
        }

        drawDockOverlay(ctx, cameraX, currentMap);

        // Draw fish for this map (depth < 5) before the foreground overlay
        fishManager.draw(ctx, cameraX, (f) => f.mapId === currentMap && f.depthLevel < 5);

        boat.draw(ctx, cameraX, frame, player);

        // 6. Foreground layers
        drawWaterForeground(ctx, cameraX, frame, currentMap);

        // Draw Abyss fish (depth 5) for this map after the pitch-black overlay to keep them visible
        fishManager.draw(ctx, cameraX, (f) => f.mapId === currentMap && f.depthLevel === 5);
        effectManager.draw(ctx, cameraX);
        drawDeepSoil(ctx, cameraX, currentMap);
        ctx.restore();

        // Weather effects drawn in SCREEN-SPACE (after restore) so they don't scroll
        WeatherSystem.drawWeatherEffects(ctx, cameraY);

        if (transitionManager.active) {
            drawTransition(ctx, transitionManager.progress, transitionManager.direction, transitionManager.sweepDir);
        }

        if (!window._gameOver) {
            requestAnimationFrame(loop);
        }
    } catch (e) {
        console.log(e);
    }
}

// ── Game-Over helpers (called from gameover-screen buttons) ──────────────────
window.gameHome = function () {
    // Full page reload — simplest and most reliable way to return to start screen
    window.location.reload();
};
