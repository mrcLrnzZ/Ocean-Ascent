import { W, H } from './constants.js';
import { drawSky, drawDock, drawBackground, drawGround, drawWaterBackground, drawWaterForeground, drawSoilOverlap, drawTransition } from './render_map.js';
import { Player } from './player.js';
import { Merchant } from './merchant.js';
import { Boat } from './boat.js';
import { GROUND_Y, WATER_Y, MAPS, MAP_TRANSITION_X_LEFT } from './constants.js';

// 1. SETUP CANVAS
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const player = new Player();
const merchant = new Merchant(540, GROUND_Y);
const boat = new Boat(950, 650); // Position it relative to the dock

const keys = {};
let frame = 0;
let cameraX = 0; // Needed for scrolling
let cameraY = 0; // Added for vertical scrolling (debug camera)
let uiOpen = false;
let currentMap = 0;

const transition = {
    active: false,
    progress: 0,
    direction: 1, // 1 for fading in, -1 for fading out
    sweepDir: 1,  // 1 for right->left, -1 for left->right
    speed: 0.02,
    pendingMapChange: null,
    pendingPlayerX: null,
    pendingBoatX: null
};

// Prices and Names
const boatPrices = [0, 20, 50, 100];
const rodPrices = [0, 0, 50, 150, 400, 800];
const rodNames = ["", "Bamboo Rod", "Fiberglass Rod", "Graphite Rod", "Carbon Rod", "Master Rod"];

function updateHUD() {
    document.getElementById('h-money').textContent = `$${player.money}`;
    document.getElementById('h-rod').textContent = rodNames[player.rodLevel];
    if (player.boatLevel === 0) {
        document.getElementById('h-boat').textContent = "None";
    } else {
        document.getElementById('h-boat').textContent = `Level ${player.boatLevel} Boat`;
    }
}
updateHUD();

window.addEventListener('keydown', e => {
    if (!uiOpen) keys[e.key] = true;
});
window.addEventListener('keyup', e => keys[e.key] = false);

// Debug Camera logic
const debugCam = {
    enabled: false,
    x: 0,
    y: 0,
    speed: 15
};

document.getElementById('debug-btn').addEventListener('click', (e) => {
    debugCam.enabled = !debugCam.enabled;
    e.target.textContent = `Debug Cam: ${debugCam.enabled ? 'ON' : 'OFF'}`;
    if (debugCam.enabled) {
        debugCam.x = cameraX;
        debugCam.y = cameraY;
    }
});

function openMerchantUI() {
    uiOpen = true;
    keys['e'] = false; keys['E'] = false;
    keys['ArrowLeft'] = false; keys['ArrowRight'] = false; keys['a'] = false; keys['d'] = false;

    const popup = document.getElementById('popup');
    let html = `<h2>Merchant</h2>`;

    // Boat Upgrades
    if (player.boatLevel < 3) {
        const nextBoat = player.boatLevel + 1;
        const price = boatPrices[nextBoat];
        html += `<div class="row">
            Level ${nextBoat} Boat - $${price}
            <button onclick="buyBoat(${nextBoat}, ${price})" class="gold">Buy</button>
        </div>`;
    } else {
        html += `<div class="row">Boat: Fully Upgraded!</div>`;
    }

    // Rod Upgrades
    if (player.rodLevel < 5) {
        const nextRod = player.rodLevel + 1;
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

window.buyBoat = function (level, price) {
    if (player.money >= price) {
        player.money -= price;
        player.boatLevel = level;
        boat.setLevel(level);
        updateHUD();
        openMerchantUI(); // refresh
    } else {
        alert("Not enough money!");
    }
}

window.buyRod = function (level, price) {
    if (player.money >= price) {
        player.money -= price;
        player.rodLevel = level;
        updateHUD();
        openMerchantUI(); // refresh
    } else {
        alert("Not enough money!");
    }
}

window.closeUI = function () {
    document.getElementById('popup').style.display = 'none';
    setTimeout(() => { uiOpen = false; }, 100);
}

function loop() {
    // A. Update logic
    frame++;
    const G = { keys: transition.active ? {} : keys, state: 'shore', frame }; // Ignore keys if transitioning
    player.update(1, G, boat);
    merchant.update();
    boat.update(G);

    // Transition State Update
    if (transition.active) {
        transition.progress += transition.speed * transition.direction;

        // Peak of transition - swap maps
        if (transition.progress >= 1 && transition.direction === 1) {
            transition.direction = -1; // start fading out
            transition.progress = 1;

            if (transition.pendingMapChange !== null) {
                currentMap = transition.pendingMapChange;
                boat.x = transition.pendingBoatX;
                player.x = transition.pendingPlayerX;
                transition.pendingMapChange = null;
            }
        }

        // End of transition
        if (transition.progress <= 0 && transition.direction === -1) {
            transition.active = false;
            transition.progress = 0;
            transition.direction = 1;
        }
    }

    // Map Transition Logic Trigger
    if ((boat.state === 'sailing' || player.state === 'onBoat') && !transition.active) {
        const currentMapLength = MAPS[currentMap].length;

        if (boat.x > currentMapLength) {
            if (currentMap < MAPS.length - 1) {
                const nextMapReq = MAPS[currentMap + 1].requiredBoatLvl;
                if (player.boatLevel >= nextMapReq) {
                    // Trigger Transition Right
                    transition.active = true;
                    transition.direction = 1;
                    transition.sweepDir = 1;
                    transition.pendingMapChange = currentMap + 1;
                    const playerRel = player.x - boat.x;
                    transition.pendingBoatX = MAP_TRANSITION_X_LEFT + 10;
                    transition.pendingPlayerX = transition.pendingBoatX + playerRel;

                    boat.vx = 0; // stop moving visually during transition begin
                } else {
                    boat.x = currentMapLength; // block
                    boat.vx = 0;
                    const notif = document.getElementById('notif');
                    if (notif) {
                        notif.textContent = `Need Level ${nextMapReq} Boat to sail further!`;
                        notif.style.opacity = "1";
                        setTimeout(() => notif.style.opacity = "0", 3000);
                    }
                }
            } else {
                boat.x = currentMapLength; // Edge of world
                boat.vx = 0;
            }
        } else if (boat.x < MAP_TRANSITION_X_LEFT && currentMap > 0) {
            // Trigger Transition Left
            transition.active = true;
            transition.direction = 1;
            transition.sweepDir = -1;
            transition.pendingMapChange = currentMap - 1;
            const playerRel = player.x - boat.x;
            transition.pendingBoatX = MAPS[currentMap - 1].length - 50;
            transition.pendingPlayerX = transition.pendingBoatX + playerRel;

            boat.vx = 0;
        } else if (boat.x < MAP_TRANSITION_X_LEFT && currentMap === 0) { // Keep bounds for shore map
            boat.x = MAP_TRANSITION_X_LEFT;
            boat.vx = 0;
        }
    }

    // Interaction logic
    if ((keys['e'] || keys['E']) && !uiOpen) {
        // Defensive check for state
        if (!player.state) player.state = 'walking';

        if (player.state === 'walking') {
            if (merchant.isNear(player)) {
                openMerchantUI();
            } else if (boat.isPurchased && Math.abs(player.x - boat.x) < 200) {
                console.log("Boarding boat...");
                player.state = 'onBoat';
                player.x = boat.x + (boat.width * boat.scale) / 2;

                const notif = document.getElementById('notif');
                if (notif) {
                    notif.textContent = "You are on the boat. Press E at ends to Fish/Sail.";
                    notif.style.opacity = "1";
                    setTimeout(() => {
                        if (notif) notif.style.opacity = "0";
                    }, 3000);
                }
            }
        } else if (player.state === 'onBoat') {
            const bounds = boat.getBounds();
            const playerRelX = player.x - boat.x;
            const zoneWidth = bounds.width / 3;

            if (playerRelX < zoneWidth) {
                // Fishing
                boat.state = boat.state === 'fishing' ? 'idle' : 'fishing';
                console.log("Fishing state:", boat.state);
            } else if (playerRelX > bounds.width - zoneWidth) {
                // Navigation
                boat.state = boat.state === 'sailing' ? 'idle' : 'sailing';
                console.log("Sailing state:", boat.state);
            } else if (Math.abs(boat.x - 950) < 100 && boat.state === 'idle') {
                // Disembark
                player.state = 'walking';
                player.x = 1000; // Place back on dock
                const notif = document.getElementById('notif');
                if (notif) {
                    notif.textContent = "Disembarked boat.";
                    notif.style.opacity = "1";
                    setTimeout(() => {
                        if (notif) notif.style.opacity = "0";
                    }, 3000);
                }
            }
        }
        // Basic debounce: clear key
        keys['e'] = false;
        keys['E'] = false;
    }

    // Depth Meter Logic
    const depthMeter = document.getElementById('sea-depth-meter');
    if (depthMeter) {
        // Only show if we're near or under water (WATER_Y = 600, screen center approx cameraY + H/2)
        const cameraCenterY = cameraY + (H / 2);
        if (cameraCenterY >= WATER_Y) {
            depthMeter.style.display = 'block';
            // Convert pixels to meters (e.g., 20px = 1m)
            const metersDeep = Math.floor((cameraCenterY - WATER_Y) / 20);

            // Determine level (DEPTH_LEVEL_HEIGHT = 1500)
            const levelNum = Math.min(5, Math.floor((cameraCenterY - WATER_Y) / 1500) + 1);

            depthMeter.textContent = `Depth: ${metersDeep}m (Level ${levelNum})`;
        } else {
            depthMeter.style.display = 'none';
        }
    }

    // Camera logic: Follow player or boat or debug
    if (debugCam.enabled) {
        // Free cam movement
        if (keys['w'] || keys['ArrowUp']) debugCam.y -= debugCam.speed;
        if (keys['s'] || keys['ArrowDown']) debugCam.y += debugCam.speed;
        if (keys['a'] || keys['ArrowLeft']) debugCam.x -= debugCam.speed;
        if (keys['d'] || keys['ArrowRight']) debugCam.x += debugCam.speed;
        cameraX = debugCam.x;
        cameraY = debugCam.y;
    } else {
        if (player.state === 'onBoat') {
            cameraX = boat.x - W / 2 + (boat.width * boat.scale) / 2;
        } else {
            cameraX = Math.max(0, player.x - W / 2);
        }
        // Smoothly return Y to default 0
        cameraY += (0 - cameraY) * 0.1;
    }

    // B. Clear and Draw
    try {
        ctx.clearRect(0, 0, W, H);

        ctx.save();
        ctx.translate(0, -Math.floor(cameraY));

        drawSky(ctx);
        drawWaterBackground(ctx, cameraX, currentMap); // 1. Solid back water color
        drawBackground(ctx, cameraX, currentMap);
        drawGround(ctx, cameraX, currentMap, frame);



        drawDock(ctx, cameraX, currentMap);
        if (currentMap === 0) {
            merchant.draw(ctx, cameraX, player);
        }
        player.draw(ctx, cameraX);

        boat.draw(ctx, cameraX, frame, player); // 2. Sprites and objects

        drawWaterForeground(ctx, cameraX, frame, currentMap); // 3. Transparent water gradient over top
        drawSoilOverlap(ctx, cameraX, currentMap);
        ctx.restore();

        // Draw transition effect covering the screen
        if (transition.active) {
            drawTransition(ctx, transition.progress, transition.direction, transition.sweepDir);
        }

    } catch (e) {
        console.error("Rendering error:", e);
    }

    if (!uiOpen) {
        requestAnimationFrame(loop);
    } else {
        // Just draw statically if UI is open
        requestAnimationFrame(loop);
    }
}

// 5. START THE GAME
loop();