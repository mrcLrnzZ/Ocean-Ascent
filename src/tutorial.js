const K = (label) => `<span class="tutorial-key">${label}</span>`;

const step = (num, heading, desc) => `
    <div class="tut-step">
        <span class="tut-step-num">${num}.</span>
        <div>
            <div class="tut-step-heading">${heading}</div>
            <div class="tut-step-desc">${desc}</div>
        </div>
    </div>
`;

/**
 * Tip / Note / Warning stamp box
 * @param {string} label
 * @param {string} desc
 * @param {string} color
 */
const tip = (label, desc, color = '#8a1010') => `
    <div class="tut-tip">
        <span class="tut-tip-label" style="color:${color};border-color:${color}55;">${label}</span>
        <span class="tut-tip-text">${desc}</span>
    </div>
`;

const pageTitle = (title, subtitle = '') => `
    <div class="tut-page-title">
        <div class="tut-chapter">${title}</div>
        ${subtitle ? `<div class="tut-subtitle">${subtitle}</div>` : ''}
    </div>
`;

const refRow = (label, keysHtml) => `
    <div class="tut-ref-row">
        <span class="tut-ref-label">${label}</span>
        <span class="tut-ref-keys">${keysHtml}</span>
    </div>
`;


const TUTORIAL_SPREADS = [

    /* ── SPREAD 1*/
    {
        left: `
            ${pageTitle('Sailing', 'Part I')}
            ${step('I',   'Toggle the Sail',
                `Press ${K('R')} to raise or lower the sail at any time.`)}
            ${step('II',  'Board Position',
                `Walk to the <em>right side</em> of the boat to reach the helm.`)}
            ${step('III', 'Enable Sailing',
                `Press ${K('E')} at the right side of the boat to begin sailing.`)}
        `,
        right: `
            ${pageTitle('Sailing', 'Part II')}
            ${step('IV', 'Steer the Boat',
                `Use ${K('◀')} ${K('▶')} Arrow Keys to navigate left and right.`)}
            ${tip('Tip',
                `You must stand at the <em>right side</em> of the boat —
                 only then does ${K('E')} activate sailing mode.`)}
            ${tip('Note',
                `Press ${K('R')} at any time to unsail and return to foot travel.`,
                '#4a3018')}
        `
    },

    /* ── SPREAD 2 :*/
    {
        left: `
            ${pageTitle('Fishing', 'Part I — Setup')}
            ${step('I',   'Disable Sailing',
                `Press ${K('E')} to exit sailing mode before you can fish.`)}
            ${step('II',  'Change Position',
                `Walk to the <em>left side</em> of the boat — the fishing spot.`)}
            ${step('III', 'Enable Fishing',
                `Press ${K('E')} at the left side of the boat to enter fishing mode.`)}
        `,
        right: `
            ${pageTitle('Fishing', 'Part II — Casting')}
            ${step('IV', 'Charge the Throw',
                `Hold ${K('SPACE')} to build power, then release to cast.
                 The longer you hold, the farther the line flies.`)}
            ${step('V',  'Aim the Cast',
                `Use ${K('◀')} ${K('▶')} Arrow Keys to aim before releasing.`)}
            ${tip('Note',
                'Sailing must be fully disabled before fishing mode can be activated.')}
        `
    },

    /* ── SPREAD 3 */
    {
        left: `
            ${pageTitle('The Line', 'Controlling Depth')}
            ${step('I',  'Reel Upward',
                `Press ${K('▲')} to pull the line toward the surface.`)}
            ${step('II', 'Sink Deeper',
                `Press ${K('▼')} to let the line descend into deeper waters.`)}
            ${tip('Tip',
                'Rarer fish dwell far below. Let the line sink past the shallows.',
                '#4a3018')}
        `,
        right: `
            ${pageTitle('The Catch', 'Reeling In')}
            ${step('III', 'Wait for a Bite',
                `Keep the line steady. The rod signals when a fish has taken the bait.`)}
            ${step('IV',  'Secure the Catch',
                `Rapidly mash ${K('F')} to reel in before the fish escapes.`)}
            ${tip('Warning',
                'The reel bar drains quickly once a fish bites. Act immediately or lose the catch.')}
        `
    },

    /* ── SPREAD 4  */
    {
        left: `
            ${pageTitle('Quick Reference', 'All Controls')}
            <div class="tut-ref-table">
                ${refRow('Toggle Sail',       K('R'))}
                ${refRow('Interact / Mode',   K('E'))}
                ${refRow('Steer &amp; Aim',   K('◀') + K('▶'))}
                ${refRow('Reel Up / Sink',    K('▲') + K('▼'))}
                ${refRow('Charge Cast',       K('SPACE'))}
                ${refRow('Catch Fish',        K('F') + K('F') + K('F'))}
            </div>
        `,
        right: `
            ${pageTitle("The Fisher's Creed", 'A Closing Word')}
            <div class="tut-creed">
                <div class="tut-creed-text">
                    Sail to the depths.<br>
                    Cast with patience.<br>
                    Reel with purpose.<br><br>
                    <em>The sea rewards<br>those who persist.</em>
                </div>
            </div>
            ${tip('Begin',
                'Close this guide and set sail. The ocean awaits — and it does not wait long.')}
        `
    }

];


export class TutorialManager {

    constructor() {
        this.page   = 0;
        this.total  = TUTORIAL_SPREADS.length;
        this._audio = null;
    }

    /** Call once from UIManager.init() after audio is ready */
    init(audioRef) {
        this._audio = audioRef;
    }

    _play(sound) {
        this._audio?.play(sound);
    }

    /** Open the tutorial popup */
    open() {
    this.page = 0;
    window.changeTutorialPage = (dir) => this.changePage(dir);
    this._render();
    document.getElementById('tutorial-popup').style.display = 'flex';
    this._play('click');
}

    close() {
        document.getElementById('tutorial-popup').style.display = 'none';
        this._play('click');
    }

    /** Turn to the next or previous spread */
    changePage(dir) {
        const next = this.page + dir;
        if (next < 0 || next >= this.total) return;
        this.page = next;
        this._render();
        this._play('click');
    }

    /** Inject content and update nav buttons */
    _render() {
        const spread  = TUTORIAL_SPREADS[this.page];
        const leftEl  = document.getElementById('tutorial-left');
        const rightEl = document.getElementById('tutorial-right');

        leftEl.innerHTML  = spread.left;
        rightEl.innerHTML = spread.right;

        [leftEl, rightEl].forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight;
            el.style.animation = 'tutPageIn .35s ease both';
        });

        document.getElementById('tutorial-page-num').textContent =
            `${this.page + 1} / ${this.total}`;

        const btnPrev = document.getElementById('tut-btn-prev');
        const btnNext = document.getElementById('tut-btn-next');
        if (btnPrev) btnPrev.disabled = this.page === 0;
        if (btnNext) btnNext.disabled = this.page === this.total - 1;
    }
}
