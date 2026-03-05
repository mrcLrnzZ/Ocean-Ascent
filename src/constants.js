export const W = window.innerWidth;
export const H = window.innerHeight;

export const GROUND_Y = 550;
export const WATER_Y = 650;


export const SHORE_END = 795;
export const PIER_END_X = 1275;

export const P = {

  // Sky Gradient Colors
  skyTop: '#5bc8f5',
  skyBot: '#8ad8f8',

  // lugar Colors
  sandTop: '#f0d080',
  sandMid: '#d8b060',

  grassTop: '#7ec850',
  grassMid: '#5a9a30',
  grassDark: '#3a6a1a',

  dirtTop: '#8a6040',
  dirtMid: '#6a4828',

  // tubig Colors
  waterTop: '#4090c8',
  waterDeep: '#0051ff',
  waterFoam: '#39bdff'

};

// MAP SYSTEM CONFIG
export const MAP_TRANSITION_X_RIGHT = 3000;
export const MAP_TRANSITION_X_LEFT = 740;

export const DEPTH_COLORS = {
  1: '#4090c8', // Top Level 1
  2: '#0051ff', // Deep Shore
  3: '#0033aa', // Mid Deep
  4: '#001a66', // Very Deep
  5: '#000033'  // Abyss
};

export const MAPS = [
  { id: 0, name: "Shore", requiredBoatLvl: 1, maxDepth: 2, hasDock: true },
  { id: 1, name: "Map 1", requiredBoatLvl: 1, maxDepth: 3, hasDock: false },
  { id: 2, name: "Map 2", requiredBoatLvl: 2, maxDepth: 4, hasDock: false },
  { id: 3, name: "Map 3", requiredBoatLvl: 3, maxDepth: 5, hasDock: false }
];