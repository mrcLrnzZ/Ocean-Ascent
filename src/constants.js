export const W = 1920; // Fixed logical width
export const H = 900; // Fixed logical height

export const GROUND_Y = 500;
export const WATER_Y = 600;


export const SHORE_END = 305;
export const PIER_END_X = 1100;

export const P = {

  // Sky Gradient Colors
  skyTop: '#5bc8f5',
  skyBot: '#0a65c7',

  // lugar Colors
  sandTop: '#f0d080',
  sandMid: '#d8b060',

  grassTop: '#7ec850',
  grassMid: '#5a9a30',
  grassDark: '#3a6a1a',

  dirtTop: '#8a6040',
  dirtMid: '#6a4828',

  // tubig Colors
  waterTop: '#4090c880',
  waterDeep: '#0051ff80',
  waterFoam: '#39bdff80'

};

// Level Distance Configuration
export const SHORE_LEVEL_LENGTH = 10000;
export const LEVEL_1_LENGTH = 2000;
export const LEVEL_2_LENGTH = 3000;
export const LEVEL_3_LENGTH = 4000;

// MAP SYSTEM CONFIG
export const MAP_TRANSITION_X_LEFT = 740;

export const DEPTH_LEVEL_HEIGHT = 1500; // Customizable depth of each band in pixels

export const DEPTH_LINE_COLOR = '#ffffff40'; // Color of the dotted depth boundary lines

export const DEPTH_COLORS = {
  1: '#0a65c780', // Surface Level
  2: '#0051ff', // Depth 1
  3: '#0033aa', // Depth 2
  4: '#001a66', // Depth 3
  5: '#000033', // Depth 4
  6: '#000000'  // Depth 5 (Abyss)
};

export const MAPS = [
  { id: 0, name: "Shore", requiredBoatLvl: 1, maxDepth: 6, hasDock: true, length: SHORE_LEVEL_LENGTH },
  { id: 1, name: "Map 1", requiredBoatLvl: 1, maxDepth: 6, hasDock: false, length: LEVEL_1_LENGTH },
  { id: 2, name: "Map 2", requiredBoatLvl: 2, maxDepth: 6, hasDock: false, length: LEVEL_2_LENGTH },
  { id: 3, name: "Map 3", requiredBoatLvl: 3, maxDepth: 6, hasDock: false, length: LEVEL_3_LENGTH }
];