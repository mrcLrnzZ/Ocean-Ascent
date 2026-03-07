import { W, H } from './constants.js'; // screen size
import { drawSky, drawGround, drawWater } from './render_map.js'; // background rendering
import { Player } from './player.js'; // player logic (movement, drawing, etc.)
import { FishManager } from './fish_manager.js'; // manages all fish (spawning, updating, drawing)
import { Rod } from './fishing.js'; // fishing rod / bait system (casting, reeling, hitbox, etc.)
// mergin to main
// 1. SETUP CANVAS
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

// 2. INITIALIZE VARIABLES
const fishManager = new FishManager();
const player = new Player(fishManager); // player.js now has access to the fish system.
const keys = {};
let frame = 0;
let cameraX = 0; // Needed for scrolling

// 3. INPUT LISTENERS
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// 4. THE SINGLE COMBINED GAME LOOP
function loop() {
    // A. Update logic
    frame++;
    const G = { keys, state: 'shore' };
    player.update(1, G); // pass input state to player for movement and casting
    fishManager.update();

    // B. Clear and Draw
    ctx.clearRect(0, 0, W, H);

    drawSky(ctx);

    // Draw Water BEFORE the Ground/Player so they sit on top of the deep blue
    drawWater(ctx, cameraX, frame);
    fishManager.draw(ctx, cameraX);
    // rod.draw(ctx, cameraX);
    drawGround(ctx, cameraX);

    // Draw the Player last so they are in front of everything
    player.draw(ctx, cameraX);

    requestAnimationFrame(loop);
}

// 5. START THE GAME
loop();
