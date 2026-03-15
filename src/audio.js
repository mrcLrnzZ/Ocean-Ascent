export class AudioManager {
    constructor() {

        this.sounds = {
            cast: new Audio("./assets/audio/cast.mp3"),
            splash: new Audio("./assets/audio/water-splash.mp3"),
            reel: new Audio("./assets/audio/reel.mp3"),
            success: new Audio("./assets/audio/success-catch.mp3"),
            failed: new Audio("./assets/audio/failed-catch.mp3"),
            hooked: new Audio("./assets/audio/hooked.mp3"),
            onBoat: new Audio("./assets/audio/onBoat.mp3"),
            ocean: new Audio("./assets/audio/ocean-ambience.mp3"),
            underwater: new Audio("./assets/audio/underwater.mp3"),

            click: new Audio("./assets/audio/click.mp3"),
            openTrade: new Audio("./assets/audio/open-trade.mp3"),
            buy: new Audio("./assets/audio/buy.mp3"),
            nextPage: new Audio("./assets/audio/nextpage.mp3"),
            heavyrain: new Audio("./assets/audio/heavyrain.wav"),
            thunder: new Audio("./assets/audio/thunder.wav")
        };
        this.sounds.reel.loop = true;
        this.sounds.onBoat.loop = true;
        this.sounds.ocean.loop = true;
        this.sounds.underwater.loop = true;
        this.sounds.heavyrain.loop = true;
        this.sounds.thunder.loop = true;

        // optional volume control
        this.sounds.cast.volume = 0.55; 
        this.sounds.splash.volume = 0.65;
        this.sounds.reel.volume = 0.40;

        this.sounds.success.volume = 0.7;
        this.sounds.failed.volume = 0.6;
        this.sounds.hooked.volume = 1;

        this.sounds.onBoat.volume = 0.4;
        this.sounds.ocean.volume = 0.5;
        this.sounds.underwater.volume = 0.12;

        this.sounds.click.volume = 0.35;
        this.sounds.openTrade.volume = 0.45;
        this.sounds.buy.volume = 0.45;
        this.sounds.nextPage.volume = 0.55;
        
        this.sounds.heavyrain.volume = 0.6;
        this.sounds.thunder.volume = 0.5;
        
        // Track current weather sounds
        this.currentWeatherSound = null;
    }

    play(name) {
        const sound = this.sounds[name];

        if (!sound) return;
        
        if (sound.loop) {
            if (!sound.paused) return;
        }
        
        sound.currentTime = 0;
        const playPromise = sound.play();
        
        // Handle potential autoplay restrictions
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log(`Audio autoplay blocked for ${name}. User interaction may be required.`);
            });
        }
    }
    
    stop(name) {
        const sound = this.sounds[name];
        if (!sound) return;

        sound.pause();
        sound.currentTime = 0;
    }

}