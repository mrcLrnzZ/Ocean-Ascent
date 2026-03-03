import { W, H } from './constants.js';
import { drawSky, drawGround } from './render_map.js';

// 1. Setup Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

// 2. The Game Loop
function loop() {
  // A. Clear the screen (optional since we draw sky over it)
  ctx.clearRect(0, 0, W, H);

  // B. Draw our layers
  drawSky(ctx);      // Background first
  drawGround(ctx);   // Land on top

  // C. Repeat endlessly
  requestAnimationFrame(loop);
}

// 3. Start!
loop();