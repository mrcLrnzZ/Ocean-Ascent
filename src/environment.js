import { WATER_Y, W, H, GROUND_Y } from './constants.js';

export function waveSurf(x, frame) {
    return WATER_Y + Math.sin(frame * 0.04 + x * 0.010) * 5;
}
export const WeatherSystem = {
    currentWeather: 'clear',
    transitionProgress: 0,
    transitionDuration: 300, // frames to transition between weather states
    targetWeather: 'clear',
    weatherTimer: 0,
    weatherDuration: 1800, // frames before weather changes (30 seconds at 60fps)

    // Weather type definitions
    weatherTypes: {
        clear: {
            skyTop: '#5bc8f5',
            skyBot: '#0a65c7',
            particles: [],
            cloudOpacity: 0.3,
            cloudSpeed: 0.5,
            waterTint: 'rgba(0, 0, 0, 0)'
        },
        cloudy: {
            skyTop: '#8ba8c4',
            skyBot: '#5a7a9a',
            particles: [],
            cloudOpacity: 0.7,
            cloudSpeed: 0.8,
            waterTint: 'rgba(50, 50, 70, 0.2)'
        },
        rainy: {
            skyTop: '#6a7a8a',
            skyBot: '#3a4a5a',
            particles: 'rain',
            cloudOpacity: 0.9,
            cloudSpeed: 1.2,
            waterTint: 'rgba(30, 30, 50, 0.3)'
        },
        stormy: {
            skyTop: '#4a5060',
            skyBot: '#2a3040',
            particles: 'storm',
            cloudOpacity: 1.0,
            cloudSpeed: 2.0,
            waterTint: 'rgba(20, 20, 40, 0.4)'
        },
        foggy: {
            skyTop: '#b0b8c0',
            skyBot: '#8090a0',
            particles: 'fog',
            cloudOpacity: 0.5,
            cloudSpeed: 0.3,
            waterTint: 'rgba(200, 200, 210, 0.3)'
        }
    },

    // Particle systems for weather effects
    rainParticles: [],
    fogParticles: [],
    lightningTimer: 0,
    lightningFlash: 0,

    // Initialize weather system
    init() {
        this.currentWeather = 'clear';
        this.targetWeather = 'clear';
        this.rainParticles = [];
        this.fogParticles = [];

        // Initialize fog particles
        for (let i = 0; i < 50; i++) {
            this.fogParticles.push({
                x: Math.random() * W * 2,
                y: Math.random() * H,
                size: 100 + Math.random() * 200,
                speed: 0.2 + Math.random() * 0.3,
                opacity: 0.1 + Math.random() * 0.2
            });
        }
    },

    // Change weather (can be called manually or automatically)
    setWeather(weatherType) {
        if (this.weatherTypes[weatherType]) {
            this.targetWeather = weatherType;
            this.transitionProgress = 0;
        }
    },

    // Automatically cycle through weather
    cycleWeather() {
        const types = Object.keys(this.weatherTypes);
        const currentIndex = types.indexOf(this.currentWeather);
        const nextIndex = (currentIndex + 1) % types.length;
        this.setWeather(types[nextIndex]);
    },

    // Random weather selection
    randomWeather() {
        const types = Object.keys(this.weatherTypes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        this.setWeather(randomType);
    },

    // Update weather state
    update(frame) {
        this.weatherTimer++;

        // Auto-change weather periodically (optional - can be disabled)
        if (this.weatherTimer >= this.weatherDuration) {
            this.weatherTimer = 0;
            this.randomWeather();
        }

        // Handle weather transition
        if (this.currentWeather !== this.targetWeather) {
            this.transitionProgress++;
            if (this.transitionProgress >= this.transitionDuration) {
                this.currentWeather = this.targetWeather;
                this.transitionProgress = 0;
            }
        }

        // Update rain particles
        if (this.getCurrentWeather().particles === 'rain' || this.getCurrentWeather().particles === 'storm') {
            const intensity = this.getCurrentWeather().particles === 'storm' ? 3 : 1;

            // Add new rain drops
            for (let i = 0; i < 2 * intensity; i++) {
                this.rainParticles.push({
                    x: Math.random() * W,
                    y: -10,
                    speed: 8 + Math.random() * 4,
                    length: 10 + Math.random() * 10,
                    opacity: 0.3 + Math.random() * 0.4
                });
            }

            // Update and remove old rain drops
            this.rainParticles = this.rainParticles.filter(drop => {
                drop.y += drop.speed;
                drop.x += 2; // slight wind effect
                return drop.y < H + 50;
            });

            // Limit particle count
            if (this.rainParticles.length > 300) {
                this.rainParticles = this.rainParticles.slice(-300);
            }
        } else {
            this.rainParticles = [];
        }

        // Update fog particles
        if (this.getCurrentWeather().particles === 'fog') {
            this.fogParticles.forEach(fog => {
                fog.x += fog.speed;
                if (fog.x > W * 2) fog.x = -fog.size;
            });
        }

        // Lightning effect for stormy weather
        if (this.getCurrentWeather().particles === 'storm') {
            this.lightningTimer++;
            if (this.lightningTimer > 120 && Math.random() < 0.02) {
                this.lightningFlash = 15;
                this.lightningTimer = 0;
            }
            if (this.lightningFlash > 0) {
                this.lightningFlash--;
            }
        } else {
            this.lightningFlash = 0;
        }
    },

    // Get current weather with transition blending
    getCurrentWeather() {
        if (this.currentWeather === this.targetWeather) {
            return this.weatherTypes[this.currentWeather];
        }

        // Blend between current and target weather
        const t = this.transitionProgress / this.transitionDuration;
        const current = this.weatherTypes[this.currentWeather];
        const target = this.weatherTypes[this.targetWeather];

        return {
            skyTop: this.lerpColor(current.skyTop, target.skyTop, t),
            skyBot: this.lerpColor(current.skyBot, target.skyBot, t),
            particles: t > 0.5 ? target.particles : current.particles,
            cloudOpacity: current.cloudOpacity + (target.cloudOpacity - current.cloudOpacity) * t,
            cloudSpeed: current.cloudSpeed + (target.cloudSpeed - current.cloudSpeed) * t,
            waterTint: t > 0.5 ? target.waterTint : current.waterTint
        };
    },

    // Linear interpolation for colors
    lerpColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);

        return this.rgbToHex(r, g, b);
    },

    // Helper: hex to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    },

    // Helper: RGB to hex
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    // Draw weather effects
    drawWeatherEffects(ctx, cameraY) {
        const weather = this.getCurrentWeather();

        ctx.save();

        // Draw rain
        if (weather.particles === 'rain' || weather.particles === 'storm') {
            ctx.strokeStyle = 'rgba(200, 220, 255, 0.6)';
            ctx.lineWidth = 2;

            this.rainParticles.forEach(drop => {
                ctx.globalAlpha = drop.opacity;
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x + 3, drop.y + drop.length);
                ctx.stroke();
            });
        }

        // Draw fog
        if (weather.particles === 'fog') {
            this.fogParticles.forEach(fog => {
                ctx.globalAlpha = fog.opacity;
                ctx.fillStyle = '#d0d8e0';
                ctx.beginPath();
                ctx.ellipse(fog.x, fog.y, fog.size, fog.size * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Draw lightning flash
        if (this.lightningFlash > 0) {
            ctx.globalAlpha = this.lightningFlash / 15 * 0.3;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, W, H);
        }

        // Draw water tint overlay
        if (weather.waterTint !== 'rgba(0, 0, 0, 0)') {
            ctx.globalAlpha = 1;
            ctx.fillStyle = weather.waterTint;
            ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
        }

        ctx.restore();
    },

    // Draw dynamic clouds
    drawClouds(ctx, frame) {
        const weather = this.getCurrentWeather();

        ctx.save();
        ctx.globalAlpha = weather.cloudOpacity;

        const cloudSpeed = weather.cloudSpeed;
        const numClouds = 5;

        for (let i = 0; i < numClouds; i++) {
            const offset = (frame * cloudSpeed + i * 300) % (W + 400);
            const x = offset - 200;
            const y = 50 + i * 80;
            const size = 60 + (i % 3) * 20;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

            // Draw cloud puffs
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.arc(x + size * 0.8, y, size * 0.8, 0, Math.PI * 2);
            ctx.arc(x + size * 1.6, y, size * 0.9, 0, Math.PI * 2);
            ctx.arc(x + size * 2.2, y, size * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
};

// Initialize the weather system
WeatherSystem.init();