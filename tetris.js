const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = canvas.width / COLS;


const SHAPES = [
    [], 
    [
        [1, 1, 1, 1] // I shape
    ],
    [
        [1, 1],
        [1, 1] // O shape
    ],
    [
        [1, 1, 1],
        [0, 1, 0] // T shape
    ],
    [
        [1, 1, 0],
        [0, 1, 1] // S shape
    ],
    [
        [0, 1, 1],
        [1, 1, 0] // Z shape
    ],
    [
        [1, 1, 1],
        [1, 0, 0] // L shape
    ],
    [
        [1, 1, 1],
        [0, 0, 1] // J shape
    ]
];


const COLORS = [
    '#F7B267', // I shape - warm pastel orange
    '#D4E2D4', // O shape - soft green (from your palette)
    '#ECB390', // T shape - soft peach (from your palette)
    '#DF7861', // S shape - coral (from your palette)
    '#A7C7E7', // Z shape - pastel blue
    '#B5C99A', // L shape - muted green
    '#B084CC'  // J shape - pastel purple
];


let board = [];
let currentTetromino;
let nextTetromino; // Add this
let gameOver = false;
let score = 0;
let intervalId = null;
let paused = false;
let highscore = localStorage.getItem('tetrisHighscore') ? parseInt(localStorage.getItem('tetrisHighscore')) : 0;


const lineClearSound = new Audio('line_clear.wav');
const gameOverSound = new Audio('ggs.wav');

function playLineClearSound() {
    lineClearSound.currentTime = 0;
    lineClearSound.play();
}

function playGameOverSound() {
    gameOverSound.currentTime = 0;
    gameOverSound.play();
}

function initBoard() {
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
}


function drawSquare(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}


function drawBoard() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawSquare(col, row, COLORS[board[row][col] - 1]);
            } else {
                drawSquare(col, row, 'white');
            }
        }
    }
}


function drawTetromino(shape, offsetX, offsetY, color) {
    shape.forEach((row, y) => {
        row.forEach((block, x) => {
            if (block) {
                drawSquare(offsetX + x, offsetY + y, color);
            }
        });
    });
}


function isValidPosition(shape, offsetX, offsetY) {
    return shape.every((row, y) => {
        return row.every((block, x) => {
            let boardX = offsetX + x;
            let boardY = offsetY + y;
            return (
                block === 0 ||
                (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS && board[boardY][boardX] === 0)
            );
        });
    });
}


function mergeTetromino(shape, offsetX, offsetY, colorIdx) {
    shape.forEach((row, y) => {
        row.forEach((block, x) => {
            if (block) {
                board[offsetY + y][offsetX + x] = colorIdx + 1;
            }
        });
    });
}


function initGame() {
    initBoard();
    drawBoard();
    nextTetromino = randomTetromino(); // Initialize next shape
    currentTetromino = randomTetromino();
    gameOver = false;
    score = 0;
    document.getElementById('score').innerText = 'Score: ' + score;
    drawNextShape();
    // Clear previous interval if any
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(dropTetrominoContinuous, 1000);
}



function randomTetromino() {
    let shapeIdx = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
    return {
        shape: SHAPES[shapeIdx],
        color: COLORS[shapeIdx - 1],
        colorIdx: shapeIdx - 1,
        offsetX: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIdx][0].length / 2),
        offsetY: 0
    };
}


function moveLeft() {
    if (!gameOver && isValidPosition(currentTetromino.shape, currentTetromino.offsetX - 1, currentTetromino.offsetY)) {
        currentTetromino.offsetX--;
        drawBoard();
        drawTetromino(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY, currentTetromino.color);
    }
}


function moveRight() {
    if (!gameOver && isValidPosition(currentTetromino.shape, currentTetromino.offsetX + 1, currentTetromino.offsetY)) {
        currentTetromino.offsetX++;
        drawBoard();
        drawTetromino(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY, currentTetromino.color);
    }
}


function rotateClockwise() {
    if (gameOver) return;
    let rotatedShape = currentTetromino.shape[0].map((_, colIdx) =>
        currentTetromino.shape.map(row => row[colIdx]).reverse()
    );
    if (isValidPosition(rotatedShape, currentTetromino.offsetX, currentTetromino.offsetY)) {
        currentTetromino.shape = rotatedShape;
        drawBoard();
        drawTetromino(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY, currentTetromino.color);
    }
}


function drawNextShape() {
    const nextCanvas = document.getElementById('nextShapeCanvas');
    const nextCtx = nextCanvas.getContext('2d');
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextTetromino) return;

    const shape = nextTetromino.shape;
    const color = nextTetromino.color;

    // Find shape dimensions
    const shapeHeight = shape.length;
    const shapeWidth = shape[0].length;

    // Calculate block size to fit shape in canvas with padding
    const padding = 10;
    const availableWidth = nextCanvas.width - 2 * padding;
    const availableHeight = nextCanvas.height - 2 * padding;
    const blockSize = Math.min(
        Math.floor(availableWidth / shapeWidth),
        Math.floor(availableHeight / shapeHeight)
    );

    // Calculate offset to center the shape
    const totalShapeWidth = blockSize * shapeWidth;
    const totalShapeHeight = blockSize * shapeHeight;
    const offsetX = Math.floor((nextCanvas.width - totalShapeWidth) / 2);
    const offsetY = Math.floor((nextCanvas.height - totalShapeHeight) / 2);

    shape.forEach((row, y) => {
        row.forEach((block, x) => {
            if (block) {
                nextCtx.fillStyle = color;
                nextCtx.fillRect(offsetX + x * blockSize, offsetY + y * blockSize, blockSize, blockSize);
                nextCtx.strokeStyle = '#555';
                nextCtx.strokeRect(offsetX + x * blockSize, offsetY + y * blockSize, blockSize, blockSize);
            }
        });
    });
}


function dropTetrominoContinuous() {
    if (gameOver || paused) return;
    if (isValidPosition(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY + 1)) {
        currentTetromino.offsetY++;
        drawBoard();
        drawTetromino(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY, currentTetromino.color);
    } else {
        mergeTetromino(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY, currentTetromino.colorIdx);
        let linesCleared = removeFullLines();
        updateScore(linesCleared);
        currentTetromino = nextTetromino; // Use the next shape
        nextTetromino = randomTetromino(); // Generate a new next shape
        drawNextShape();
        if (!isValidPosition(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY)) {
            gameOver = true;
            gameOverSound.play();
            clearInterval(intervalId);
            setTimeout(() => {
                showGameOverMenu();
            }, 100);
        }
    }
}


function removeFullLines() {
    let linesCleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++;
        }
    }
    if (linesCleared > 0) {
        lineClearSound.play();
    }
    return linesCleared;
}


function updateScore(linesCleared) {
    if (linesCleared > 0) {
        score += linesCleared * 100;
        document.getElementById('score').innerText = 'Score: ' + score;
    }
}


// Show/hide start menu
function showStartMenu() {
    document.getElementById('startMenu').style.display = 'flex';
    document.getElementById('score').style.display = 'none';
    canvas.style.display = 'none';
}

function hideStartMenu() {
    document.getElementById('startMenu').style.display = 'none';
    document.getElementById('score').style.display = 'block';
    canvas.style.display = 'block';
}

function showPauseMenu() {
    document.getElementById('pauseMenu').style.display = 'flex';
}

function hidePauseMenu() {
    document.getElementById('pauseMenu').style.display = 'none';
}

function pauseGame() {
    if (!paused && !gameOver) {
        paused = true;
        clearInterval(intervalId);
        showPauseMenu();
    }
}

function resumeGame() {
    if (paused && !gameOver) {
        paused = false;
        hidePauseMenu();
        intervalId = setInterval(dropTetrominoContinuous, 1000);
    }
}

function showGameOverMenu() {
    document.getElementById('gameOverMenu').style.display = 'flex';
    document.getElementById('finalScore').innerText = 'Score: ' + score;
}

function hideGameOverMenu() {
    document.getElementById('gameOverMenu').style.display = 'none';
}


// --- Confetti effect ---
function launchConfetti() {
    const confettiCanvasId = 'confettiCanvas';
    let confettiCanvas = document.getElementById(confettiCanvasId);
    if (!confettiCanvas) {
        confettiCanvas = document.createElement('canvas');
        confettiCanvas.id = confettiCanvasId;
        confettiCanvas.style.position = 'fixed';
        confettiCanvas.style.top = 0;
        confettiCanvas.style.left = 0;
        confettiCanvas.style.width = '100vw';
        confettiCanvas.style.height = '100vh';
        confettiCanvas.style.pointerEvents = 'none';
        confettiCanvas.style.zIndex = 1000;
        document.body.appendChild(confettiCanvas);
    }
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    const ctx = confettiCanvas.getContext('2d');

    // Confetti particles
    const colors = ['#F7B267', '#D4E2D4', '#ECB390', '#DF7861', '#A7C7E7', '#B5C99A', '#B084CC'];
    const particles = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * -confettiCanvas.height,
            r: 6 + Math.random() * 6,
            d: 2 + Math.random() * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 5,
            tiltAngle: 0,
            tiltAngleIncremental: (Math.random() * 0.07) + 0.05
        });
    }

    let frame = 0;
    function drawConfetti() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        for (let i = 0; i < count; i++) {
            let p = particles[i];
            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
            ctx.stroke();
        }
        updateConfetti();
        frame++;
        if (frame < 120) {
            requestAnimationFrame(drawConfetti);
        } else {
            confettiCanvas.remove();
        }
    }

    function updateConfetti() {
        for (let i = 0; i < count; i++) {
            let p = particles[i];
            p.y += (Math.cos(frame / 10) + 3 + p.d) / 2;
            p.x += Math.sin(frame / 15);
            p.tiltAngle += p.tiltAngleIncremental;
            p.tilt = Math.sin(p.tiltAngle) * 15;
        }
    }

    drawConfetti();
}


document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        if (!paused) {
            pauseGame();
        } else {
            resumeGame();
        }
        return;
    }
    if (paused) return;
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        moveLeft();
    } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        moveRight();
    } else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
        dropTetrominoContinuous();
    } else if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
        rotateClockwise();
    }
});


// Start menu logic
window.addEventListener('DOMContentLoaded', () => {
    showStartMenu();
    document.getElementById('startButton').addEventListener('click', () => {
        hideStartMenu();
        initGame();
    });
    document.getElementById('resumeButton').addEventListener('click', () => {
        resumeGame();
    });
    document.getElementById('pauseRestartButton').addEventListener('click', () => {
        hidePauseMenu();
        initGame();
    });
    document.getElementById('restartButton').addEventListener('click', () => {
        hideGameOverMenu();
        initGame();
    });
});
