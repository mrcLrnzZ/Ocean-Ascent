export const debugCam = {
    enabled: false,
    x: 0,
    y: 0,
    speed: 15
};

export function toggleDebugCam(cameraX, cameraY) {
    debugCam.enabled = !debugCam.enabled;
    const btn = document.getElementById('debug-btn');
    if (btn) {
        btn.textContent = `Debug Cam: ${debugCam.enabled ? 'ON' : 'OFF'}`;
    }
    if (debugCam.enabled) {
        debugCam.x = cameraX;
        debugCam.y = cameraY;
    }
}