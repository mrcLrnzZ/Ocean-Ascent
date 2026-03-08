// src/main.js
import { W, H, GROUND_Y, MAPS, MAP_TRANSITION_X_RIGHT, MAP_TRANSITION_X_LEFT } from './constants.js';
import { drawSky, drawDock, drawBackground, drawGround, drawWater, drawSoilOverlap, drawTransition } from './render_map.js';
import { Player } from './player.js';
import { Merchant } from './merchant.js';
import { Boat } from './boat.js';
import { FishManager } from './fish_manager.js';

// 1. SETUP CANVAS
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

// 2. INITIALIZE GAME OBJECTS
const fishManager = new FishManager();
const player = new Player(fishManager); // pass fishManager to player
const merchant = new Merchant(540, GROUND_Y);
const boat = new Boat(950, 650); // docked boat

const keys = {};
let frame = 0;
let cameraX = 0;
let uiOpen = false;
let currentMap = 0;

const transition = {
    active: false,
    progress: 0,
    direction: 1,
    sweepDir: 1,
    speed: 0.02,
    pendingMapChange: null,
    pendingPlayerX: null,
    pendingBoatX: null
};

// HUD Data
const boatPrices = [0, 20, 50, 100];
const rodPrices = [0, 0, 50, 150, 400, 800];
const rodNames = ["", "Bamboo Rod", "Fiberglass Rod", "Graphite Rod", "Carbon Rod", "Master Rod"];

function updateHUD() {
    document.getElementById('h-money').textContent = `$${player.money}`;
    document.getElementById('h-rod').textContent = rodNames[player.rodLevel];
    document.getElementById('h-boat').textContent = player.boatLevel === 0 ? "None" : `Level ${player.boatLevel} Boat`;
}
updateHUD();

// 3. INPUT LISTENERS
window.addEventListener('keydown', e => {
    if (!uiOpen) keys[e.key] = true;
});
window.addEventListener('keyup', e => keys[e.key] = false);

// 4. MERCHANT UI FUNCTIONS (aolid si leader maw maw)
function openMerchantUI() {
    uiOpen = true;
    for (let k of ['e','E','ArrowLeft','ArrowRight','a','d']) keys[k] = false;
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
    } else html += `<div class="row">Boat: Fully Upgraded!</div>`;

    // Rod Upgrades
    if (player.rodLevel < 5) {
        const nextRod = player.rodLevel + 1;
        const price = rodPrices[nextRod];
        const name = rodNames[nextRod];
        html += `<div class="row">
            ${name} - $${price}
            <button onclick="buyRod(${nextRod}, ${price})" class="gold">Buy</button>
        </div>`;
    } else html += `<div class="row">Rod: Fully Upgraded!</div>`;

    html += `<button onclick="closeUI()" style="margin-top:15px">Close</button>`;
    popup.innerHTML = html;
    popup.style.display = 'block';
}

window.buyBoat = function(level, price) {
    if (player.money >= price) {
        player.money -= price;
        player.boatLevel = level;
        boat.setLevel(level);
        boat.isPurchased = true;
        updateHUD();
        openMerchantUI();
    } else alert("Not enough money!");
}

window.buyRod = function(level, price) {
    if (player.money >= price) {
        player.money -= price;
        player.rodLevel = level;
        player.rod.maxPower = 5 + level * 3.5; // pampalakas ng bato based sa level
        updateHUD();
        openMerchantUI();
    } else alert("Not enough money!");
}

window.closeUI = function() {
    document.getElementById('popup').style.display = 'none';
    setTimeout(() => uiOpen = false, 100);
}

// 5. MAIN LOOP
function loop() {
    frame++;

    // Game state object
    const G = { keys: transition.active ? {} : keys, state: player.state || 'walking', frame };

    // --- UPDATE LOGIC ---
    player.update(1, G, boat, fishManager); // player handles movement + rod
    fishManager.update();                    // all fish update
    merchant.update();
    boat.update(G);

    // --- MAP TRANSITIONS ---
    if (transition.active) {
        transition.progress += transition.speed * transition.direction;

        if (transition.progress >= 1 && transition.direction === 1) {
            transition.direction = -1;
            transition.progress = 1;

            if (transition.pendingMapChange !== null) {
                currentMap = transition.pendingMapChange;
                boat.x = transition.pendingBoatX;
                player.x = transition.pendingPlayerX;
                transition.pendingMapChange = null;
            }
        }
        if (transition.progress <= 0 && transition.direction === -1) {
            transition.active = false;
            transition.progress = 0;
            transition.direction = 1;
        }
    }

    // --- MAP BOUNDARIES & TRIGGER ---
    if ((boat.state === 'sailing' || player.state === 'onBoat') && !transition.active) {
        if (boat.x > MAP_TRANSITION_X_RIGHT) {
            if (currentMap < MAPS.length - 1) {
                const nextMapReq = MAPS[currentMap + 1].requiredBoatLvl;
                if (player.boatLevel >= nextMapReq) {
                    transition.active = true;
                    transition.direction = 1;
                    transition.sweepDir = 1;
                    transition.pendingMapChange = currentMap + 1;
                    const playerRel = player.x - boat.x;
                    transition.pendingBoatX = MAP_TRANSITION_X_LEFT + 10;
                    transition.pendingPlayerX = transition.pendingBoatX + playerRel;
                    boat.vx = 0;
                } else {
                    boat.x = MAP_TRANSITION_X_RIGHT;
                    boat.vx = 0;
                    const notif = document.getElementById('notif');
                    if (notif) {
                        notif.textContent = `Need Level ${nextMapReq} Boat to sail further!`;
                        notif.style.opacity = "1";
                        setTimeout(() => notif.style.opacity = "0", 3000);
                    }
                }
            } else boat.x = MAP_TRANSITION_X_RIGHT;
        } else if (boat.x < MAP_TRANSITION_X_LEFT && currentMap > 0) {
            transition.active = true;
            transition.direction = 1;
            transition.sweepDir = -1;
            transition.pendingMapChange = currentMap - 1;
            const playerRel = player.x - boat.x;
            transition.pendingBoatX = MAP_TRANSITION_X_RIGHT - 50;
            transition.pendingPlayerX = transition.pendingBoatX + playerRel;
            boat.vx = 0;
        } else if (boat.x < MAP_TRANSITION_X_LEFT && currentMap === 0) {
            boat.x = MAP_TRANSITION_X_LEFT;
            boat.vx = 0;
        }
    }

    // --- INTERACTIONS ---
    if ((keys['e'] || keys['E']) && !uiOpen) {
        if (!player.state) player.state = 'walking';

        if (player.state === 'walking') {
            if (merchant.isNear(player)) openMerchantUI();
            else if (boat.isPurchased && Math.abs(player.x - boat.x) < 200) {
                player.state = 'onBoat';
                player.x = boat.x + (boat.width * boat.scale)/2;
                const notif = document.getElementById('notif');
                if (notif) {
                    notif.textContent = "You are on the boat. Press E at ends to Fish/Sail.";
                    notif.style.opacity = "1";
                    setTimeout(() => notif.style.opacity = "0", 3000);
                }
            }
        } else if (player.state === 'onBoat') {
            const bounds = boat.getBounds();
            const playerRelX = player.x - boat.x;
            const zoneWidth = bounds.width / 3;

            if (playerRelX < zoneWidth) boat.state = boat.state === 'fishing' ? 'idle' : 'fishing';
            else if (playerRelX > bounds.width - zoneWidth) boat.state = boat.state === 'sailing' ? 'idle' : 'sailing';
            else if (Math.abs(boat.x - 950) < 100 && boat.state === 'idle') {
                player.state = 'walking';
                player.x = 1000;
                const notif = document.getElementById('notif');
                if (notif) {
                    notif.textContent = "Disembarked boat.";
                    notif.style.opacity = "1";
                    setTimeout(() => notif.style.opacity = "0", 3000);
                }
            }
        }

        keys['e'] = false; keys['E'] = false;
    }

    // --- CAMERA ---
    if (player.state === 'onBoat') cameraX = boat.x - W/2 + (boat.width*boat.scale)/2;
    else cameraX = Math.max(0, player.x - W/2);

    // --- RENDER ---
    ctx.clearRect(0, 0, W, H);

    drawSky(ctx);
    drawBackground(ctx, cameraX, currentMap);
    drawGround(ctx, cameraX, currentMap, frame);
    drawWater(ctx, cameraX, frame, currentMap);
    drawSoilOverlap(ctx, cameraX, currentMap);
    drawDock(ctx, cameraX, currentMap);

    merchant.draw(ctx, cameraX, player);
    fishManager.draw(ctx, cameraX);  // the fih
    player.draw(ctx, cameraX);
    boat.draw(ctx, cameraX, frame, player);

    if (transition.active) drawTransition(ctx, transition.progress, transition.direction, transition.sweepDir);

    requestAnimationFrame(loop);
}

// 6. START GAME
loop();