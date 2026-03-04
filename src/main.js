import { W, H } from './constants.js';
import { drawSky, drawGround, drawWater } from './render_map.js';
import { Player } from './player.js';
import { FishManager } from './fish_manager.js';

// 1. SETUP CANVAS
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

// 2. INITIALIZE VARIABLES
const player = new Player();
const fishManager = new FishManager();
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
    player.update(1, G);
    fishManager.update();
    
    // B. Clear and Draw
    ctx.clearRect(0, 0, W, H);

    drawSky(ctx);      
    
    // Draw Water BEFORE the Ground/Player so they sit on top of the deep blue
    drawWater(ctx, cameraX, frame);
    fishManager.draw(ctx, cameraX);
    drawGround(ctx, cameraX); 
    
    // Draw the Player last so they are in front of everything
    player.draw(ctx, cameraX);
    
    requestAnimationFrame(loop);
}

// 5. START THE GAME
loop();