import { WATER_Y, W, H, GROUND_Y } from './constants.js';

// ─── Helpers ─────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

function hexToRgb(hex) {
    const c = hex.replace('#', '')
    return {
        r: parseInt(c.substring(0, 2), 16),
        g: parseInt(c.substring(2, 4), 16),
        b: parseInt(c.substring(4, 6), 16)
    }
}

function rgbToHex(r, g, b) {
    const cl = v => Math.max(0, Math.min(255, Math.round(v)))
    return '#' + [cl(r), cl(g), cl(b)].map(v => v.toString(16).padStart(2, '0')).join('')
}

function lerpHex(h1, h2, t) {
    const a = hexToRgb(h1), b = hexToRgb(h2)
    return rgbToHex(lerp(a.r, b.r, t), lerp(a.g, b.g, t), lerp(a.b, b.b, t))
}

// Cubic ease-in-out
function easeInOut(t) {
    t = clamp(t, 0, 1)
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// ─── Live wave parameters ─────────────────────────────────
export const waveParams = {
    amp1: 5,  speed1: 0.038, freq1: 0.0055, phase1: Math.random() * Math.PI * 2,
    amp2: 2,  speed2: 0.024, freq2: 0.0031, phase2: Math.random() * Math.PI * 2,
    amp3: 0,  speed3: 0.062, freq3: 0.0019, phase3: Math.random() * Math.PI * 2
}

// Wave descriptor for HUD
export function waveLabel() {
    const amp = Math.round(waveParams.amp1);
    if (amp <= 6) return 'Calm';
    if (amp <= 12) return 'Choppy';
    if (amp <= 20) return 'Rough';
    return 'Violent';
}

export function waveSurf(x, frame) {
    const p = waveParams
    return WATER_Y
        + Math.sin(frame * p.speed1 + x * p.freq1 + p.phase1) * p.amp1
        + Math.sin(frame * p.speed2 + x * p.freq2 + p.phase2) * p.amp2
        + Math.sin(frame * p.speed3 + x * p.freq3 + p.phase3) * p.amp3
}

// ─── Wave targets ─────────────────────────────────────────
const WAVE_TARGETS = {
    clear:  { amp1: 5,  speed1: 0.038, freq1: 0.0055, amp2: 2,  speed2: 0.024, freq2: 0.0031, amp3: 0,  speed3: 0.062, freq3: 0.0019 },
    rainy:  { amp1: 15, speed1: 0.055, freq1: 0.007,  amp2: 7,  speed2: 0.034, freq2: 0.004,  amp3: 4,  speed3: 0.07,  freq3: 0.0025 },
    stormy: { amp1: 30, speed1: 0.072, freq1: 0.0085, amp2: 14, speed2: 0.045, freq2: 0.0048, amp3: 10, speed3: 0.085, freq3: 0.003  },
    foggy:  { amp1: 4,  speed1: 0.03,  freq1: 0.0045, amp2: 1,  speed2: 0.018, freq2: 0.0025, amp3: 0,  speed3: 0.062, freq3: 0.0019 }
}

// ─── Weather configs ──────────────────────────────────────
const WEATHER_CONFIGS = {
    clear:  { skyTop: '#5bc8f5', skyBot: '#0a65c7', cloudColor: '#ffffff', cloudDark: '#e0eaf8', cloudOpacity: 0.35, cloudSpeed: 0.5,  windX: 0.8,  fogDensity: 0, rainAlpha: 0,    particles: 'none'  },
    rainy:  { skyTop: '#6a7a8a', skyBot: '#3a4a5a', cloudColor: '#9aa5b0', cloudDark: '#5a6575', cloudOpacity: 0.92, cloudSpeed: 1.3,  windX: 4.5,  fogDensity: 0, rainAlpha: 0.55, particles: 'rain'  },
    stormy: { skyTop: '#3a4050', skyBot: '#1a2030', cloudColor: '#5a5f6a', cloudDark: '#2a2f3a', cloudOpacity: 1.0,  cloudSpeed: 2.8,  windX: 10,   fogDensity: 0, rainAlpha: 0.78, particles: 'storm' },
    foggy:  { skyTop: '#b8c0c8', skyBot: '#889098', cloudColor: '#d0d8e0', cloudDark: '#a0aab5', cloudOpacity: 0.5,  cloudSpeed: 0.3,  windX: 0.4,  fogDensity: 1, rainAlpha: 0,    particles: 'fog'   }
}

// ─── Cloud pool ───────────────────────────────────────────
const _clouds = Array.from({ length: 16 }, () => ({
    x:     Math.random() * W * 4 - W,
    y:     20 + Math.random() * 200,
    scale: 0.6 + Math.random() * 1.1,
    speed: 0.15 + Math.random() * 0.45,
    alpha: 0.55 + Math.random() * 0.45,
    // Each cloud has a unique cluster of puffs
    puffs: Array.from({ length: 4 + Math.floor(Math.random() * 4) }, () => ({
        dx: (Math.random() - 0.5) * 140,
        dy: (Math.random() - 0.3) * 40,
        rx: 35 + Math.random() * 55,
        ry: 28 + Math.random() * 38
    }))
}))

// ─── Rain drops ───────────────────────────────────────────
const RAIN_COUNT  = 300
const STORM_COUNT = 500

const _rainDrops = Array.from({ length: STORM_COUNT }, () => ({
    x:     Math.random() * W,
    y:     Math.random() * H,
    len:   7 + Math.random() * 10,
    speed: 13 + Math.random() * 9
}))

// ─── Water splash ripples ─────────────────────────────────
const SPLASH_COUNT = 60
const _splashes = Array.from({ length: SPLASH_COUNT }, () => ({
    x:      Math.random() * W,
    y:      WATER_Y,
    r:      0,
    maxR:   3 + Math.random() * 5,
    alpha:  0,
    life:   0,
    speed:  0.04 + Math.random() * 0.04,
    active: false
}))

// ─── Fog patches ──────────────────────────────────────────
const _fogPatches = Array.from({ length: 35 }, () => ({
    x:     Math.random() * W,
    y:     150 + Math.random() * 450,
    r:     90 + Math.random() * 180,
    speed: 0.08 + Math.random() * 0.18,
    alpha: 0.035 + Math.random() * 0.07
}))

// ─── Weather System ───────────────────────────────────────
export const WeatherSystem = {

    _from:    'clear',
    _target:  'clear',
    _progress: 1,

    transitionDuration: 660,
    weatherTimer:    0,
    weatherDuration: 1800,
    autoWeather:     true,

    weatherWeights: { clear: 40, rainy: 30, stormy: 15, foggy: 15 },

    _fromWave: null,

    // ── Compat getters ────────────────────────────────────
    get targetWeather() { return this._target },
    get targetState()   { return this._target },

    // ── Init ─────────────────────────────────────────────
    init() {
        this._from     = 'clear'
        this._target   = 'clear'
        this._fromWave = { ...WAVE_TARGETS.clear }
        this._progress = this.transitionDuration
    },

    // ── Set Weather ───────────────────────────────────────
    setWeather(type) {
        if (!WEATHER_CONFIGS[type]) return
        if (type === this._target && this._progress >= this.transitionDuration) return
        this._fromWave = {
            amp1: waveParams.amp1, speed1: waveParams.speed1, freq1: waveParams.freq1,
            amp2: waveParams.amp2, speed2: waveParams.speed2, freq2: waveParams.freq2,
            amp3: waveParams.amp3, speed3: waveParams.speed3, freq3: waveParams.freq3,
        }
        this._from     = this._target
        this._target   = type
        this._progress = 0
    },

    // ── Random weather ────────────────────────────────────
    _randomize() {
        const entries = Object.entries(this.weatherWeights)
        const total   = entries.reduce((s, [, w]) => s + w, 0)
        let r = Math.random() * total
        for (const [type, w] of entries) {
            r -= w
            if (r <= 0) { this.setWeather(type); return }
        }
    },

    // ── Update ────────────────────────────────────────────
    update(frame, audio = null) {
        if (this.autoWeather) {
            this.weatherTimer++
            if (this.weatherTimer >= this.weatherDuration) {
                this.weatherTimer = 0
                this._randomize()
            }
        }

        if (this._progress < this.transitionDuration) this._progress++

        const bw = this._getBlendedWave()
        for (const k in bw) waveParams[k] = bw[k]

        const w     = this.getCurrentWeather()
        const count = w.particles === 'storm' ? STORM_COUNT : RAIN_COUNT

        // Weather sound logic
        if (audio) {
            if (this._target === 'stormy' || this._target === 'rainy') {
                if (audio.currentWeatherSound !== 'heavyrain') {
                    audio.stop('heavyrain');
                    audio.play('heavyrain');
                    audio.currentWeatherSound = 'heavyrain';
                }
            } else {
                if (audio.currentWeatherSound === 'heavyrain') {
                    audio.stop('heavyrain');
                    audio.currentWeatherSound = null;
                }
            }
        }

        // Scroll rain drops
        for (let i = 0; i < count; i++) {
            const d = _rainDrops[i]
            d.y += d.speed
            d.x += w.windX * 0.45
            if (d.y > H + 20)  { d.y = -12; d.x = Math.random() * W }
            if (d.x >  W + 20) { d.x = -10 }
            if (d.x < -20)     { d.x = W + 10 }
        }

        // Spawn & tick water splashes
        if (w.rainAlpha > 0.05) {
            const spawnChance = w.rainAlpha * 0.3
            for (const s of _splashes) {
                if (!s.active && Math.random() < spawnChance) {
                    s.x      = Math.random() * W
                    s.r      = 0
                    s.life   = 0
                    s.maxR   = 3 + Math.random() * 6
                    s.speed  = 0.032 + Math.random() * 0.042
                    s.alpha  = 0.5 + Math.random() * 0.4
                    s.active = true
                }
                if (s.active) {
                    s.life += s.speed
                    s.r     = s.maxR * easeInOut(clamp(s.life * 1.2, 0, 1))
                    if (s.life >= 1) s.active = false
                }
            }
        } else {
            for (const s of _splashes) s.active = false
        }

        // Scroll clouds
        for (const c of _clouds) {
            c.x -= c.speed * w.cloudSpeed
            if (c.x + c.scale * 200 < 0) c.x = W + Math.random() * 300
        }

        // Drift fog
        for (const f of _fogPatches) {
            f.x += f.speed
            if (f.x - f.r > W) f.x = -f.r
        }
    },

    // ── Eased progress ────────────────────────────────────
    _t() {
        return easeInOut(this._progress / this.transitionDuration)
    },

    // ── Blended waves ─────────────────────────────────────
    // amp  → lerp (height — smooth visual)
    // freq → lerp (spacing — subtle)
    // speed→ hard swap at t≥0.5 — NO lerp to avoid oscillation rate chaos
    _getBlendedWave() {
        const t   = this._t()
        const src = this._fromWave || WAVE_TARGETS.clear
        const dst = WAVE_TARGETS[this._target]
        const out = {}
        for (const k in dst) {
            if (k.includes('speed')) {
                out[k] = t >= 0.5 ? dst[k] : (src[k] ?? dst[k])
            } else if (k.includes('freq')) {
                out[k] = clamp(lerp(src[k] ?? dst[k], dst[k], t), 0.001, 0.02)
            } else {
                out[k] = lerp(src[k] ?? dst[k], dst[k], t)
            }
        }
        return out
    },

    // ── Visual state ──────────────────────────────────────
    getCurrentWeather() {
        const t   = this._t()
        const src = WEATHER_CONFIGS[this._from]
        const dst = WEATHER_CONFIGS[this._target]
        return {
            skyTop:       lerpHex(src.skyTop,       dst.skyTop,       t),
            skyBot:       lerpHex(src.skyBot,        dst.skyBot,       t),
            cloudColor:   lerpHex(src.cloudColor,    dst.cloudColor,   t),
            cloudDark:    lerpHex(src.cloudDark,     dst.cloudDark,    t),
            cloudOpacity: lerp(src.cloudOpacity,     dst.cloudOpacity, t),
            cloudSpeed:   lerp(src.cloudSpeed,       dst.cloudSpeed,   t),
            windX:        lerp(src.windX,            dst.windX,        t),
            fogDensity:   lerp(src.fogDensity,       dst.fogDensity,   t),
            rainAlpha:    lerp(src.rainAlpha,        dst.rainAlpha,    t),
            particles:    t >= 0.5 ? dst.particles : src.particles
        }
    },

    // ── Draw Clouds ───────────────────────────────────────
    // Layered ellipse clusters: dark underside + light body + white highlight
    drawClouds(ctx, frame) {
        const w = this.getCurrentWeather()
        if (w.cloudOpacity <= 0.01) return

        ctx.save()
        for (const c of _clouds) {
            const baseAlpha = c.alpha * w.cloudOpacity
            if (baseAlpha < 0.01) continue

            const cx = c.x, cy = c.y, sc = c.scale

            // Dark flat underside (storm clouds look heavy)
            ctx.globalAlpha = baseAlpha * 0.5
            ctx.fillStyle   = w.cloudDark
            for (const p of c.puffs) {
                ctx.beginPath()
                ctx.ellipse(cx + p.dx * sc, cy + p.dy * sc + 10 * sc, p.rx * sc * 0.95, p.ry * sc * 0.55, 0, 0, Math.PI * 2)
                ctx.fill()
            }

            // Main cloud body
            ctx.globalAlpha = baseAlpha
            ctx.fillStyle   = w.cloudColor
            for (const p of c.puffs) {
                ctx.beginPath()
                ctx.ellipse(cx + p.dx * sc, cy + p.dy * sc, p.rx * sc, p.ry * sc, 0, 0, Math.PI * 2)
                ctx.fill()
            }

            // Bright highlight on top puffs only
            ctx.globalAlpha = baseAlpha * 0.28
            ctx.fillStyle   = '#ffffff'
            for (const p of c.puffs) {
                if (p.dy <= 0) {
                    ctx.beginPath()
                    ctx.ellipse(cx + p.dx * sc, cy + (p.dy - 5) * sc, p.rx * sc * 0.55, p.ry * sc * 0.45, 0, 0, Math.PI * 2)
                    ctx.fill()
                }
            }
        }

        ctx.globalAlpha = 1
        ctx.restore()
    },

    // ── Draw Water Splashes ───────────────────────────────
    // Call from render_map drawWaterForeground, after the foam strip.
    // cx = camera x (world offset), frame = current frame for waveSurf
    drawWaterSplashes(ctx, cx, frame) {
        const w = this.getCurrentWeather()
        if (w.rainAlpha < 0.04) return

        ctx.save()
        ctx.strokeStyle = '#c8dce8'
        ctx.lineWidth   = 1

        for (const s of _splashes) {
            if (!s.active || s.r < 0.3) continue

            const worldX = s.x + cx
            const surfY  = waveSurf(worldX, frame)
            const fade   = clamp(1 - s.life, 0, 1)

            ctx.globalAlpha = s.alpha * fade * w.rainAlpha

            // Outer oval ripple
            ctx.beginPath()
            ctx.ellipse(s.x, surfY, s.r * 2.2, s.r * 0.65, 0, 0, Math.PI * 2)
            ctx.stroke()

            // Inner ring for depth
            if (s.r > 2) {
                ctx.globalAlpha = s.alpha * fade * w.rainAlpha * 0.35
                ctx.beginPath()
                ctx.ellipse(s.x, surfY, s.r * 1.0, s.r * 0.3, 0, 0, Math.PI * 2)
                ctx.stroke()
            }
        }

        ctx.globalAlpha = 1
        ctx.restore()
    },

    // ── Draw Weather Effects (screen-space) ───────────────
    drawWeatherEffects(ctx, cameraY) {
        const w = this.getCurrentWeather()

        // Rain / Storm — two depth passes for parallax feel
        if (w.rainAlpha > 0.01) {
            const isStorm   = w.particles === 'storm'
            const count     = isStorm ? STORM_COUNT : RAIN_COUNT
            const windAngle = w.windX * 0.038

            ctx.save()
            ctx.strokeStyle = isStorm ? '#8fb8d0' : '#a8c4d8'
            ctx.lineWidth   = isStorm ? 1.4 : 0.9

            for (let pass = 0; pass < 2; pass++) {
                const isFar   = pass === 0
                ctx.globalAlpha = w.rainAlpha * (isFar ? 0.28 : 0.88)
                const start   = isFar ? 0                        : Math.floor(count * 0.4)
                const end     = isFar ? Math.floor(count * 0.4)  : count
                const lenMul  = isFar ? 0.55 : 1.0

                ctx.beginPath()
                for (let i = start; i < end; i++) {
                    const d  = _rainDrops[i]
                    const dx = Math.sin(windAngle) * d.len * lenMul
                    const dy = Math.cos(windAngle) * d.len * lenMul
                    ctx.moveTo(d.x,      d.y)
                    ctx.lineTo(d.x + dx, d.y + dy)
                }
                ctx.stroke()
            }

            // Lightning flash
            if (isStorm && Math.random() < 0.0018) {
                ctx.globalAlpha = 0.1 + Math.random() * 0.1
                ctx.fillStyle   = '#e8f4ff'
                ctx.fillRect(0, 0, W, H)
            }

            // Wind streaks during stormy weather only
            if (isStorm && w.windX > 3) {
                ctx.globalAlpha = w.rainAlpha * 0.35
                ctx.strokeStyle = '#a0c8d8'
                ctx.lineWidth = 2.5
                
                const windStrength = w.windX
                const streakCount = 25
                
                for (let i = 0; i < streakCount; i++) {
                    const y = (i * (H / streakCount) + (cameraY % H)) % H
                    const streakLength = 80 + Math.sin(i * 0.5) * 40
                    const xOffset = Math.sin(i * 0.3) * 20
                    
                    ctx.beginPath()
                    ctx.moveTo(xOffset, y)
                    ctx.lineTo(xOffset + streakLength, y)
                    ctx.stroke()
                    
                    // Double streak for extra wind effect
                    ctx.beginPath()
                    ctx.moveTo(W + xOffset - streakLength, y + 3)
                    ctx.lineTo(W + xOffset, y + 3)
                    ctx.stroke()
                }
            }

            ctx.restore()
        }

        // Fog
        if (w.fogDensity > 0.01) {
            ctx.save()
            for (const f of _fogPatches) {
                const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r)
                const a    = f.alpha * w.fogDensity * 3.5
                grad.addColorStop(0,   `rgba(195,208,215,${clamp(a, 0, 0.55)})`)
                grad.addColorStop(0.6, `rgba(195,208,215,${clamp(a * 0.4, 0, 0.3)})`)
                grad.addColorStop(1,   'rgba(195,208,215,0)')
                ctx.fillStyle = grad
                ctx.beginPath()
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
                ctx.fill()
            }
            ctx.globalAlpha = clamp(w.fogDensity * 0.32, 0, 0.5)
            ctx.fillStyle   = '#bfcdd4'
            ctx.fillRect(0, 0, W, H)
            ctx.restore()
        }
    },

    // ── Helpers ───────────────────────────────────────────
    hexToRgb,
    rgbToHex,
    lerpColor: lerpHex
}

// ── Homepage Weather ──────────────────────────────────────
const HOME_RAIN_CONFIG = {
    count: 0,
    windX: 0,
    rainAlpha: 0,
    dropColor: '#c8dce8'
};

export const HomeWeather = {
    canvas: null,
    ctx: null,
    drops: [],
    lightningOverlay: null,
    active: true,
    animationId: null,
    lightningInterval: null,

    init() {
        this.canvas = document.getElementById('rain-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.lightningOverlay = document.getElementById('lightning-overlay');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.drops = Array.from({ length: HOME_RAIN_CONFIG.count }, () => ({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            len: 7 + Math.random() * 10,
            speed: 13 + Math.random() * 9
        }));

        this.startLightning();
        this.animate();
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    stop() {
        this.active = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.lightningInterval) clearInterval(this.lightningInterval);
    },

    isNearElement(x, y) {
        const titleItems = document.querySelectorAll('.game-title');
        const buttonItems = document.querySelectorAll('.start-button');
        if (titleItems.length === 0 || buttonItems.length === 0) return null;

        const titleRect = titleItems[0].getBoundingClientRect();
        const buttonRect = buttonItems[0].getBoundingClientRect();

        if (x > titleRect.left && x < titleRect.right && y > titleRect.top && y < titleRect.bottom) {
            return { type: 'title', rect: titleRect };
        }
        if (x > buttonRect.left && x < buttonRect.right && y > buttonRect.top && y < buttonRect.bottom) {
            return { type: 'button', rect: buttonRect };
        }
        return null;
    },

    animate() {
        if (!this.active) return;
        const ctx = this.ctx;
        const canvas = this.canvas;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = HOME_RAIN_CONFIG.dropColor;
        ctx.lineWidth = 1.5;

        for (const d of this.drops) {
            d.y += d.speed;
            d.x += HOME_RAIN_CONFIG.windX * 0.3;

            if (d.y > canvas.height + 20) {
                d.y = -12;
                d.x = Math.random() * canvas.width;
            }
            if (d.x > canvas.width + 20) d.x = -10;
            if (d.x < -20) d.x = canvas.width + 10;

            const collision = this.isNearElement(d.x, d.y);
            if (collision) {
                ctx.globalAlpha = HOME_RAIN_CONFIG.rainAlpha * 0.8;
                ctx.shadowColor = 'rgba(200, 220, 255, 0.5)';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + HOME_RAIN_CONFIG.windX * 0.5, d.y + d.len);
                ctx.stroke();
                ctx.shadowColor = 'transparent';
            } else {
                ctx.globalAlpha = HOME_RAIN_CONFIG.rainAlpha;
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + HOME_RAIN_CONFIG.windX * 0.5, d.y + d.len);
                ctx.stroke();
            }
        }

        this.drawWetEffect();
        this.drawWindStreaks();

        ctx.globalAlpha = 1;
        this.animationId = requestAnimationFrame(() => this.animate());
    },

    drawWindStreaks() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        ctx.globalAlpha = HOME_RAIN_CONFIG.rainAlpha * 0.25;
        ctx.strokeStyle = HOME_RAIN_CONFIG.dropColor;
        ctx.lineWidth = 2;

        const streakCount = 20;
        for (let i = 0; i < streakCount; i++) {
            const y = (i * (canvas.height / streakCount)) % canvas.height;
            const streakLength = 60 + Math.sin(i * 0.5) * 30;
            const xOffset = Math.sin(i * 0.3) * 15;

            ctx.beginPath();
            ctx.moveTo(xOffset, y);
            ctx.lineTo(xOffset + streakLength, y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(canvas.width + xOffset - streakLength, y + 2);
            ctx.lineTo(canvas.width + xOffset, y + 2);
            ctx.stroke();
        }
    },

    drawWetEffect() {
        const titleItems = document.querySelectorAll('.game-title');
        const buttonItems = document.querySelectorAll('.start-button');
        if (titleItems.length === 0 || buttonItems.length === 0) return;

        const titleRect = titleItems[0].getBoundingClientRect();
        const buttonRect = buttonItems[0].getBoundingClientRect();

        this.ctx.globalAlpha = HOME_RAIN_CONFIG.rainAlpha * 0.5;
        for (let i = 0; i < 5; i++) {
            const x = titleRect.left + Math.random() * titleRect.width;
            const y = titleRect.bottom - 5;
            const radius = 1.5 + Math.random() * 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = HOME_RAIN_CONFIG.dropColor;
            this.ctx.fill();
        }
        for (let i = 0; i < 3; i++) {
            const x = buttonRect.left + Math.random() * buttonRect.width;
            const y = buttonRect.top + Math.random() * buttonRect.height;
            const radius = 1 + Math.random() * 1.5;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = HOME_RAIN_CONFIG.dropColor;
            this.ctx.fill();
        }
    },

    startLightning() {
        this.lightningInterval = setInterval(() => {
            if (this.lightningOverlay) {
                this.lightningOverlay.classList.remove('lightning-flash');
                void this.lightningOverlay.offsetWidth;
                this.lightningOverlay.classList.add('lightning-flash');
            }
        }, 3000);
    }
};

// ── Weather UI & Control ──────────────────────────────────
export function updateWeatherDisplay() {
    const weatherNames = { 'clear': '☀ Clear', 'rainy': '🌧 Rainy', 'stormy': '⛈ Stormy', 'foggy': '🌫 Foggy' };
    const label = weatherNames[WeatherSystem.targetState] || WeatherSystem.targetState;
    const el1 = document.getElementById('current-weather');
    const el2 = document.getElementById('h-wx');
    if (el1) el1.textContent = label;
    if (el2) el2.textContent = label;
    
    // Also update HUD waves/wind
    const wvEl = document.getElementById('h-wave');
    const windEl = document.getElementById('h-wind');
    if (wvEl) wvEl.textContent = `Waves: ${waveLabel()}`;
    if (windEl) windEl.textContent = `Wind: ${Math.round(WeatherSystem.getCurrentWeather().windX * 3)}mph`;
}

export function buildWeatherWeightPanel() {
    const panel = document.getElementById('wx-weights-panel');
    if (!panel) return;
    const icons = { clear: '☀', rainy: '🌧', stormy: '⛈', foggy: '🌫' };
    panel.innerHTML = '';
    for (const [type, weight] of Object.entries(WeatherSystem.weatherWeights)) {
        const id = `wx-w-${type}`;
        const row = document.createElement('div');
        row.style.cssText = 'margin-bottom:5px;';
        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:1px;">
                <span>${icons[type] || ''} ${type[0].toUpperCase() + type.slice(1)}</span>
                <span id="${id}-val" style="color:#ffe;">${weight}</span>
            </div>
            <input type="range" min="0" max="100" step="1" value="${weight}"
                oninput="window.wxSetWeight('${type}',+this.value); document.getElementById('${id}-val').textContent=this.value;"
                style="width:100%; cursor:pointer; accent-color:#5588cc;">`;
        panel.appendChild(row);
    }
}

// Expose to window for HTML onclick handlers
window.setWeather = (type) => { WeatherSystem.setWeather(type); updateWeatherDisplay(); };
window.wxSetAuto     = (en) => { WeatherSystem.autoWeather = en; };
window.wxSetDuration = (f)  => { 
    WeatherSystem.weatherDuration = f; WeatherSystem.weatherTimer = 0;
    const el = document.getElementById('wx-timer-val');
    if (el) el.textContent = `${Math.round(f / 60)}s`;
};
window.wxSetTransition = (f) => {
    WeatherSystem.transitionDuration = f;
    const el = document.getElementById('wx-trans-val');
    if (el) el.textContent = `${Math.round(f / 60)}s`;
};
window.wxSetWeight = (type, val) => { WeatherSystem.weatherWeights[type] = +val; };

WeatherSystem.init()