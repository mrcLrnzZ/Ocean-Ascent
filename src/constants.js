export const W = innerWidth;
export const H = innerHeight;

export const GROUND_Y = 500;
export const WATER_Y = 600;


export const SHORE_END = 305;
export const PIER_END_X = 1100;
export const SHORE_LINE_DEPTH = 100; // max depth for shore fish
export const GRAVITY = 0.5;

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
export const SHORE_LEVEL_LENGTH = 5000;
export const LEVEL_1_LENGTH = 5000;
export const LEVEL_2_LENGTH = 3000;
export const LEVEL_3_LENGTH = 4000;

// MAP SYSTEM CONFIG
export const MAP_TRANSITION_X_LEFT = 740;

export const DEPTH_LEVEL_HEIGHTS = {
  1: 300,  // Surface Level
  2: 1500, // Depth 1
  3: 1500, // Depth 2
  4: 1500, // Depth 3
  5: 1500  // Depth 4 (Abyss)
};

export function getDepthStartLine(level) {
  let startY = WATER_Y;
  for (let i = 1; i < level; i++) {
    startY += (DEPTH_LEVEL_HEIGHTS[i] || 1500);
  }
  return startY;
}

export function getDepthEndLine(level) {
  let endY = getDepthStartLine(level);
  endY += (DEPTH_LEVEL_HEIGHTS[level] || 1500);
  return endY;
}

const DEEP_SOIL_PROFILE = [[0, 580], [50, 580], [100, 585], [150, 590], [200, 590], [250, 590], [300, 600], [350, 600], [400, 605], [450, 620], [500, 655], [550, 685], [600, 710], [650, 745], [700, 780], [750, 800], [800, 815], [850, 825], [900, 835], [950, 850], [1000, 865], [1050, 880], [1100, 900], [1150, 915], [1200, 935], [1250, 950], [1300, 965], [1350, 980], [1400, 990], [1450, 1000], [1500, 1015], [1550, 1050], [1600, 1110], [1650, 1200], [1700, 1760], [1745, 2800]];

export function getDeepSoilY(x) {
  if (x <= 0) return 580;
  if (x >= 1745) return Infinity;
  for (let i = 0; i < DEEP_SOIL_PROFILE.length - 1; i++) {
    const p1 = DEEP_SOIL_PROFILE[i];
    const p2 = DEEP_SOIL_PROFILE[i + 1];
    if (x >= p1[0] && x <= p2[0]) {
      const t = (x - p1[0]) / (p2[0] - p1[0]);
      return p1[1] + t * (p2[1] - p1[1]);
    }
  }
  return 2800;
}

export function getDeepSoilX(y) {
  if (y <= 580) return 0;
  if (y >= 2800) return 1745;
  for (let i = 0; i < DEEP_SOIL_PROFILE.length - 1; i++) {
    const p1 = DEEP_SOIL_PROFILE[i];
    const p2 = DEEP_SOIL_PROFILE[i + 1];
    if (y >= p1[1] && y <= p2[1] && p1[1] !== p2[1]) {
      const t = (y - p1[1]) / (p2[1] - p1[1]);
      return p1[0] + t * (p2[0] - p1[0]);
    }
  }
  return 1745;
}

export const DEPTH_LINE_COLOR = '#ffffff40';

export const DEPTH_COLORS = {
  1: '#0a65c780', // Surface Level
  2: '#0051ff80', // Depth 1
  3: '#0033aa80', // Depth 2
  4: '#001a6680', // Depth 3
  5: '#00003380'  // Depth 4 (Abyss)
};

// Parallax background configuration per layer and map
export const PARALLAX_LAYERS = {
  0: [ // Shore


    { y: 0, width: 1900, height: 1000, scale: 0.5, speed: 0.1 }, // Farthest layer
    { y: 100, width: 1900, height: 1000, scale: 0.5, speed: 0.3 }, // third layer
    { y: 160, width: 1900, height: 1000, scale: 0.5, speed: 0.4 }, // second layer
    { y: 200, width: 1900, height: 1000, scale: 0.5, speed: 0.8 }  // sea layer
  ],
  1: [ // Map 1
    { y: -10, width: 1900, height: 1500, scale: 0.5, speed: 0.1 },
    { y: -30, width: 1900, height: 1600, scale: 0.5, speed: 0.3 },
    { y: 30, width: 1900, height: 1400, scale: 0.5, speed: 0.4 },
    { y: 200, width: 1900, height: 1000, scale: 0.5, speed: 0.8 }
  ],
  2: [ // Map 2
    { y: 0, width: 1900, height: 1000, scale: 0.5, speed: 0.1 },
    { y: 100, width: 1900, height: 1000, scale: 0.5, speed: 0.3 },
    { y: 160, width: 1900, height: 1000, scale: 0.5, speed: 0.4 },
    { y: 200, width: 1900, height: 1000, scale: 0.5, speed: 0.8 }
  ],
  3: [ // Map 3
    { y: 0, width: 1900, height: 1000, scale: 0.5, speed: 0.1 },
    { y: 100, width: 1900, height: 1000, scale: 0.5, speed: 0.3 },
    { y: 160, width: 1900, height: 1000, scale: 0.5, speed: 0.4 },
    { y: 200, width: 1900, height: 1000, scale: 0.5, speed: 0.8 }
  ]
};

export const MAPS = [
  {
    id: 0, name: "Shore", requiredBoatLvl: 1, maxDepth: 5, hasDock: true, length: SHORE_LEVEL_LENGTH,

    backgrounds: ['assets/sky_clouds.png', 'assets/sky_back_mountain.png', 'assets/sky_front_mountain.png', 'assets/parallax_seav2.png']
  },
  {
    id: 1, name: "Map 1", requiredBoatLvl: 1, maxDepth: 5, hasDock: false, length: LEVEL_1_LENGTH,

    backgrounds: ['assets/forest_mountain.png', 'assets/forest_back.png', 'assets/parallax_seav2.png']
  },
  {
    id: 2, name: "Map 2", requiredBoatLvl: 2, maxDepth: 5, hasDock: false, length: LEVEL_2_LENGTH,
    backgrounds: ['assets/parallax_farmountainv2.png', 'assets/parallax_mountainv2.png', 'assets/parallax_seav2.png']
  },
  {
    id: 3, name: "Map 3", requiredBoatLvl: 3, maxDepth: 5, hasDock: false, length: LEVEL_3_LENGTH,
    backgrounds: ['assets/parallax_farmountainv2.png', 'assets/parallax_mountainv2.png', 'assets/parallax_seav2.png']
  }
];