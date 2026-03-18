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

const endingDockImg = new Image();
endingDockImg.src = 'assets/endingdock.png';

const endingDockOverlayImg = new Image();
endingDockOverlayImg.src = 'assets/endingdockoverlay.png';

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

export const endingDock = {
    x: 2900, // Positioned to fit the end of the 4000px map
    y: 2860,
    w: 655, // Base width
    h: 1255, // Base height
    scale: 2 // Additional scaling multiplier
};

export const endingDockOverlay = {
    x: 2900,
    y: 495,
    w: 655,
    h: 70,
    scale: 2
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
    const isEnding = currentMap === MAPS.length - 1;
    const currentDock = isEnding ? endingDock : dock;
    const drawX = currentDock.x + gx;
    const drawY = isEnding ? currentDock.y - (currentDock.h * currentDock.scale) : currentDock.y - 31 * currentDock.scale;
    const drawW = isEnding ? currentDock.w * currentDock.scale : 131 * currentDock.scale;
    const drawH = isEnding ? currentDock.h * currentDock.scale : 31 * currentDock.scale;

    if (isEnding) { // Last Map (Ending)
        if (endingDockImg.complete && endingDockImg.naturalWidth !== 0) {
            ctx.drawImage(endingDockImg, drawX, drawY, drawW, drawH);
        }
    } else {
        if (dockImg.complete && dockImg.naturalWidth !== 0) {
            ctx.drawImage(dockImg, drawX, drawY, drawW, drawH);
        }
    }
}

export function drawDockOverlay(ctx, cx, currentMap) {
    if (currentMap !== MAPS.length - 1) return;

    const gx = -cx;
    ctx.imageSmoothingEnabled = false;
    
    const drawX = endingDockOverlay.x + gx;
    const drawY = endingDockOverlay.y - (endingDockOverlay.h * endingDockOverlay.scale);
    const drawW = endingDockOverlay.w * endingDockOverlay.scale;
    const drawH = endingDockOverlay.h * endingDockOverlay.scale;

    if (endingDockOverlayImg.complete && endingDockOverlayImg.naturalWidth !== 0) {
        ctx.drawImage(endingDockOverlayImg, drawX, drawY, drawW, drawH);
    }
}

export function drawDeepSoil(ctx, cx, currentMap) {
    if (!MAPS[currentMap].hasDock || currentMap === MAPS.length - 1) return; // Hide for ending

    const gx = -cx;
    const mapWidth = MAPS[currentMap].length;
    const isEnding = currentMap === MAPS.length - 1;

    ctx.imageSmoothingEnabled = false;
    // Position at the end of the map if it's the ending map
    const baseDrawX = isEnding ? mapWidth - 2000 : deepsoil.x;
    const drawX = baseDrawX + gx;
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

export function drawSky(ctx, frame = 0, currentMap = 0) {
    const theme = getMapTheme(currentMap);
    const weather = WeatherSystem.getCurrentWeather(); // already fully blended

    // The sky color is a blend between the map theme and the weather state.
    // We use the transition progress to slide 0→1 from theme→weather sky.
    const t = Math.min(1, WeatherSystem._progress / Math.max(1, WeatherSystem.transitionDuration));
    const isNonClear = WeatherSystem.targetWeather !== 'clear';
    // At full non-clear weather we want 70% weather influence; at clear, 0%.
    const skyBlend = isNonClear ? (t * 0.7) : ((1 - t) * 0.7);

    function blendHex(mapColor, weatherColor, blend) {
        const a = WeatherSystem.hexToRgb(mapColor);
        const b = WeatherSystem.hexToRgb(weatherColor);
        return WeatherSystem.rgbToHex(
            Math.round(a.r + (b.r - a.r) * blend),
            Math.round(a.g + (b.g - a.g) * blend),
            Math.round(a.b + (b.b - a.b) * blend)
        );
    }

    const skyTop = blendHex(theme.skyTop, weather.skyTop, skyBlend);
    const skyBot = blendHex(theme.skyBot, weather.skyBot, skyBlend);

    ctx.fillStyle = skyTop;
    ctx.fillRect(0, -2000, W, 2000);

    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, skyTop);
    g.addColorStop(1, skyBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, GROUND_Y);

    //WeatherSystem.drawClouds(ctx, frame);
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
    if (!MAPS[currentMap].hasDock || currentMap === MAPS.length - 1) return; // Hide for ending

    const gx = -cx;
    const mapWidth = MAPS[currentMap].length;
    const isEnding = currentMap === MAPS.length - 1;

    ctx.imageSmoothingEnabled = false;
    // Position shore at the right side if it's the ending map
    const baseDrawX = isEnding ? mapWidth - 2000 : shore.x;
    const drawX = baseDrawX + gx;
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
        ctx.fillRect(drawX, GROUND_Y, SHORE_END, H - GROUND_Y);
    }
}

export function drawWaterBackground(ctx, cx, currentMap = 0) {
    const isEnding = currentMap === MAPS.length - 1;
    const mapWidth = MAPS[currentMap].length;
    
    // Normal maps have dock at start (SHORE_END), Ending map has dock at the end.
    let shoreAreaEnd = MAPS[currentMap].hasDock ? SHORE_END + 110 : 0;
    let waterStartX = shoreAreaEnd;
    let waterWidth = W;

    if (isEnding) {
        // For ending map, water is on the left, shore is on the right.
        waterStartX = 0;
        waterWidth = Math.max(0, (mapWidth - 1500) - cx); // 1500 is approx shore width
    } else {
        waterStartX = Math.max(0, waterStartX - cx);
    }

    const minDepth = MAPS[currentMap].minDepth || 1;
    const maxDepth = MAPS[currentMap].maxDepth || minDepth;
    const waterStartY = getDepthStartLine(minDepth);
    const waterEndY = getDepthEndLine(maxDepth);
    const maxWaterH = waterEndY - waterStartY;

    // Use theme water background color
    const theme = getMapTheme(currentMap);
    ctx.fillStyle = theme.waterBg;
    
    if (isEnding) {
        // Draw water across the entire map width
        ctx.fillRect(0, waterStartY, W, maxWaterH + 10000);
    } else {
        ctx.fillRect(Math.floor(waterStartX), waterStartY, W - waterStartX, maxWaterH + 10000);
    }
}

export function drawWaterForeground(ctx, cx, frame, currentMap = 0) {
    const theme = getMapTheme(currentMap);
    const depthColors = theme.depthColors;
    const isEnding = currentMap === MAPS.length - 1;
    const mapWidth = MAPS[currentMap].length;

    const startX = (isEnding) ? 0 : (MAPS[currentMap].hasDock ? SHORE_END + 110 : 0);
    const endX = (isEnding) ? mapWidth : cx + W; 

    if (startX < endX || isEnding) {
        const screenStartX = Math.max(0, startX - cx);
        const screenEndX = isEnding ? W : (isEnding ? Math.min(W, endX - cx) : W);
        const actualScreenEndX = isEnding ? W : W; 

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

            g.addColorStop(Math.max(0, Math.min(1, solidStop)), color);
            if (i < maxDepth) {
                g.addColorStop(Math.max(0, Math.min(1, blendStart)), color);
            }
        }
        g.addColorStop(1, depthColors[maxDepth] || theme.waterTop);

        ctx.fillStyle = g;
        ctx.fillRect(Math.floor(screenStartX), waterStartY, actualScreenEndX - screenStartX, maxWaterH + 10000);

        // Draw dotted lines
        ctx.save();
        ctx.strokeStyle = DEPTH_LINE_COLOR;
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = cx;
        ctx.beginPath();
        for (let i = minDepth; i <= maxDepth; i++) {
            const lineY = getDepthEndLine(i);
            ctx.moveTo(Math.floor(screenStartX), lineY);
            ctx.lineTo(actualScreenEndX, lineY);
        }
        ctx.stroke();
        ctx.restore();

        WeatherSystem.drawWaterSplashes(ctx, cx, frame);

        ctx.fillStyle = theme.waterFoam;
        const foamStart = Math.max(startX, cx);
        const foamEnd = isEnding ? (cx + W) : endX;
        
        for (let x = foamStart; x < foamEnd; x += 10) {
            const screenX = x - cx;
            const y = waveSurf(x, frame);
            rect(ctx, screenX, y, 10, 40, theme.waterFoam);
        }

        WeatherSystem.drawWaterSplashes(ctx, cx, frame);
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