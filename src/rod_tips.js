
export const ROD_TIPS = {
    // IDLE     -- 4  frames (90x90  each)
    idle: [
        { x:   7, y: 23 }, // frame 0
        { x:   7, y: 23 }, // frame 1
        { x:   6, y: 22 }, // frame 2
        { x:   6, y: 22 }, // frame 3
    ],
    // WALK     -- 6  frames (90x90  each)
    walk: [
        { x:   7, y: 23 }, // frame 0
        { x:   7, y: 21 }, // frame 1
        { x:  16, y: 25 }, // frame 2
        { x:   6, y: 24 }, // frame 3
        { x:   7, y: 21 }, // frame 4
        { x:  16, y: 27 }, // frame 5
    ],
    // THROW    -- 10 frames (127x94 each)
    throw: [
        { x:  21, y: 30 }, // frame 0
        { x:  10, y: 38 }, // frame 1
        { x:  71, y: 22 }, // frame 2
        { x:  23, y: 32 }, // frame 3
        { x:  24, y: 19 }, // frame 4
        { x:  29, y:  5 }, // frame 5
        { x: 100, y: 19 }, // frame 6
        { x: 121, y: 29 }, // frame 7
        { x: 118, y: 27 }, // frame 8
        { x: 118, y: 27 }, // frame 9
    ],
    // FISHIDLE -- 4  frames (127x94 each)
    fishidle: [
        { x: 118, y: 27 }, // frame 0
        { x: 118, y: 28 }, // frame 1
        { x: 118, y: 28 }, // frame 2
        { x: 118, y: 28 }, // frame 3
    ]
};
