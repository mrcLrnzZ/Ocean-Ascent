// src/almanac.js
import { SPRITE_DATA } from './fish.js';
import { audio } from './main.js';

export class AlmanacManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.almanacPage = 0;

        // Bind for window-level access
        window.closeAlmanacUI = this.closeAlmanacUI.bind(this);
        window.changeAlmanacPage = this.changeAlmanacPage.bind(this);
    }

    openAlmanacUI() {
        this.uiManager.isOpen = true;
        this.almanacPage = 0;
        document.getElementById('almanac-popup').style.display = 'flex';
        this.renderAlmanacPage();
        audio.play('click');
    }

    closeAlmanacUI() {
        document.getElementById('almanac-popup').style.display = 'none';
        setTimeout(() => this.uiManager.isOpen = false, 100);
        audio.play('click');
    }

    changeAlmanacPage(dir) {
    const left = document.getElementById('left-page');
    const right = document.getElementById('right-page');

    // Determine which page should flip
        if (dir > 0) {
            right.classList.add('flip-next');
        } else if (dir < 0) {
            left.classList.add('flip-prev');
        }

    // Delay page content update until flip animation completes
    setTimeout(() => {
        this.almanacPage += dir;
        if (this.almanacPage < 0) this.almanacPage = 0;
        if (this.almanacPage > this.maxPage) this.almanacPage = this.maxPage;
        this.renderAlmanacPage();

        // Clean up classes after animation
        left.classList.remove('flip-prev', 'flip-next');
        right.classList.remove('flip-next', 'flip-prev');
    }, 800); // match your CSS transition duration

    audio.play('nextpage');
}

    renderAlmanacPage() {
        const leftPage = document.getElementById('left-page');
        const rightPage = document.getElementById('right-page');
        if (!leftPage || !rightPage) return;

        const fishKeys = Object.keys(SPRITE_DATA);

        // 🔥 NEW: 2 fishes per page
        const totalPages = Math.ceil(fishKeys.length / 2);
        this.maxPage = totalPages - 1;

        const leftIndex = this.almanacPage * 2;
        const rightIndex = this.almanacPage * 2 + 1;

        const leftFish = fishKeys[leftIndex];
        const rightFish = fishKeys[rightIndex];

        this.renderEntry(leftPage, leftFish);
        this.renderEntry(rightPage, rightFish);

        // Update footer
        const pageDisplay = document.getElementById('almanac-page-num');
            if (pageDisplay) {
                pageDisplay.innerText = `${this.almanacPage + 1} / ${totalPages}`;
            }
    }
    renderEntry(container, fishId) {
        
        if (!fishId) {
            container.innerHTML = '';
            return;
        }

        const data = SPRITE_DATA[fishId];
        // Inventory is now an array of {type, ...} objects; count matches
        const inv   = this.uiManager.player.inventory;
        const count = Array.isArray(inv) ? inv.filter(f => f.type === fishId).length : (inv[fishId] || 0);
        const hasCaught = count > 0;
        const scale = data.scale || 1;

        container.innerHTML = `
            <div class="almanac-entry ${hasCaught ? data.rarity : 'unknown'}">

                <div class="fish-card">
                    <div class="fish-image">
                        <img src="${data.almanacSrc}" alt="${hasCaught ? data.name : 'Unknown'}" style="transform: scale(${scale})">
                    </div>

                    <div class="fish-info">
                        <div class="fish-name">
                            ${hasCaught ? data.name : '???'}
                        </div>

                        <div class="fish-desc">
                            ${hasCaught ? data.desc : 'Unknown species. Catch it to reveal its secrets.'}
                        </div>

                        ${hasCaught ? `<div class="fish-count">Caught: ${count}</div>` : ''}
                    </div>
                </div>

            </div>
        `;
        if(hasCaught) {
            const frame = container.querySelector('.fish-image');
            frame.classList.add(data.rarity); // legendary, epic, etc.
        }
    }
}
