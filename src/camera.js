// src/camera.js



export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    update(player, boat, debugCam, keys, W, H) {
        if (debugCam.enabled) {
            if (keys['w'] || keys['ArrowUp']) debugCam.y -= debugCam.speed;
            if (keys['s'] || keys['ArrowDown']) debugCam.y += debugCam.speed;
            if (keys['a'] || keys['ArrowLeft']) debugCam.x -= debugCam.speed;
            if (keys['d'] || keys['ArrowRight']) debugCam.x += debugCam.speed;
            this.x = debugCam.x;
            this.y = debugCam.y;
        } else {
            if (player.rod.isCasting) {
                this.x = Math.max(0, player.rod.x - W / 2);
            } else if (player.state === 'onBoat') {
                this.x = boat.x - W / 2 + (boat.width * boat.scale) / 2;
            } else {
                this.x = Math.max(0, player.x - W / 2);
            }

            if (player.rod.isCasting) {
                const targetCamY = player.rod.y - H / 2;
                this.y += (targetCamY - this.y) * 0.1;
            } else {
                this.y += (0 - this.y) * 0.1;
            }
        }
    }
}

export const camera = new Camera();
