import { W, H } from './constants.js';
import { drawSky, drawGround, drawWater, drawObjects } from './render_map.js';
import { Player } from './player.js';

// 1. SETUP CANVAS
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const player = new Player();
const keys = {};
let frame = 0;
let cameraX = 0; // Needed for scrolling

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function loop() {
    // A. Update logic
    frame++; 
    const G = { keys, state: 'shore' }; 
    player.update(1, G);

    // B. Clear and Draw
    ctx.clearRect(0, 0, W, H);

    drawSky(ctx);      
    
    // Draw Water BEFORE the Ground/Player so they sit on top of the deep blue
   
    // Draw the Player last so they are in front of everything
    player.draw(ctx, cameraX);
    
    drawObjects(ctx, cameraX);
     drawWater(ctx, cameraX, frame);
     
    drawGround(ctx, cameraX); 
    requestAnimationFrame(loop);
}

// 5. START THE GAME
loop();