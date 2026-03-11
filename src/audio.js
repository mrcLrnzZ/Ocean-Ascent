export class AudioManager {
    constructor() {

        this.sounds = {
            cast: new Audio("./assets/audio/cast.mp3"),
            splash: new Audio("./assets/audio/water-splash.mp3"),
            reel: new Audio("./assets/audio/reel.mp3"),
            success: new Audio("./assets/audio/success-catch.mp3"),
            failed: new Audio("./assets/audio/failed-catch.mp3")
        };
        this.sounds.reel.loop = true;

        // optional volume control
        this.sounds.cast.volume = 0.9; 
        this.sounds.splash.volume = 0.9;
        this.sounds.reel.volume = 0.9;
    }

    play(name) {
        const sound = this.sounds[name];

        if (!sound) return;
        
        if (!sound.paused) return;

        sound.currentTime = 0; // restart sound if spammed
        sound.play();
    }
}