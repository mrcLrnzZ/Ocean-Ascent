// src/camera.js



export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    update(player, boat, debugCam, keys, W, H, zoom = 1.0) {
        // Adjust screen dimensions based on zoom
        const targetW = W / zoom;
        const targetH = H / zoom;

        if (debugCam.enabled) {
            if (keys['w'] || keys['ArrowUp']) debugCam.y -= debugCam.speed;
            if (keys['s'] || keys['ArrowDown']) debugCam.y += debugCam.speed;
            if (keys['a'] || keys['ArrowLeft']) debugCam.x -= debugCam.speed;
            if (keys['d'] || keys['ArrowRight']) debugCam.x += debugCam.speed;
            this.x = debugCam.x;
            this.y = debugCam.y;
        } else {
            if (player.rod.isCasting) {
                this.x = Math.max(0, player.rod.x - targetW / 2);
            } else if (player.state === 'onBoat') {
                this.x = boat.x - targetW / 2 + (boat.width * boat.scale) / 2;
            } else {
                this.x = Math.max(0, player.x - targetW / 2);
            }

            if (player.rod.isCasting) {
                const targetCamY = player.rod.y - targetH / 2;
                this.y += (targetCamY - this.y) * 0.1;
            } else {
                // Return to baseline height (default was 0, now -100 as per user change)
                this.y += (-100 - this.y) * 0.1;
            }
        }
    }
}

export const camera = new Camera();
