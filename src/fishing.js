// src/fishing.js
import { WATER_Y, GRAVITY, SHORE_LINE_DEPTH, SHORE_END, getDepthEndLine, getDeepSoilY } from './constants.js';
import { SPRITE_DATA } from './fish.js';
import { audio } from './main.js';
import { ROD_TIPS } from './rod_tips.js';

export class Rod {
    constructor(player, fishManager) {
        this.player = player;
        this.fishManager = fishManager;

        this.x = player.x;
        this.y = player.y;
        this.vx = 0;
        this.vy = 0;
        // Initialized properly so draw() never falls back to head position
        this.originX = player.x + 20;
        this.originY = player.y + 30;

        this.angle = -Math.PI / 4;
        this.power = 0;
        this.maxPower = 7.5;
        // state variables
        this.isCasting = false;
        this.isBaitInWater = false;
        this.isSinking = false;

        this.baitImg = new Image();
        this.baitImg.src = 'assets/doomsday-oarfish.png';
        this.baitSize = 16;

        this.reeling = false;
        this.reelTimer = 0;
        this.reelDuration = 500;
        // landing variables
        this.landedX = null;
        this.landedXOffset = 0;
        this.landedY = null;
        this.sinkSpeed = 0.8;
        this.sinkDepth = SHORE_LINE_DEPTH;
        this.depthOffset = 0;
        this.maxDepthOffset = 0;

        this.baitRadius = 32;
        this.caughtFish = null;

        this.eWasUp = true;
        this.hookFlash = 0;

        // Catch Minigame
        this.catchProgress = 0;
        this.struggling = false; // true when a fish is hooked but not yet fully caught
    }

    update(keys, isThrowAnim = false) {
        const ePressedNow = keys['f'] && this.eWasUp;
        this.eWasUp = !keys['f'];

        if (this.fishManager) {
            for (const fish of this.fishManager.fishes) fish.inHitbox = false;
        }

        if (this.hookFlash > 0) this.hookFlash--;

        // Dynamic bait radius based on rod level. +15px per level. Level 1 = 32. Level 5 = 92
        this.baitRadius = 32 + (this.player.rodLevel - 1) * 15;

        // Determine rod origin from per-frame sprite rod-tip lookup table
        const p = this.player;
        const sc = p.scale;

        // Pick which lookup key + frame index to use
        let tipKey, tipFrame, tipFrameW;
        if (p.isThrowAnim) {
            tipKey    = 'throw';
            tipFrame  = p.throwFrame;
            tipFrameW = p.throwFrameW;
        } else if (p.isFishIdle) {
            tipKey    = 'fishidle';
            tipFrame  = p.fishIdleFrame;
            tipFrameW = p.fishIdleFrameW;
        } else if (p.isMoving) {
            tipKey    = 'walk';
            tipFrame  = p.currentFrame;
            tipFrameW = p.frameW;
        } else {
            tipKey    = 'idle';
            tipFrame  = p.currentFrame;
            tipFrameW = p.frameW;
        }

        const tips = ROD_TIPS[tipKey];
        const tip  = (tips && tips[tipFrame]) ? tips[tipFrame] : { x: 20, y: 30 };

        // The sprite is drawn centred on player.x + drawW/2 and flipped for facing
        const drawW = tipFrameW * sc;
        const centerX = p.x + drawW / 2;

        // Mirror tip.x when facing left (scale(-1,1) around centre)
        const tipLocalX = p.facing === 1 ? tip.x : (tipFrameW - tip.x);
        const originX = centerX + (tipLocalX - tipFrameW / 2) * sc;
        const originY = p.y + tip.y * sc;

        this.originX = originX;
        this.originY = originY;

        // ---------- Casting ----------
        if (!this.isCasting && !isThrowAnim) {
            // Require explicit boat fishing state if on a boat
            if (this.player.state === 'onBoat' && this.player.boatRef) {
                if (this.player.boatRef.state !== 'fishing') {
                    this.power = 0; // Prevent power charging
                    this.x = originX;
                    this.y = originY;
                    return;         // Exit completely
                }
            }

            if (keys['w'] || keys['ArrowUp']) this.angle -= 0.02;
            if (keys['s'] || keys['ArrowDown']) this.angle += 0.02;
            if (keys[' ']) this.power = Math.min(this.power + 0.3, this.maxPower);

            if (!keys[' '] && this.power > 0) {
                const projectedX = originX + Math.cos(this.angle) * this.power * 10;
                if (projectedX <= SHORE_END) { this.power = 0; return; }

                // Store pending cast parameters and start throw animation
                this._pendingOriginX = originX;
                this._pendingOriginY = originY;
                const castData = {
                    vx: Math.cos(this.angle) * this.power,
                    vy: Math.sin(this.angle) * this.power,
                    originX,
                    originY,
                    sinkDepth: (this.player.state === 'onBoat') ? 200 + 100 * (this.player.boatLevel - 1) : SHORE_LINE_DEPTH
                };
                this.power = 0;

                // Trigger throw animation on player; actual cast fires in _fireCast() after anim
                this.player.isThrowAnim = true;
                this.player.throwFrame = 0;
                this.player.throwTimer = 0;
                this.player._pendingCast = castData;
                return;
            }
        }

        // ---------- Physics ----------
        if (this.isCasting && !this.reeling) {
            if (!this.isBaitInWater) {
                if (ePressedNow) {
                    this.reeling = true;
                    audio.play('reel');
                    return;
                }

                this.vy += GRAVITY;
                this.x += this.vx;
                this.y += this.vy;
                if (this.y >= WATER_Y) {
                    this.y = WATER_Y;
                    this.vx = 0; this.vy = 0;

                    audio.play('splash');

                    this.isBaitInWater = true;
                    this.isSinking = true;
                    this.landedX = this.x;
                    this.landedXOffset = this.x - originX;
                    this.depthOffset = 0;
                }
            } else if (this.isSinking) {
                if (ePressedNow) {
                    this.reeling = true;
                    return;
                }

                this.x = originX + this.landedXOffset;
                this.depthOffset += this.sinkSpeed;

                // Max depth based on rod level
                // Player's rodLevel handles this, defaults to Level 1
                this.maxDepthOffset = getDepthEndLine(Math.min(6, this.player.rodLevel)) - WATER_Y;

                // Vertical bait control override
                const depthSpeed = 4.0; // Responsive manual speed

                if (keys['ArrowUp'] || keys['w']) {
                    this.depthOffset -= depthSpeed;
                    this.isSinking = false; // override auto-sink if they pull up
                }
                if (keys['ArrowDown'] || keys['s']) {
                    this.depthOffset += depthSpeed;
                    this.isSinking = false; // override auto-sink if they pull down manually
                }

                // Hard bounds for depth
                this.depthOffset = Math.max(0, Math.min(this.maxDepthOffset, this.depthOffset));

                this.y = WATER_Y + this.depthOffset;

                // Deep soil slope bound
                const groundY = getDeepSoilY(this.x);
                if (this.y >= groundY) {
                    this.y = groundY;
                    this.depthOffset = this.y - WATER_Y;
                    this.isSinking = false; // hit the ground, stop sinking
                }

                this.landedY = this.y;

                // If auto-sinking reached limit, gracefully stop sinking state
                if (this.isSinking && this.depthOffset >= this.maxDepthOffset) {
                    this.depthOffset = this.maxDepthOffset;
                    this.isSinking = false;
                }

            } else {
                this.x = originX + this.landedXOffset;

                // Max depth based on rod level
                this.maxDepthOffset = getDepthEndLine(Math.min(6, this.player.rodLevel)) - WATER_Y;

                // Vertical bait control
                const depthSpeed = 4.0;

                if (keys['ArrowUp'] || keys['w']) {
                    this.depthOffset -= depthSpeed;
                }
                if (keys['ArrowDown'] || keys['s']) {
                    this.depthOffset += depthSpeed;
                }

                // Hard bounds for depth
                this.depthOffset = Math.max(0, Math.min(this.maxDepthOffset, this.depthOffset));

                // Apply depth
                this.y = WATER_Y + this.depthOffset;

                // Deep soil slope bound
                const groundY = getDeepSoilY(this.x);
                if (this.y >= groundY) {
                    this.y = groundY;
                    this.depthOffset = this.y - WATER_Y;
                }

                this.landedY = this.y;

                if (!this.caughtFish) {
                    for (const fish of this.fishManager.fishes) {
                        if (fish.caught) continue;
                        const dist = Math.hypot(fish.x - this.x, fish.y - this.y);
                        fish.inHitbox = dist <= this.baitRadius;
                        if (fish.inHitbox && ePressedNow) {
                            audio.play('reel');
                            fish.caught = true;
                            this.caughtFish = fish;
                            this.struggling = true;
                            this.catchProgress = 0;
                            this.hookFlash = 120;
                            break;
                        }
                    }
                    if (!this.caughtFish && ePressedNow) {
                        this.reeling = true; // reel empty hook
                        audio.play('reel');
                    }
                }
            }
        }

        // ---------- Struggle Minigame ----------
        if (this.struggling && this.caughtFish) {
            // Fish stays attached to the struggle point
            this.caughtFish.x = this.x;
            this.caughtFish.y = this.y;

            let requiredTaps = 2; // default for common
            let escapeChance = 0; // chance to escape per frame

            switch (SPRITE_DATA[this.caughtFish.type].rarity) {
                case 'common': requiredTaps = 2; escapeChance = 0.000; break;
                case 'uncommon': requiredTaps = 4; escapeChance = 0.000; break;
                case 'rare': requiredTaps = 8; escapeChance = 0.0005; break; // ~6% per second
                case 'epic': requiredTaps = 15; escapeChance = 0.001; break; // ~18% per second
                case 'legendary': requiredTaps = 25; escapeChance = 0.002; break; // ~30% per second
                default: requiredTaps = 2; escapeChance = 0.000; break;
            }

            // RNG Escape Roll
            if (Math.random() < escapeChance) {
                console.log(`${this.caughtFish.type} snapped the line and got away!`);
                audio.play('failed');
                this.caughtFish.caught = false;
                this.caughtFish = null;
                this.struggling = false;
                this.reeling = true; // reels empty hook in shame
            } else {
                if (ePressedNow) {
                    this.catchProgress += 1;
                }

                // Win fish if taps reached
                if (this.catchProgress >= requiredTaps) {
                    this.catchProgress = requiredTaps;
                    this.caughtFish.requiredTaps = requiredTaps; // for UI reference if needed briefly
                    this.struggling = false;
                    this.reeling = true; // now smoothly reel the caught fish in
                }
            }
        }

        // ---------- Reel ----------
        if (this.reeling) {
            if (this.caughtFish) {
                this.caughtFish.x = this.x;
                this.caughtFish.y = this.y;
            }

            const dx = originX - this.x;
            const dy = originY - this.y;
            const dist = Math.hypot(dx, dy);
            const reelSpeed = 5;

            if (dist < reelSpeed) {
                if (this.caughtFish) {
                    // Log catch to Player Inventory
                    const fishId = this.caughtFish.type;
                    if (this.player.inventory[fishId] !== undefined) {
                        this.player.inventory[fishId] += 1;
                    }
                    this.fishManager.fishes = this.fishManager.fishes.filter(f => f !== this.caughtFish);
                    console.log(`Landed a ${this.caughtFish.type}!`);
                    audio.play('success');
                    setTimeout(() => {
                        this.reset();
                    }, 100);
                    // Update caught notification ui
                    // uiManager.showNotification(`Caught a ${this.caughtFish.name}!`); // you can enable this later

                    // Update HUD to reflect new total catch count
                    import('./ui.js').then(module => {
                        module.uiManager.updateHUD();
                    });

                    this.caughtFish = null;
                }
                this.reset();
            } else {
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * reelSpeed;
                this.y += Math.sin(angle) * reelSpeed;
            }
        }

        // ---------- Idle bait ----------
        if (!this.isCasting && !this.reeling) {
            this.x = originX;
            this.y = originY;
        }
    }

    /**
     * Called by Player after the throw animation completes.
     * Launches the hook with the stored cast parameters.
     */
    _fireCast(castData) {
        this.isCasting = true;
        this.vx = castData.vx;
        this.vy = castData.vy;
        this.power = 0;
        this.reelTimer = 0;
        this.landedX = null;
        this.landedXOffset = 0;
        this.landedY = null;
        this.isSinking = false;
        this.caughtFish = null;
        this.depthOffset = 0;
        this.sinkDepth = castData.sinkDepth;
        // Launch bait from the CURRENT rod tip (end of throw animation),
        // not the stale idle position stored when spacebar was released.
        this.x = this.originX;
        this.y = this.originY;
        audio.play('cast');
    }

    draw(ctx, cameraX = 0) {
        const screenX = this.x - cameraX;
        const screenY = this.y;

        // Rod line
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Use !== undefined so originX=0 still works (avoids falsy fallback to head position)
        const rodTipX = (this.originX !== undefined) ? this.originX - cameraX : this.player.x - cameraX + 24;
        const rodTipY = (this.originY !== undefined) ? this.originY : this.player.y + 30;
        ctx.moveTo(rodTipX, rodTipY);

        let sag = 0;
        if (this.reeling || this.struggling) {
            // High tension, line is perfectly straight
            sag = 0;
        } else if (this.isCasting && !this.isBaitInWater) {
            // Throwing arc, slack trails behind and sags
            sag = Math.min(120, Math.abs(rodTipX - screenX) * 0.25);
        } else if (this.isCasting && this.isBaitInWater) {
            // Resting in water, normal gravity sag
            sag = Math.min(50, Math.abs(rodTipX - screenX) * 0.15);
        }

        const cpX = (rodTipX + screenX) / 2;
        const cpY = ((rodTipY + screenY) / 2) + sag;
        ctx.quadraticCurveTo(cpX, cpY, screenX, screenY);
        ctx.stroke();

        // Preview angle
        if (!this.isCasting) {
            const previewLength = 50 + this.power * 2;
            const px = rodTipX + Math.cos(this.angle) * previewLength;
            const py = rodTipY + Math.sin(this.angle) * previewLength;
            ctx.strokeStyle = 'rgba(229, 255, 0, 0.6)';
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(rodTipX, rodTipY);
            ctx.lineTo(px, py);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Power meter
        if (!this.isCasting) {
            ctx.fillStyle = 'gray';
            ctx.fillRect(this.player.x - cameraX, this.player.y - 10, this.maxPower * 4, 5);
            ctx.fillStyle = 'lime';
            ctx.fillRect(this.player.x - cameraX, this.player.y - 10, this.power * 4, 5);
        }

        const fishNearby = this.fishManager?.fishes.some(f => f.inHitbox);
        ctx.save();
        if (fishNearby && !this.caughtFish && !this.struggling) {
            const pulse = 1 + 0.2 * Math.sin(Date.now() / 100);
            const size = this.baitSize * pulse;
            if (this.baitImg.complete && this.baitImg.naturalWidth !== 0) {
                ctx.drawImage(this.baitImg, screenX - size / 2, screenY - size / 2, size, size);
            }
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.strokeText('[F] Hook!', screenX, screenY - 50);
            ctx.fillText('[F] Hook!', screenX, screenY - 50);
        } else {
            if (this.baitImg.complete && this.baitImg.naturalWidth !== 0) {
                ctx.drawImage(this.baitImg, screenX - this.baitSize / 2, screenY - this.baitSize / 2, this.baitSize, this.baitSize);
            } else {
                ctx.fillStyle = 'red';
                ctx.fillRect(screenX - this.baitSize / 2, screenY - this.baitSize / 2, this.baitSize, this.baitSize);
            }
        }

        // Struggle minigame UI
        if (this.struggling && this.caughtFish) {
            let requiredTaps = 2;
            const fishRarity = SPRITE_DATA[this.caughtFish.type]?.rarity || 'common';
            switch (fishRarity) {
                case 'common': requiredTaps = 2; break;
                case 'uncommon': requiredTaps = 4; break;
                case 'rare': requiredTaps = 8; break;
                case 'epic': requiredTaps = 15; break;
                case 'legendary': requiredTaps = 25; break;
            }

            // Draw progress bar above the fish
            const barW = 100;
            const barH = 10;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(screenX - barW / 2, screenY - 40, barW, barH);

            // Progress fill
            const fillRatio = Math.max(0, Math.min(1.0, this.catchProgress / requiredTaps));
            ctx.fillStyle = fillRatio > 0.8 ? '#00ff00' : (fillRatio > 0.3 ? '#ffff00' : '#ff0000');
            ctx.fillRect(screenX - barW / 2, screenY - 40, barW * fillRatio, barH);

            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.strokeText('Spam [F]!', screenX, screenY - 50);
            ctx.fillText('Spam [F]!', screenX, screenY - 50);
        }

        ctx.restore();

        // Hitbox
        ctx.strokeStyle = fishNearby ? 'rgba(255,80,80,0.7)' : 'rgba(255,255,0,0.3)';
        ctx.lineWidth = fishNearby ? 2 : 1;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.baitRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Hooked flash
        if (this.hookFlash > 0) {
            const alpha = Math.min(1, this.hookFlash / 20);
            const playerScreenX = this.player.x - cameraX;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.fillStyle = '#FFD700';
            ctx.strokeText('HOOKED!', playerScreenX, this.player.y - 30);
            ctx.fillText('HOOKED!', playerScreenX, this.player.y - 30);
            ctx.restore();
        }

        // Reeling label
        if (this.caughtFish && this.reeling) {
            const playerScreenX = this.player.x - cameraX;
            ctx.save();
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            const label = `Reeling: ${this.caughtFish.name}...`;
            ctx.strokeText(label, playerScreenX, this.player.y - 12);
            ctx.fillText(label, playerScreenX, this.player.y - 12);
            ctx.restore();
        }
    }

    reset() {
        audio.sounds.reel.pause();
        audio.sounds.reel.currentTime = 0;

        this.isCasting = false;
        this.isBaitInWater = false;
        this.isSinking = false;
        this.vx = 0; this.vy = 0;
        this.x = this.player.x + 20;
        this.y = this.player.y;
        this.angle = -Math.PI / 4;
        this.power = 0;
        this.reeling = false;
        this.struggling = false;
        this.catchProgress = 0;
        this.reelTimer = 0;
        this.landedX = null;
        this.landedXOffset = 0;
        this.landedY = null;
        this.caughtFish = null;
        this.depthOffset = 0;
    }
}