import { P, W, H, GROUND_Y, SHORE_END, WATER_Y, DEPTH_COLORS, MAPS } from './constants.js';
import { waveSurf } from './environment.js';

const shoreImg = new Image();
shoreImg.src = 'assets/newmap.png';
const shore = {
    x: 0,
    y: 900,  
    scale: 5,
    animSpeed: 10 
};

const backgroundImg = new Image();
backgroundImg.src = 'assets/background.png';
export const background = {
    x: 0,
    y: 1350,
    scale: 9
};

const soilOverlapImg = new Image();
soilOverlapImg.src = 'assets/soiloverlay.png'; 

export const soilOverlap = {
    x: 0,
    y: 900,
    scale: 5 
};

const dockImg = new Image();
dockImg.src = 'assets/dock.png';

export const dock = {
    x: 540,
    y: 545,
    scale: 5
};


export function drawDock(ctx, cx, currentMap) {
    if (!MAPS[currentMap].hasDock) return;

    const gx = -cx;

    // Draw the new compact dock image
    ctx.imageSmoothingEnabled = false;
    const drawX = dock.x + gx;
    const drawY = dock.y - 31 * dock.scale; 
    const drawW = 131 * dock.scale;             
    const drawH = 31 * dock.scale;

    if (dockImg.complete && dockImg.naturalWidth !== 0) {
        ctx.drawImage(dockImg, drawX, drawY, drawW, drawH);
    }
}


export function drawSoilOverlap(ctx, cx, currentMap) {
    if (!MAPS[currentMap].hasDock) return;

    const gx = -cx;

    // Draw the new compact soil overlap image
    ctx.imageSmoothingEnabled = false;
    const drawX = soilOverlap.x + gx;
    const drawY = soilOverlap.y - 150 * soilOverlap.scale;
    const drawW = 250 * soilOverlap.scale;                
    const drawH = 150 * soilOverlap.scale;

    if (soilOverlapImg.complete && soilOverlapImg.naturalWidth !== 0) {
        ctx.drawImage(soilOverlapImg, drawX, drawY, drawW, drawH);
    }
}

// drawObjects removed since woodDock is gone

function rect(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
}

export function drawSky(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, P.skyTop);
    g.addColorStop(1, P.skyBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
}

export function drawBackground(ctx, cx = 0, currentMap = 0) {
    if (!MAPS[currentMap].hasDock) return;

    // Remove camera offset (gx) for a fixed static background!

    // Draw the world background
    ctx.imageSmoothingEnabled = false;
    const drawX = background.x; 
    const drawY = background.y - 150 * background.scale; 
    const drawW = 250 * background.scale;         
    const drawH = 150 * background.scale;

    if (backgroundImg.complete && backgroundImg.naturalWidth !== 0) {
        ctx.drawImage(backgroundImg, drawX, drawY, drawW, drawH);
    }
}

export function drawGround(ctx, cx = 0, currentMap = 0, frame = 0) {
    if (!MAPS[currentMap].hasDock) return;

    const gx = -cx;

    // Draw the animated shore sprite
    ctx.imageSmoothingEnabled = false;
    const drawX = shore.x + gx;
    const drawY = shore.y - 150 * shore.scale; 
    const drawW = 250 * shore.scale;         
    const drawH = 150 * shore.scale;

    if (shoreImg.complete && shoreImg.naturalWidth !== 0) {
        const frameIndex = Math.floor(frame / shore.animSpeed) % 4; 
        const frameWidth = 1000 / 4; 
        const frameHeight = 150;

        ctx.drawImage(
            shoreImg,
            frameIndex * frameWidth, 0, frameWidth, frameHeight,
            drawX, drawY, drawW, drawH 
        );
    } else {
        // Fallback solid color
        ctx.fillStyle = P.dirtMid;
        ctx.fillRect(gx, GROUND_Y, SHORE_END, H - GROUND_Y);
    }
}

export function drawWater(ctx, cx, frame, currentMap = 0) {
    const startX = MAPS[currentMap].hasDock ? SHORE_END + 110 : 0;
    const endX = cx + W;

    if (startX < endX) {
        const screenStartX = Math.max(0, startX - cx);
        const g = ctx.createLinearGradient(0, WATER_Y, 0, H);

        const topColor = DEPTH_COLORS[MAPS[currentMap].minDepth] || P.waterTop;
        const bottomColor = DEPTH_COLORS[MAPS[currentMap].maxDepth] || P.waterDeep;

        g.addColorStop(0, topColor);
        g.addColorStop(1, bottomColor);

        ctx.fillStyle = g;
        ctx.fillRect(Math.floor(screenStartX), WATER_Y, W - screenStartX, H - WATER_Y);

        ctx.fillStyle = P.waterFoam;
        for (let x = Math.max(startX, cx); x < endX; x += 10) {
            const screenX = x - cx;
            const y = waveSurf(x, frame);
            rect(ctx, screenX, y, 10, 40, P.waterFoam);
        }
    }
}

export function drawTransition(ctx, progress, direction, sweepDir = 1) {
    if (progress <= 0) return;

    ctx.save();

    ctx.fillStyle = "white";

    // We want the clouds to continuously sweep perfectly smoothly.
    // progress goes 0 -> 1 during fade-in (direction === 1)
    // progress goes 1 -> 0 during fade-out (direction === -1)
    // We'll calculate a single variable `t` from 0 to 1 representing the full movement.
    let t = direction === 1 ? (progress / 2) : (1 - (progress / 2));

    // The width of the cloud block should be enough to cover the screen entirely, 
    // plus a little extra for the puffy edges so they look continuous
    const cloudWidth = W * 1.5;

    let startX, endX;
    if (sweepDir === 1) {
        // Sweep right to left (forward)
        startX = W + 150;
        endX = -cloudWidth - 150;
    } else {
        // Sweep left to right (backward)
        startX = -cloudWidth - 150;
        endX = W + 150;
    }

    const currentX = startX + (endX - startX) * t;

    // Draw the solid block for the main cloud body
    ctx.fillRect(currentX, 0, cloudWidth, H);

    // Draw puffy edges on left and right sides of the main body
    for (let i = 0; i < 20; i++) {
        // Distribute clouds vertically
        const y = (H / 18) * i;
        const radius = 90 + Math.sin(i * 3) * 45;

        // Left puffy edge
        ctx.beginPath();
        ctx.arc(currentX, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Right puffy edge
        ctx.beginPath();
        ctx.arc(currentX + cloudWidth, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}