// src/mechanics.js
// ════════════════════════════════════════════════════════════
//  MechanicsManager — all content, rendering, and page logic
//  for the Game Mechanics popup.
//  Reuses all tutorial CSS classes (tut-step, tut-tip, etc.)
//  and the same almanac-container shell.
// ════════════════════════════════════════════════════════════


const pageTitle = (title, subtitle = '') => `
    <div class="tut-page-title">
        <div class="tut-chapter">${title}</div>
        ${subtitle ? `<div class="tut-subtitle">${subtitle}</div>` : ''}
    </div>
`;

const section = (heading, paragraphs) => `
    <div class="tut-step">
        <div>
            <div class="tut-step-heading">${heading}</div>
            ${paragraphs.map(p => `<div class="tut-step-desc" style="margin-bottom:5px;">${p}</div>`).join('')}
        </div>
    </div>
`;

const bullet = (items) => `
    <div class="tut-bullet-list">
        ${items.map(item => `
            <div class="tut-bullet-item">
                <span class="tut-bullet-icon">◆</span>
                <span class="tut-step-desc">${item}</span>
            </div>
        `).join('')}
    </div>
`;

const tip = (label, desc, color = '#8a1010') => `
    <div class="tut-tip">
        <span class="tut-tip-label" style="color:${color};border-color:${color}55;">${label}</span>
        <span class="tut-tip-text">${desc}</span>
    </div>
`;

const loopStep = (num, text) => `
    <div class="tut-loop-step">
        <span class="tut-loop-num">${num}.</span>
        <span class="tut-step-desc" style="font-style:normal;">${text}</span>
    </div>
`;


const MECHANICS_SPREADS = [

    /* ── SPREAD 1 : Almanac & Bag ───────────────────────── */
    {
        left: `
            ${pageTitle('Almanac System', 'Collection Tracker')}
            ${section('How It Works', [
                'The Almanac acts as a collection tracker in the game. At the start, it is completely empty.'
            ])}
            ${bullet([
                'Fish entries are automatically unlocked once the player catches them.',
                'Each discovered fish displays its name, image, and basic details.',
                'Encourages players to explore different areas and complete their collection.',
            ])}
            ${tip('Tip', 'The more you explore, the more entries you unlock. Rare fish only appear in deeper zones.', '#4a3018')}
        `,
        right: `
            ${pageTitle('Bag System', 'Inventory Interface')}
            ${section('How It Works', [
                'The Bag serves as the player\'s inventory interface. All caught fish are stored here in real time.'
            ])}
            ${bullet([
                'All caught fish are stored here in real time.',
                'Consume fish to restore hunger and energy.',
                'Sell fish to earn in-game currency.',
                'Inventory updates dynamically without reloading.',
            ])}
            ${tip('Note', 'Keep an eye on your hunger. If it runs out, it\'s game over — eat before it\'s too late.')}
        `
    },

    /* ── SPREAD 2 : Merchants ───────────────────────────── */
    {
        left: `
            ${pageTitle('Rod Merchant', 'Fishing Upgrades')}
            ${section('Overview', [
                'Allows players to upgrade their fishing rod using in-game currency.'
            ])}
            ${bullet([
                'Higher rod levels unlock the ability to catch rarer or larger fish.',
                'Includes a quest system where players assist the merchant in reaching a destination.',
                'Adds narrative and progression depth to the upgrade path.',
            ])}
            ${tip('Tip', 'Invest in your rod early — better rods open up a wider range of catchable fish.', '#4a3018')}
        `,
        right: `
            ${pageTitle('Boat Merchant', 'Zone Unlocks')}
            ${section('Overview', [
                'Provides boat upgrades up to Level 3. Each upgrade unlocks new fishing zones on the map.'
            ])}
            ${bullet([
                'Each upgrade unlocks new fishing zones on the map.',
                'Certain fish can only be caught in specific locations.',
                'Boat upgrades are essential for progressing to end-game content.',
            ])}
            ${tip('Note', 'Some fish are exclusive to deeper or remote zones — you will need a better boat to reach them.')}
        `
    },

    /* ── SPREAD 3 : Core Loop ───────────────────────────── */
    {
        left: `
            ${pageTitle('Gameplay Loop', 'Core Progression')}
            <div style="display:flex; flex-direction:column; width:100%; margin-top:4px;">
                ${loopStep(1, 'Player explores fishing areas.')}
                ${loopStep(2, 'Catches fish using rod and reel.')}
                ${loopStep(3, 'Fish is added to the Bag inventory.')}
                ${loopStep(4, 'Fish is recorded in the Almanac.')}
                ${loopStep(5, 'Player chooses to <em>Eat</em> (survive) or <em>Sell</em> (earn money).')}
                ${loopStep(6, 'Use money to upgrade the Rod or Boat.')}
                ${loopStep(7, 'Repeat loop for continued progression.')}
            </div>
        `,
        right: `
            ${pageTitle('The Cycle', 'A Closing Word')}
            <div class="tut-creed">
                <div class="tut-creed-text">
                    Explore the waters.<br>
                    Fill your bag.<br>
                    Record your catches.<br>
                    Upgrade your tools.<br><br>
                    <em>Every fish caught<br>is a step toward mastery.</em>
                </div>
            </div>
            ${tip('Remember', 'Survival and progression go hand in hand. Eat to survive, sell to grow, upgrade to conquer.')}
        `
    }

];


export class MechanicsManager {

    constructor() {
        this.page   = 0;
        this.total  = MECHANICS_SPREADS.length;
        this._audio = null;
    }

    init(audioRef) {
        this._audio = audioRef;
    }

    _play(sound) {
        this._audio?.play(sound);
    }

    open() {
        this.page = 0;
        window.changeMechanicsPage = (dir) => this.changePage(dir);
        this._render();
        document.getElementById('mechanics-popup').style.display = 'flex';
        this._play('click');
    }

    close() {
        document.getElementById('mechanics-popup').style.display = 'none';
        this._play('click');
    }

    changePage(dir) {
        const next = this.page + dir;
        if (next < 0 || next >= this.total) return;
        this.page = next;
        this._render();
        this._play('click');
    }

    _render() {
        const spread  = MECHANICS_SPREADS[this.page];
        const leftEl  = document.getElementById('mechanics-left');
        const rightEl = document.getElementById('mechanics-right');

        leftEl.innerHTML  = spread.left;
        rightEl.innerHTML = spread.right;

        [leftEl, rightEl].forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight;
            el.style.animation = 'tutPageIn .35s ease both';
        });

        document.getElementById('mechanics-page-num').textContent =
            `${this.page + 1} / ${this.total}`;

        const btnPrev = document.getElementById('mech-btn-prev');
        const btnNext = document.getElementById('mech-btn-next');
        if (btnPrev) btnPrev.disabled = this.page === 0;
        if (btnNext) btnNext.disabled = this.page === this.total - 1;
    }
}
