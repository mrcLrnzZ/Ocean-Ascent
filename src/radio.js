
export class RadioManager {
    constructor() {
        this.playlist = [
            { name: "Coastal Breeze", src: "assets/audio/ocean-ambience.mp3" },
            { name: "Sailing High", src: "assets/audio/onBoat.mp3" },
            { name: "Deep Blue", src: "assets/audio/underwater.mp3" },
            { name: "Bawat Pyesa ToneeJay", src: "assets/music/bawatpyesa.mp3" },
        ];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.audio = new Audio();
        this.audio.loop = true;
        
        // Element IDs
        this.displayEl = document.getElementById('song-name');
        this.playPauseBtn = document.getElementById('radio-play-pause');
        this.container = document.getElementById('radio-container');
        
        this.init();
    }

    init() {
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
        const wasPlaying = this.isPlaying;
        this.audio.src = this.playlist[this.currentIndex].src;
        if (wasPlaying) {
            this.audio.play();
        }
        this.updateDisplay();
    }

    updateDisplay() {
        if (this.displayEl) {
            const song = this.playlist[this.currentIndex];
            this.displayEl.textContent = `Now Playing: ${song.name}        `; // Add spaces for better loop visibility
        }
    }
}
