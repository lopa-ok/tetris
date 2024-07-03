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
    'cyan',    // I shape
    'yellow',  // O shape
    'purple',  // T shape
    'green',   // S shape
    'red',     // Z shape
    'orange',  // L shape
    'blue'     // J shape
];


let board = [];


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
}


initGame();


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

let currentTetromino = randomTetromino();
let gameOver = false;
let score = 0;

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


function dropTetrominoContinuous() {
    if (gameOver) return;
    if (isValidPosition(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY + 1)) {
        currentTetromino.offsetY++;
        drawBoard();
        drawTetromino(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY, currentTetromino.color);
    } else {
        mergeTetromino(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY, currentTetromino.colorIdx);
        let linesCleared = removeFullLines();
        updateScore(linesCleared);
        currentTetromino = randomTetromino();
        if (!isValidPosition(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY)) {
            playGameOverSound();
            alert("Game Over! Your score: " + score);
            gameOver = true;
            initGame();
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
    return linesCleared;
}

function updateScore(linesCleared) {
    if (linesCleared > 0) {
        score += linesCleared * 100;
        document.getElementById('score').innerText = 'Score: ' + score;
        playLineClearSound();
    }
}

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        moveLeft();
    } else if (event.key === 'ArrowRight') {
        moveRight();
    } else if (event.key === 'ArrowDown') {
        dropTetrominoContinuous();
    } else if (event.key === 'ArrowUp') {
        rotateClockwise();
    }
});


setInterval(dropTetrominoContinuous, 1000);
