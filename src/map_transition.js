// src/map_transition.js
import { MAPS, MAP_TRANSITION_X_LEFT } from './constants.js';
import { uiManager } from './ui.js';
import { SPRITE_DATA } from './fish.js';

export class MapTransitionManager {
    constructor() {
        this.active = false;
        this.progress = 0;
        this.direction = 1;
        this.sweepDir = 1;
        this.speed = 0.02;
        this.pendingMapChange = null;
        this.pendingPlayerX = null;
        this.pendingBoatX = null;
        this.bypassRequirements = false; // Added for bypass functionality
    }

    updateTransition(currentMap, boat, player) {
        if (!this.active) return currentMap;

        let newMap = currentMap;
        this.progress += this.speed * this.direction;

        if (this.progress >= 1 && this.direction === 1) {
            this.direction = -1;
            this.progress = 1;

            if (this.pendingMapChange !== null) {
                newMap = this.pendingMapChange;
                boat.x = this.pendingBoatX;
                player.x = this.pendingPlayerX;

                // Show notification for the new map
                const mapInfo = MAPS[newMap];
                if (mapInfo) {
                    uiManager.showLevelPopup(mapInfo.name);
                }

                this.pendingMapChange = null;
            }
        }
        if (this.progress <= 0 && this.direction === -1) {
            this.active = false;
            this.progress = 0;
            this.direction = 1;
        }

        return newMap;
    }

    checkBoundaries(currentMap, boat, player, uiManager) {
        if ((boat.state !== 'sailing' && player.state !== 'onBoat') || this.active) return;

        const currentMapLength = MAPS[currentMap].length;

        if (boat.x > currentMapLength) {
            if (currentMap < MAPS.length - 1) {
                // Use jumping map for requirement check
                const targetMap = currentMap + 1;
                const nextMapReq = MAPS[targetMap].requiredBoatLvl;
                
                let canEnter = this.bypassRequirements; // Default to bypass if active
                if (!canEnter) {
                if (targetMap === 4) {
                    const totalFishTypes = Object.keys(SPRITE_DATA).length;
                    const caughtCount = Object.keys(player.caughtFishCounts).length;
                    if (player.boatLevel >= nextMapReq && caughtCount >= totalFishTypes) {
                        canEnter = true;
                    } else {
                        boat.x = currentMapLength; // block
                        boat.vx = 0;
                        if (uiManager) {
                            if (player.boatLevel < nextMapReq) {
                                uiManager.showNotification(`Need Level ${nextMapReq} Boat to sail further!`);
                            } else {
                                uiManager.showNotification(`Must catch all fish kinds in Almanac (Caught: ${caughtCount}/${totalFishTypes})`);
                            }
                        }
                    }
                } else {
                    if (player.boatLevel >= nextMapReq) {
                        canEnter = true;
                    } else {
                        boat.x = currentMapLength; // block
                        boat.vx = 0;
                        if (uiManager) {
                            uiManager.showNotification(`Need Level ${nextMapReq} Boat to sail further!`);
                        }
                    }
                    }
                }

                if (canEnter) {
                    this.active = true;
                    this.direction = 1;
                    this.sweepDir = 1;
                    this.pendingMapChange = targetMap;
                    const playerRel = player.x - boat.x;
                    this.pendingBoatX = MAP_TRANSITION_X_LEFT + 10;
                    this.pendingPlayerX = this.pendingBoatX + playerRel;
                    boat.vx = 0;
                }
            } else {
                boat.x = currentMapLength; // Edge of world
                boat.vx = 0;
            }
        } else if (boat.x < MAP_TRANSITION_X_LEFT && currentMap > 0) {
            this.active = true;
            this.direction = 1;
            this.sweepDir = -1;
            this.pendingMapChange = currentMap - 1;
            const playerRel = player.x - boat.x;
            this.pendingBoatX = MAPS[this.pendingMapChange].length - 50;
            this.pendingPlayerX = this.pendingBoatX + playerRel;
            boat.vx = 0;
        } else if (boat.x < MAP_TRANSITION_X_LEFT && currentMap === 0) {
            boat.x = MAP_TRANSITION_X_LEFT;
            boat.vx = 0;
        }
    }
}

export const transitionManager = new MapTransitionManager();
