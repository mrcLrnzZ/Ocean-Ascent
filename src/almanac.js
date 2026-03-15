// src/almanac.js
import { SPRITE_DATA } from './fish.js';
import { audio } from './main.js';

export class AlmanacManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.almanacPage = 0;
        this.maxPage = 4; // 15 fishes / 3 per page = 5 pages (0-4)

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
        this.almanacPage += dir;
        if (this.almanacPage < 0) this.almanacPage = 0;
        if (this.almanacPage > this.maxPage) this.almanacPage = this.maxPage;
        this.renderAlmanacPage();
        audio.play('nextpage');
    }

    renderAlmanacPage() {
        const grid = document.getElementById('almanac-grid');
        if (!grid) return;
        grid.innerHTML = ''; // clear previous

        const fishKeys = Object.keys(SPRITE_DATA);
        const startIndex = this.almanacPage * 3;
        const pageFishes = fishKeys.slice(startIndex, startIndex + 3);

        pageFishes.forEach((fishId, index) => {
            const data = SPRITE_DATA[fishId];
            const count = this.uiManager.player.inventory[fishId] || 0;
            const hasCaught = count > 0;
            const isReversed = index === 1; // 2nd row is reversed

            const row = document.createElement('div');
            row.className = `almanac-row ${hasCaught ? data.rarity : 'unknown'} ${isReversed ? 'reverse' : ''}`;

            row.innerHTML = `
                <div class="almanac-img-col">
                    <img src="${data.almanacSrc}" alt="${hasCaught ? data.name : 'Unknown'}">
                    <div class="fish-count">Caught: ${count}</div>
                </div>
                <div class="almanac-desc-col">
                    <div class="fish-name">${hasCaught ? data.name : '???'}</div>
                    <div class="fish-desc">${hasCaught ? data.desc : 'Unknown species. Catch it to reveal its secrets.'}</div>
                </div>
            `;

            grid.appendChild(row);
        });

        const pageDisplay = document.getElementById('almanac-page-num');
        if (pageDisplay) pageDisplay.innerText = `${this.almanacPage + 1} / 5`;
    }
}
