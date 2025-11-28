// Slot Machine Game

// Symbols and their weights (higher = more common)
const SYMBOLS = [
    { symbol: '🍒', weight: 30, name: 'cherry' },
    { symbol: '🍋', weight: 25, name: 'lemon' },
    { symbol: '🍊', weight: 20, name: 'orange' },
    { symbol: '🍇', weight: 15, name: 'grape' },
    { symbol: '⭐', weight: 10, name: 'star' },
    { symbol: '🔔', weight: 8, name: 'bell' },
    { symbol: '🍀', weight: 5, name: 'clover' },
    { symbol: '7️⃣', weight: 3, name: 'seven' },
    { symbol: '💎', weight: 2, name: 'diamond' }
];

// Payouts for matching symbols (multiplier of bet)
const PAYOUTS = {
    'diamond': 100,
    'seven': 50,
    'clover': 25,
    'bell': 20,
    'star': 15,
    'grape': 10,
    'orange': 8,
    'lemon': 5,
    'cherry': 3
};

// Game state
let credits = 100;
let bet = 10;
let isSpinning = false;
let canHold = false;
let holdUsed = false;
let currentResults = [null, null, null];
let heldReels = [false, false, false];

// DOM elements
const reels = [
    document.getElementById('reel1'),
    document.getElementById('reel2'),
    document.getElementById('reel3')
];
const holdButtons = [
    document.getElementById('hold1'),
    document.getElementById('hold2'),
    document.getElementById('hold3')
];
const creditsDisplay = document.getElementById('credits');
const betDisplay = document.getElementById('bet-amount');
const spinButton = document.getElementById('spin-btn');
const betUpButton = document.getElementById('bet-up');
const betDownButton = document.getElementById('bet-down');
const messageDisplay = document.getElementById('message');
const winLine = document.querySelector('.win-line');

// Create weighted symbol pool for random selection
function createSymbolPool() {
    const pool = [];
    SYMBOLS.forEach(item => {
        for (let i = 0; i < item.weight; i++) {
            pool.push(item);
        }
    });
    return pool;
}

const symbolPool = createSymbolPool();

// Get random symbol from weighted pool
function getRandomSymbol() {
    return symbolPool[Math.floor(Math.random() * symbolPool.length)];
}

// Generate a strip of symbols for animation
function generateStrip(finalSymbol, count = 20) {
    const strip = [];
    for (let i = 0; i < count - 1; i++) {
        strip.push(getRandomSymbol());
    }
    strip.push(finalSymbol);
    return strip;
}

// Update the display
function updateDisplay() {
    creditsDisplay.textContent = credits;
    betDisplay.textContent = bet;

    // Disable spin if not enough credits (but allow free re-spin with holds)
    const needsCredits = !canHold || holdUsed;
    spinButton.disabled = (needsCredits && credits < bet) || isSpinning;

    // Update spin button text
    if (canHold && !holdUsed && heldReels.some(h => h)) {
        spinButton.querySelector('span').textContent = 'RESPIN';
    } else {
        spinButton.querySelector('span').textContent = 'SPIN';
    }

    // Disable bet buttons during spin or when holds are active
    betUpButton.disabled = isSpinning || canHold;
    betDownButton.disabled = isSpinning || canHold;

    // Update hold buttons
    holdButtons.forEach((btn, i) => {
        btn.disabled = !canHold || isSpinning;
        if (heldReels[i]) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Show message
function showMessage(text, type = '') {
    messageDisplay.textContent = text;
    messageDisplay.className = 'message ' + type;
}

// Spin a single reel
function spinReel(reel, finalSymbol, duration, delay) {
    return new Promise(resolve => {
        setTimeout(() => {
            const strip = generateStrip(finalSymbol, 15);
            const reelStrip = reel.querySelector('.reel-strip');

            // Clear and populate reel strip
            reelStrip.innerHTML = '';
            strip.forEach(item => {
                const symbolDiv = document.createElement('div');
                symbolDiv.className = 'symbol';
                symbolDiv.textContent = item.symbol;
                reelStrip.appendChild(symbolDiv);
            });

            // Start from top
            const symbolHeight = reel.offsetHeight;
            const totalHeight = symbolHeight * strip.length;
            reelStrip.style.transition = 'none';
            reelStrip.style.transform = `translateY(0)`;

            // Add spinning class for blur effect
            reel.classList.add('spinning');

            // Force reflow
            reelStrip.offsetHeight;

            // Animate to final position
            reelStrip.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
            reelStrip.style.transform = `translateY(-${totalHeight - symbolHeight}px)`;

            // Clean up after animation
            setTimeout(() => {
                reel.classList.remove('spinning');

                // Keep only the final symbol
                reelStrip.innerHTML = '';
                const finalDiv = document.createElement('div');
                finalDiv.className = 'symbol';
                finalDiv.textContent = finalSymbol.symbol;
                reelStrip.appendChild(finalDiv);
                reelStrip.style.transition = 'none';
                reelStrip.style.transform = 'translateY(0)';

                resolve();
            }, duration);
        }, delay);
    });
}

// Calculate winnings
function calculateWin(results) {
    const symbols = results.map(r => r.name);

    // Check for three of a kind
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
        const multiplier = PAYOUTS[symbols[0]];
        return {
            win: bet * multiplier,
            type: symbols[0] === 'diamond' ? 'jackpot' : 'win',
            message: symbols[0] === 'diamond' ? '💎 JACKPOT! 💎' : `${results[0].symbol} ${results[0].symbol} ${results[0].symbol} WINS!`
        };
    }

    // Check for two cherries (small win)
    const cherryCount = symbols.filter(s => s === 'cherry').length;
    if (cherryCount === 2) {
        return {
            win: bet * 2,
            type: 'win',
            message: '🍒🍒 Two Cherries!'
        };
    }

    return { win: 0, type: 'lose', message: '' };
}

// Show win line animation
function showWinLine(show) {
    if (show) {
        winLine.classList.add('show');
    } else {
        winLine.classList.remove('show');
    }
}

// Create confetti celebration
function celebrate() {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    document.body.appendChild(celebration);

    const colors = ['#ffd700', '#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animation = `confetti-fall ${2 + Math.random() * 2}s linear ${Math.random() * 0.5}s forwards`;
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        celebration.appendChild(confetti);
    }

    setTimeout(() => {
        celebration.remove();
    }, 4000);
}

// Toggle hold for a reel
function toggleHold(index) {
    if (!canHold || isSpinning) return;
    heldReels[index] = !heldReels[index];
    updateDisplay();
}

// Reset hold state
function resetHolds() {
    canHold = false;
    holdUsed = false;
    heldReels = [false, false, false];
    updateDisplay();
}

// Main spin function
async function spin() {
    if (isSpinning) return;

    // Check if this is a free re-spin with holds
    const isRespin = canHold && !holdUsed && heldReels.some(h => h);

    if (!isRespin) {
        // Regular spin - need credits
        if (credits < bet) return;

        // Reset holds for new spin
        resetHolds();

        // Deduct bet
        credits -= bet;
    } else {
        // Mark hold as used for this round
        holdUsed = true;
        canHold = false;
    }

    isSpinning = true;
    spinButton.classList.add('spinning');
    showWinLine(false);
    showMessage('');
    updateDisplay();

    // Generate final results (keep held reels)
    const results = [
        heldReels[0] ? currentResults[0] : getRandomSymbol(),
        heldReels[1] ? currentResults[1] : getRandomSymbol(),
        heldReels[2] ? currentResults[2] : getRandomSymbol()
    ];

    // Spin only non-held reels
    const spinPromises = [];
    for (let i = 0; i < 3; i++) {
        if (!heldReels[i]) {
            spinPromises.push(spinReel(reels[i], results[i], 1000 + i * 200, i * 200));
        }
    }

    if (spinPromises.length > 0) {
        await Promise.all(spinPromises);
    }

    // Store current results
    currentResults = results;

    // Small delay before showing results
    await new Promise(resolve => setTimeout(resolve, 200));

    // Calculate and apply winnings
    const result = calculateWin(results);

    if (result.win > 0) {
        credits += result.win;
        showWinLine(true);
        showMessage(`${result.message} +${result.win}`, result.type);

        if (result.type === 'jackpot') {
            celebrate();
        }

        // Reset holds after a win
        heldReels = [false, false, false];
        holdUsed = true;
    } else {
        // No win - enable holds if not already used
        if (!holdUsed) {
            canHold = true;
            showMessage('Hold reels and RESPIN, or SPIN again!', '');
        } else {
            showMessage('Try again!', 'lose');
            heldReels = [false, false, false];
        }
    }

    // Check for game over
    if (credits <= 0 && (holdUsed || !heldReels.some(h => h))) {
        setTimeout(() => {
            showMessage('GAME OVER - Refreshing...', 'lose');
            setTimeout(() => {
                credits = 100;
                bet = 10;
                resetHolds();
                showMessage('New game! Good luck!', '');
            }, 2000);
        }, 1000);
    }

    isSpinning = false;
    spinButton.classList.remove('spinning');
    updateDisplay();
}

// Adjust bet
function adjustBet(delta) {
    if (canHold) return; // Can't change bet while holds active
    const newBet = bet + delta;
    if (newBet >= 5 && newBet <= Math.min(50, credits)) {
        bet = newBet;
        updateDisplay();
    }
}

// Event listeners
spinButton.addEventListener('click', spin);
betUpButton.addEventListener('click', () => adjustBet(5));
betDownButton.addEventListener('click', () => adjustBet(-5));

// Hold button listeners
holdButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => toggleHold(i));
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isSpinning) {
        e.preventDefault();
        spin();
    }
    // Number keys 1-3 to toggle holds
    if (canHold && !isSpinning) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') toggleHold(0);
        if (e.code === 'Digit2' || e.code === 'Numpad2') toggleHold(1);
        if (e.code === 'Digit3' || e.code === 'Numpad3') toggleHold(2);
    }
});

// Initialize
updateDisplay();
showMessage('Press SPIN or SPACE to play!', '');
