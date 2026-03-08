import { P, W, H, GROUND_Y, SHORE_END, WATER_Y, DEPTH_COLORS, DEPTH_LEVEL_HEIGHT, DEPTH_LINE_COLOR, MAPS } from './constants.js';
import { waveSurf } from './environment.js';

const bgImageCache = {};

function getCachedImage(src) {
    if (!bgImageCache[src]) {
        const img = new Image();
        img.src = src;
        bgImageCache[src] = img;
    }
    return bgImageCache[src];
}

const shoreImg = new Image();
shoreImg.src = 'assets/newmap.png';



const soilOverlapImg = new Image();
soilOverlapImg.src = 'assets/soiloverlay.png';

const dockImg = new Image();
dockImg.src = 'assets/dock.png';

const shore = {
    x: 0,
    y: 900,
    scale: 5,
    animSpeed: 10
};

export const parallax = {
    y: 750,
    scale: 4
};

export const soilOverlap = {
    x: 0,
    y: 900,
    scale: 5
};

export const dock = {
    x: 540,
    y: 545,
    scale: 5
};


export function drawDock(ctx, cx, currentMap) {
    if (!MAPS[currentMap].hasDock) return;

    const gx = -cx;

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

    ctx.imageSmoothingEnabled = false;
    const drawX = soilOverlap.x + gx;
    const drawY = soilOverlap.y - 150 * soilOverlap.scale;
    const drawW = 250 * soilOverlap.scale;
    const drawH = 150 * soilOverlap.scale;

    if (soilOverlapImg.complete && soilOverlapImg.naturalWidth !== 0) {
        ctx.drawImage(soilOverlapImg, drawX, drawY, drawW, drawH);
    }
}

function rect(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
}

export function drawSky(ctx) {
    ctx.fillStyle = P.skyTop;
    ctx.fillRect(0, -2000, W, 2000);

    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, P.skyTop);
    g.addColorStop(1, P.skyBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, GROUND_Y);
}

export function drawBackground(ctx, cx = 0, currentMap = 0) {
    ctx.imageSmoothingEnabled = false;

    const drawY = parallax.y - 150 * parallax.scale;
    const drawW = 600 * parallax.scale;
    const drawH = 150 * parallax.scale;

    //parallax layer Helperr
    function drawLayer(img, speed) {
        if (!img.complete || img.naturalWidth === 0) return;

        // Calculate offset based on camera x and speed
        let offset = (cx * speed) % drawW;
        let startX = -offset;

        while (startX < W) {
            ctx.drawImage(img, startX, drawY, drawW, drawH);
            startX += drawW;
        }
    }

    // Get dynamic backgrounds for the current map
    const bgs = MAPS[currentMap].backgrounds || [];
    const speeds = [0.1, 0.3, 0.6]; // Slow, Medium, Fast

    // Draw from farthest (slowest) to nearest (fastest)
    bgs.forEach((src, index) => {
        const img = getCachedImage(src);
        const speed = speeds[index] || speeds[speeds.length - 1];
        drawLayer(img, speed);
    });
}


export function drawGround(ctx, cx = 0, currentMap = 0, frame = 0) {
    if (!MAPS[currentMap].hasDock) return;

    const gx = -cx;

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
        ctx.fillStyle = P.dirtMid;
        ctx.fillRect(gx, GROUND_Y, SHORE_END, H - GROUND_Y);
    }
}

export function drawWaterBackground(ctx, cx, currentMap = 0) {
    const startX = MAPS[currentMap].hasDock ? SHORE_END + 110 : 0;
    const endX = cx + W;

    if (startX < endX) {
        const screenStartX = Math.max(0, startX - cx);

        const minDepth = MAPS[currentMap].minDepth || 1;
        const maxDepth = MAPS[currentMap].maxDepth || minDepth;
        const totalLayers = maxDepth - minDepth + 1;
        const layerHeight = DEPTH_LEVEL_HEIGHT;
        const maxWaterH = totalLayers * layerHeight;

        // Draw a solid background so the transparent surface level doesn't show essentially empty canvas
        ctx.fillStyle = '#0a65c7';
        ctx.fillRect(Math.floor(screenStartX), WATER_Y, W - screenStartX, maxWaterH + 10000);
    }
}

export function drawWaterForeground(ctx, cx, frame, currentMap = 0) {
    const startX = MAPS[currentMap].hasDock ? SHORE_END + 110 : 0;
    const endX = cx + W;

    if (startX < endX) {
        const screenStartX = Math.max(0, startX - cx);

        const minDepth = MAPS[currentMap].minDepth || 1;
        const maxDepth = MAPS[currentMap].maxDepth || minDepth;
        const totalLayers = maxDepth - minDepth + 1;
        const layerHeight = DEPTH_LEVEL_HEIGHT;
        const maxWaterH = totalLayers * layerHeight;

        const g = ctx.createLinearGradient(0, WATER_Y, 0, WATER_Y + maxWaterH);

        for (let i = 0; i < totalLayers; i++) {
            const color = DEPTH_COLORS[minDepth + i] || P.waterTop;

            // Solid color for the main part of the layer, then gradients into the next
            const solidStop = (i * layerHeight + 300) / maxWaterH;
            const blendStart = ((i + 1) * layerHeight - 300) / maxWaterH;

            g.addColorStop(Math.min(1, solidStop), color);
            // Blend nicely into the next layer by keeping the base color solid until the last ~300px
            if (i < totalLayers - 1) {
                g.addColorStop(Math.min(1, blendStart), color);
            }
        }
        g.addColorStop(1, DEPTH_COLORS[maxDepth]);

        ctx.fillStyle = g;
        // Extend to support endless abyss depth scrolling with the Free Cam
        ctx.fillRect(Math.floor(screenStartX), WATER_Y, W - screenStartX, maxWaterH + 10000);

        // Draw dotted lines at the end of every depth level
        ctx.save();
        ctx.strokeStyle = DEPTH_LINE_COLOR;
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = cx;
        ctx.beginPath();
        for (let i = 1; i <= 5; i++) {
            const lineY = WATER_Y + (i * layerHeight);
            ctx.moveTo(Math.floor(screenStartX), lineY);
            ctx.lineTo(W, lineY);
        }
        ctx.stroke();
        ctx.restore();

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