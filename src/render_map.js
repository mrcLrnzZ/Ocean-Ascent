import { P, W, H, GROUND_Y, SHORE_END, WATER_Y } from './constants.js';
import { waveSurf } from './environment.js';

const sandImg = new Image();
sandImg.src = 'assets/sandtile.png';

const soilImg = new Image();
soilImg.src = 'assets/soiltile.png';

const dockImg = new Image();
dockImg.src = 'assets/wooddock.png';

 const dock = {
        x: 885,
        y: 760, // dock height is 68px, so it “stands” on sand
        scale: 7
    }

export function drawObjects(ctx, cx) {
    ctx.imageSmoothingEnabled = false;
    const drawX = dock.x - cx;
    const drawY = dock.y - dockImg.height * dock.scale; // align bottom with ground
    const drawW = dockImg.width * dock.scale;
    const drawH = dockImg.height * dock.scale;

    ctx.drawImage(dockImg, drawX, drawY, drawW, drawH);
}

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

export function drawGround(ctx, cx = 0) {
    const gx = -cx; 
    const tileW = 302; 
    const tileH = 68; 

    // 1. Draw SAND (The top surface layer)
    if (sandImg.complete && sandImg.naturalWidth !== 0) {
        for (let tx = 0; tx < SHORE_END; tx += tileW) {
            ctx.drawImage(
                sandImg, 
                Math.floor(gx + tx), 
                GROUND_Y, 
                tileW, 
                tileH
            );
        }
    }

    // 2. Draw SOIL (Stretched vertically to the bottom)
    if (soilImg.complete && soilImg.naturalWidth !== 0) {
        // Horizontal loop still needed to cover the width of the shore
        for (let tx = 0; tx < SHORE_END; tx += tileW) {
            ctx.drawImage(
                soilImg, 
                Math.floor(gx + tx), // X position
                GROUND_Y + tileH,     // Y starts under the sand
                tileW,                // Keep original width
                H - (GROUND_Y + tileH) // STRETCH: Current screen height minus the top offset
            );
        }
    } else {
        // Fallback solid color if images fail to load
        ctx.fillStyle = P.dirtMid;
        ctx.fillRect(gx, GROUND_Y + tileH, SHORE_END, H - GROUND_Y);
    }
}

export function drawWater(ctx, cx, frame) {
    const startX = SHORE_END + 160; // water starts after shore
    const endX = cx + W;  

    if (startX < W) {
        const g = ctx.createLinearGradient(0, WATER_Y, 0, H);
        g.addColorStop(0, P.waterTop);
        g.addColorStop(1, P.waterDeep);
        
        ctx.fillStyle = g;
        ctx.fillRect(Math.floor(startX), WATER_Y, W - startX, H - WATER_Y);

        ctx.fillStyle = P.waterFoam;
        for (let x = startX; x < W + endX; x += 10) {
            
            const screenX = x - cx;

            const y = waveSurf(x, frame);

            rect(ctx, screenX, y, 10, 40, P.waterFoam);
        }
    }
}