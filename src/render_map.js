import { P, W, H, GROUND_Y, SHORE_END, WATER_Y, DEPTH_COLORS, DEPTH_LEVEL_HEIGHTS, getDepthStartLine, getDepthEndLine, DEPTH_LINE_COLOR, MAPS, PARALLAX_LAYERS, getMapTheme } from './constants.js';
import { waveSurf, WeatherSystem } from './environment.js';

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
shoreImg.src = 'assets/longshore.png';


const deepsoilImg = new Image();
deepsoilImg.src = 'assets/deepsoiloverlay.png'

const dockImg = new Image();
dockImg.src = 'assets/dock.png';

const shore = {
    x: 0,
    y: 1025,
    scale: 5,
    animSpeed: 10
};


export const dock = {
    x: 540,
    y: 545,
    scale: 5
};

export const deepsoil = {
    x: 0,
    y: 2900,
    scale: 5
}

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

export function drawDeepSoil(ctx, cx, currentMap) {
    if (!MAPS[currentMap].hasDock) return;

    const gx = -cx;

    ctx.imageSmoothingEnabled = false;
    const drawX = deepsoil.x + gx;
    const drawY = deepsoil.y - 550 * deepsoil.scale;
    const drawW = 350 * deepsoil.scale;
    const drawH = 550 * deepsoil.scale;

    if (deepsoilImg.complete && deepsoilImg.naturalWidth !== 0) {
        ctx.drawImage(deepsoilImg, drawX, drawY, drawW, drawH);
    }
}


function rect(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
}

export function drawSky(ctx, frame = 0) {
    // Get current weather colors
    const weather = WeatherSystem.getCurrentWeather();

    ctx.fillStyle = weather.skyTop;
    ctx.fillRect(0, -2000, W, 2000);

    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, weather.skyTop);
    g.addColorStop(1, weather.skyBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, GROUND_Y);

    // Draw dynamic clouds
    WeatherSystem.drawClouds(ctx, frame);
}

export function drawBackground(ctx, cx = 0, currentMap = 0) {
    ctx.imageSmoothingEnabled = false;

    const theme = getMapTheme(currentMap);
    const isNight = MAPS[currentMap].theme === 'night';

    //parallax layer Helperr
    function drawLayer(img, config, index) {
        if (!img.complete || img.naturalWidth === 0) return;

        // Fallback to default configs if layer doesn't have an explicit setup
        const currentMapLayers = PARALLAX_LAYERS[currentMap] || PARALLAX_LAYERS[0];
        const layerConfig = currentMapLayers[index] || currentMapLayers[currentMapLayers.length - 1];

        const drawY = layerConfig.y;
        const drawW = layerConfig.width * layerConfig.scale;
        const drawH = layerConfig.height * layerConfig.scale;
        const speed = layerConfig.speed;

        // Calculate offset based on camera x and speed
        let offset = (cx * speed) % drawW;
        let startX = -offset;

        ctx.save();
        if (isNight && index < (MAPS[currentMap].backgrounds.length - 1)) {
            // Darken background layers for night theme
            ctx.filter = 'brightness(0.4) saturate(0.7)'; 
        }

        while (startX < W) {
            ctx.drawImage(img, startX, drawY, drawW, drawH);
            startX += drawW;
        }
        ctx.restore();
    }

    // Get dynamic backgrounds for the current map
    const bgs = MAPS[currentMap].backgrounds || [];

    // Draw from farthest (slowest) to nearest (fastest)
    bgs.forEach((src, index) => {
        const img = getCachedImage(src);
        drawLayer(img, null, index); // The index pulls the respective setup from PARALLAX_LAYERS
    });
}


export function drawGround(ctx, cx = 0, currentMap = 0, frame = 0) {
    if (!MAPS[currentMap].hasDock) return;

    const gx = -cx;

    ctx.imageSmoothingEnabled = false;
    const drawX = shore.x + gx;
    const drawY = shore.y - 175 * shore.scale;
    const drawW = 300 * shore.scale;
    const drawH = 175 * shore.scale;

    if (shoreImg.complete && shoreImg.naturalWidth !== 0) {
        const frameIndex = Math.floor(frame / shore.animSpeed) % 4;
        const frameWidth = 1200 / 4;
        const frameHeight = 175;

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
        const waterStartY = getDepthStartLine(minDepth);
        const waterEndY = getDepthEndLine(maxDepth);
        const maxWaterH = waterEndY - waterStartY;

        // Use theme water background color
        const theme = getMapTheme(currentMap);
        ctx.fillStyle = theme.waterBg;
        ctx.fillRect(Math.floor(screenStartX), waterStartY, W - screenStartX, maxWaterH + 10000);
    }
}

export function drawWaterForeground(ctx, cx, frame, currentMap = 0) {
    const theme = getMapTheme(currentMap);
    const depthColors = theme.depthColors;

    const startX = MAPS[currentMap].hasDock ? SHORE_END + 110 : 0;
    const endX = cx + W;

    if (startX < endX) {
        const screenStartX = Math.max(0, startX - cx);

        const minDepth = MAPS[currentMap].minDepth || 1;
        const maxDepth = MAPS[currentMap].maxDepth || minDepth;
        const waterStartY = getDepthStartLine(minDepth);
        const waterEndY = getDepthEndLine(maxDepth);
        const maxWaterH = waterEndY - waterStartY;

        const g = ctx.createLinearGradient(0, waterStartY, 0, waterEndY);

        for (let i = minDepth; i <= maxDepth; i++) {
            const color = depthColors[i] || theme.waterTop;

            const layerStartY = getDepthStartLine(i);
            const layerEndY = getDepthEndLine(i);

            const solidStopY = layerStartY + 300;
            const blendStartY = layerEndY - 300;

            const solidStop = (solidStopY - waterStartY) / maxWaterH;
            const blendStart = (blendStartY - waterStartY) / maxWaterH;

            // Solid color for the main part of the layer, then gradients into the next
            g.addColorStop(Math.max(0, Math.min(1, solidStop)), color);
            // Blend nicely into the next layer by keeping the base color solid until the last ~300px
            if (i < maxDepth) {
                g.addColorStop(Math.max(0, Math.min(1, blendStart)), color);
            }
        }
        g.addColorStop(1, depthColors[maxDepth] || theme.waterTop);

        ctx.fillStyle = g;
        // Extend to support endless abyss depth scrolling with the Free Cam
        ctx.fillRect(Math.floor(screenStartX), waterStartY, W - screenStartX, maxWaterH + 10000);

        // Draw dotted lines at the end of every depth level
        ctx.save();
        ctx.strokeStyle = DEPTH_LINE_COLOR;
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = cx;
        ctx.beginPath();
        for (let i = minDepth; i <= maxDepth; i++) {
            const lineY = getDepthEndLine(i);
            ctx.moveTo(Math.floor(screenStartX), lineY);
            ctx.lineTo(W, lineY);
        }
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = theme.waterFoam;
        for (let x = Math.max(startX, cx); x < endX; x += 10) {
            const screenX = x - cx;
            const y = waveSurf(x, frame);
            rect(ctx, screenX, y, 10, 40, theme.waterFoam);
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