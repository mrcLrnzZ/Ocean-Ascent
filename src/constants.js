export const W = window.innerWidth;
export const H = window.innerHeight;

// -------------------
// MAP DIMENSIONS
// -------------------
export const GROUND_Y   = 390;   // The Y-coordinate where the grass sits
export const SHORE_END  = 740;   // The X-coordinate where land ends and water begins

// -------------------
// COLOR PALETTE (P)
// -------------------
export const P = {
  // Sky Gradient Colors
  skyTop:    '#5bc8f5', 
  skyBot:    '#8ad8f8',
  
  // Land Colors
  grassTop:  '#7ec850', // Bright green top
  grassMid:  '#5a9a30', // Darker green side
  grassDark: '#3a6a1a', // Shadow under grass
  dirtTop:   '#8a6040', // Top soil
  dirtMid:   '#6a4828', // Deep earth
  
  // Simple Water Placeholder (so we can see the edge)
  waterDeep: '#0a2050'
};