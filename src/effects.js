// src/effects.js
/**
 * Particle class for splash effects
 */
class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.maxLife = life;
        this.life = life;
        this.size = Math.random() * 3 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.25; // Gravity effect
        this.life--;
    }

    draw(ctx, cx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(Math.floor(this.x - cx), Math.floor(this.y), this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

/**
 * Ripple class for water impact
 */
class Ripple {
    constructor(x, y, maxR, lifeTime) {
        this.x = x;
        this.y = y;
        this.r = 0;
        this.maxR = maxR;
        this.life = 1.0;
        this.decay = 1.0 / lifeTime;
    }

    update() {
        this.r += (this.maxR - this.r) * 0.1;
        this.life -= this.decay;
    }

    draw(ctx, cx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.strokeStyle = `rgba(200, 230, 255, ${this.life * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Ellipse for perspective
        ctx.ellipse(this.x - cx, this.y, this.r, this.r * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

export class EffectManager {
    constructor() {
        this.particles = [];
        this.ripples = [];
    }

    /**
     * Create a splash at given coordinates
     */
    addSplash(x, y) {
        // Add vertical water particles with randomized blues and whites
        const particleCount = 15 + Math.floor(Math.random() * 10);
        const colors = ['#ffffff', '#e1f5fe', '#b3e5fc', '#81d4fa'];
        
        for (let i = 0; i < particleCount; i++) {
            const vx = (Math.random() - 0.5) * 6;
            const vy = -Math.random() * 8 - 4; // Initial upward burst
            const life = 25 + Math.floor(Math.random() * 25);
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x, y, vx, vy, color, life));
        }

        // Add a primary growing ripple
        this.ripples.push(new Ripple(x, y, 60, 50));
        // Add a secondary smaller follow-up ripple for extra detail
        setTimeout(() => {
            this.ripples.push(new Ripple(x, y, 35, 40));
        }, 100);
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        for (let i = this.ripples.length - 1; i >= 0; i--) {
            this.ripples[i].update();
            if (this.ripples[i].life <= 0) {
                this.ripples.splice(i, 1);
            }
        }
    }

    draw(ctx, cx) {
        for (const r of this.ripples) {
            r.draw(ctx, cx);
        }
        for (const p of this.particles) {
            p.draw(ctx, cx);
        }
    }
}

export const effectManager = new EffectManager();
