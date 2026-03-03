import { P, W, H, GROUND_Y, SHORE_END } from './constants.js';

// Helper to draw a rectangle (x, y, width, height, color)
function rect(ctx, x, y, w, h, c) { 
  ctx.fillStyle = c; 
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h)); 
}

// 1. Draw the Sky
export function drawSky(ctx) {
  // Create a nice gradient from top to bottom
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, P.skyTop);
  g.addColorStop(1, P.skyBot);
  
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// 2. Draw the Land (The Shore)
export function drawGround(ctx) {
  // A. The Deep Dirt (Underground)
  // Starts at SHORE_END and goes left to 0
  rect(ctx, 0, GROUND_Y + 10, SHORE_END, H - GROUND_Y, P.dirtMid);
  
  // B. The Top Soil (Just below grass)
  rect(ctx, 0, GROUND_Y, SHORE_END, 10, P.dirtTop);
  
  // C. The Grass Strip (The surface)
  rect(ctx, 0, GROUND_Y - 10, SHORE_END, 10, P.grassTop);
  
  // D. Grass Details (Highlights and Shadows)
  rect(ctx, 0, GROUND_Y - 10, SHORE_END, 2, P.grassMid); // Highlight
  rect(ctx, 0, GROUND_Y - 2, SHORE_END, 4, P.grassDark); // Shadow edge
}