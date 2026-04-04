
export class RadioManager {
    constructor() {
        this.playlist = [
            { name: "Bawat Pyesa - ToneeJay", src: "assets/music/bawatpyesa.mp3" },
            { name: "Bulong", src: "assets/music/Bulong.mp3" },
            { name: "Sana - I Belong to the Zoo", src: "assets/music/I Belong to the Zoo - Sana.mp3" },
            { name: "Multo - Cup of Joe", src: "assets/music/Multo - Cup of Joe.mp3" },
            { name: "Sino", src: "assets/music/Sino.mp3" },
            { name: "Kalapastangan - fitterkarma", src: "assets/music/fitterkarma - Kalapastangan.mp3" },
            { name: "Pag-Ibig ay Kanibalismo II - fitterkarma", src: "assets/music/fitterkarma - Pag-Ibig ay Kanibalismo II.mp3" },
        ];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.audio = new Audio();
        this.audio.loop = true;

        this.switchAudio = new Audio('assets/music/switchingchanneleffect.wav');
        this.switchAudio.volume = 1.0; // Higher volume this time

        this.displayEl = null;
        this.playPauseBtn = null;
        this.container = null;
        this.globalVolume = 1.0;
    }

    setGlobalVolume(vol) {
        this.globalVolume = vol;
        this.audio.volume = vol;
        this.switchAudio.volume = vol;
    }

    init() {
        this.displayEl = document.getElementById('song-name');
        this.playPauseBtn = document.getElementById('radio-play-pause');
        this.container = document.getElementById('radio-container');
        if (this.playPauseBtn) {
            this.playPauseBtn.addEventListener('click', () => this.toggle())
        }
        const nextBtn = document.getElementById('radio-next');
        const prevBtn = document.getElementById('radio-prev');

        if (nextBtn) nextBtn.addEventListener('click', () => this.next());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prev());

        // Update display initially
        this.updateDisplay();
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (!this.audio.src || this.audio.src.indexOf(this.playlist[this.currentIndex].src) === -1) {
            this.audio.src = this.playlist[this.currentIndex].src;
        }

        this.audio.play();
        this.isPlaying = true;
        if (this.playPauseBtn) this.playPauseBtn.textContent = '⏸';
        this.updateDisplay();
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        if (this.playPauseBtn) this.playPauseBtn.textContent = '▶';
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        this.updateSong();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.updateSong();
    }

    updateSong() {
        // Track each switch with a unique ID to prevent race conditions
        this._currentSwitchId = (this._currentSwitchId || 0) + 1;
        const mySwitchId = this._currentSwitchId;
        const wasPlaying = this.isPlaying;

        // Stop current song and previous switching sound immediately
        this.audio.pause();
        this.switchAudio.pause();
        this.switchAudio.currentTime = 0;

        // Reset display while switching for feedback
        if (this.displayEl) {
            this.displayEl.textContent = "Switching...        ";
        }

        // 1. Play the "staticky" switching sound
        this.switchAudio.play();

        // Function to actually switch the source and play
        const performSwitch = () => {
            // If a newer switch request came in, abort this one!
            if (mySwitchId !== this._currentSwitchId) return;

            this.audio.src = this.playlist[this.currentIndex].src;
            if (wasPlaying) {
                this.audio.play();
            }
            this.updateDisplay();
        };

        // 2. Set listeners for the transition
        this.switchAudio.onended = performSwitch;

        // 3. Fallback timer in case onended doesn't fire (adjusted for 8s effect)
        setTimeout(performSwitch, 8500);
    }

    updateDisplay() {
        if (this.displayEl) {
            const song = this.playlist[this.currentIndex];
            this.displayEl.textContent = `Now Playing: ${song.name}        `; // Add spaces for better loop visibility
        }
    }
}
