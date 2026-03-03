import { WATER_Y } from './constants.js'; 

export function waveSurf(x, frame) {
    return WATER_Y + Math.sin(frame * 0.04 + x * 0.010) * 5; 
}