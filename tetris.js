        const canvas = document.getElementById('tetrisCanvas');
        const ctx = canvas.getContext('2d');
        const ROWS = 20;
        const COLS = 10;
        const BLOCK_SIZE = canvas.width / COLS;

        
        const SHAPES = [
            [], 
            [
                [1, 1, 1, 1] 
            ],
            [
                [1, 1],
                [1, 1] 
            ],
            [
                [1, 1, 1],
                [0, 1, 0] 
            ],
            [
                [1, 1, 0],
                [0, 1, 1] 
            ],
            [
                [0, 1, 1],
                [1, 1, 0] 
            ],
            [
                [1, 1, 1],
                [1, 0, 0] 
            ],
            [
                [1, 1, 1],
                [0, 0, 1] 
            ]
        ];

        
        const COLORS = [
            'cyan',    
            'yellow',  
            'purple',  
            'green',   
            'red',     
            'orange',  
            'blue'     
        ];

        
        let board = [];

        
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
                        boardY < ROWS &&
                        boardX >= 0 &&
                        boardX < COLS &&
                        (boardY < 0 || board[boardY][boardX] === 0)
                    );
                });
            });
        }

        
        function mergeTetromino(shape, offsetX, offsetY) {
            shape.forEach((row, y) => {
                row.forEach((block, x) => {
                    if (block) {
                        board[offsetY + y][offsetX + x] = shape[y][x];
                    }
                });
            });
        }

        
        function dropTetromino(shape, offsetX, offsetY, color) {
            while (isValidPosition(shape, offsetX, offsetY + 1)) {
                offsetY++;
            }
            drawTetromino(shape, offsetX, offsetY, color);
            mergeTetromino(shape, offsetX, offsetY);
            drawBoard();
        }

        
        function initGame() {
            initBoard();
            drawBoard();
        }

        
        initGame();

        
        function randomTetromino() {
            let shapeIdx = Math.floor(Math.random() * SHAPES.length);
            return {
                shape: SHAPES[shapeIdx],
                color: COLORS[shapeIdx],
                offsetX: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIdx][0].length / 2),
                offsetY: 0
            };
        }

        let currentTetromino = randomTetromino();

        
        function moveLeft() {
            if (isValidPosition(currentTetromino.shape, currentTetromino.offsetX - 1, currentTetromino.offsetY)) {
                currentTetromino.offsetX--;
                drawBoard();
                drawTetromino(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY, currentTetromino.color);
            }
        }

        
        function moveRight() {
            if (isValidPosition(currentTetromino.shape, currentTetromino.offsetX + 1, currentTetromino.offsetY)) {
                currentTetromino.offsetX++;
                drawBoard();
                drawTetromino(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY, currentTetromino.color);
            }
        }

        
        function rotateClockwise() {
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
            if (isValidPosition(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY + 1)) {
                currentTetromino.offsetY++;
                drawBoard();
                drawTetromino(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY, currentTetromino.color);
            } else {
                mergeTetromino(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY);
                currentTetromino = randomTetromino();
                if (!isValidPosition(currentTetromino.shape, currentTetromino.offsetX, currentTetromino.offsetY)) {
                    
                    alert("Game Over!");
                    initGame();
                }
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
