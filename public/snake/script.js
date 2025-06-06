const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set a fixed box size and calculate canvas size from it
const BOX_SIZE = 20;
const GRID_SIZE = 30;
canvas.width = canvas.height = BOX_SIZE * GRID_SIZE;

// Update box constant to use our fixed size
const box = BOX_SIZE;

// Speed system constants
const SPEED = {
    MAX: 100,    // Starting speed (slowest)
    MIN: 50,     // Fastest speed
    DECREMENT: 5, // How much to decrease by each food
    RANDOM_THRESHOLD: 200  // Score at which to switch to random speeds
};

let score = 0;
let speed = SPEED.MAX;
let snake = [{ x: box * 5, y: box * 5 }];
let direction = 'RIGHT';
let food = generateFood();
let gameLoop;
let moveQueue = []; // Queue for pending moves

const keyBuffer = [];
const MAX_BUFFER_SIZE = 2;

// Define valid U-turn patterns based on current direction
const uTurnPatterns = {
    'RIGHT': [['ArrowUp', 'ArrowLeft'], ['ArrowDown', 'ArrowLeft']],
    'LEFT': [['ArrowUp', 'ArrowRight'], ['ArrowDown', 'ArrowRight']],
    'UP': [['ArrowLeft', 'ArrowDown'], ['ArrowRight', 'ArrowDown']],
    'DOWN': [['ArrowLeft', 'ArrowUp'], ['ArrowRight', 'ArrowUp']]
};

function isUTurnPattern(keys, currentDirection) {
    if (keys.length !== 2) return false;

    const patterns = uTurnPatterns[currentDirection];
    if (!patterns) return false;

    // Check if the keys match any valid pattern (order doesn't matter for detection)
    return patterns.some(pattern =>
        (keys.includes(pattern[0]) && keys.includes(pattern[1]))
    );
}

function getUTurnSequence(keys, currentDirection) {
    const patterns = uTurnPatterns[currentDirection];
    if (!patterns) return null;

    // Find the matching pattern
    const matchingPattern = patterns.find(pattern =>
        keys.includes(pattern[0]) && keys.includes(pattern[1])
    );

    if (!matchingPattern) return null;

    // Return the sequence of moves needed for the U-turn
    return matchingPattern;
}

// Initialize all event listeners when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Notify parent window that game is ready
    window.parent.postMessage({ gameMessage: true, gameReady: true }, "*");

    // Add button event listeners
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', restartGame);

    // Add direction button listeners
    document.getElementById('upBtn').addEventListener('click', () => {
        const event = { key: 'ArrowUp' };
        changeDirection(event);
    });

    document.getElementById('downBtn').addEventListener('click', () => {
        const event = { key: 'ArrowDown' };
        changeDirection(event);
    });

    document.getElementById('leftBtn').addEventListener('click', () => {
        const event = { key: 'ArrowLeft' };
        changeDirection(event);
    });

    document.getElementById('rightBtn').addEventListener('click', () => {
        const event = { key: 'ArrowRight' };
        changeDirection(event);
    });

    // Add keyboard listener
    document.addEventListener('keydown', changeDirection);
});

function startGame() {
    score = 0;
    window.parent.postMessage({ gameMessage: true, gameStart: true }, "*")
    document.getElementById('startModal').style.display = 'none';
    gameLoop = setInterval(update, speed);
}

function generateFood() {
    let foodX, foodY;
    do {
        foodX = Math.floor((Math.random() * canvas.width) / box) * box;
        foodY = Math.floor((Math.random() * canvas.height) / box) * box;
    } while (snake.some(segment => segment.x === foodX && segment.y === foodY));
    return { x: foodX, y: foodY };
}

function changeDirection(event) {
    if (event.preventDefault) {
        event.preventDefault();
    }

    const key = event.key;

    const oppositeDirections = {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT'
    };

    const newDirection = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT'
    }[key];

    if (newDirection && newDirection !== oppositeDirections[direction]) {
        direction = newDirection;
    }

    moveQueue.push(direction);
}

function drawSnake() {
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#f04a64' : '#ffaf3d';
        ctx.fillRect(segment.x, segment.y, box, box);
        ctx.strokeStyle = '#161b22';
        ctx.strokeRect(segment.x, segment.y, box, box);
    });
}

function drawFood() {
    ctx.fillStyle = '#39e75f';
    ctx.beginPath();
    ctx.arc(food.x + box / 2, food.y + box / 2, box / 2.5, 0, Math.PI * 2);
    ctx.fill();
}

function moveSnake() {
    // If we have queued moves, process the next one
    if (moveQueue.length > 0) {
        const nextMove = moveQueue.shift();
        
        const oppositeDirections = {
            UP: 'DOWN',
            DOWN: 'UP',
            LEFT: 'RIGHT',
            RIGHT: 'LEFT'
        };

        console.log(nextMove, direction, oppositeDirections[direction])
    
        if (nextMove !== oppositeDirections[direction]) {
            direction = nextMove;
        }
    }

    const head = { ...snake[0] };
    if (direction === 'UP') head.y -= box;
    else if (direction === 'DOWN') head.y += box;
    else if (direction === 'LEFT') head.x -= box;
    else if (direction === 'RIGHT') head.x += box;

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('score').innerText = `Score: ${score}`;
        food = generateFood();
        
        // Update speed based on score
        if (score < SPEED.RANDOM_THRESHOLD) {
            // Steady decrement until threshold
            if (speed > SPEED.MIN) {
                speed -= SPEED.DECREMENT;
            }
        } else {
            speed = SPEED.MIN;
        }
        
        // Update game loop with new speed
        clearInterval(gameLoop);
        gameLoop = setInterval(update, speed);
    } else {
        snake.pop();
    }
}

function checkCollision() {
    const head = snake[0];
    if (
        head.x < 0 ||
        head.x >= canvas.width ||
        head.y < 0 ||
        head.y >= canvas.height ||
        snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
    ) {
        window.parent.postMessage({ gameMessage: true, score }, "*")
        document.getElementById('gameOver').style.display = 'block';
        clearInterval(gameLoop);
    }
}

function restartGame() {
    snake = [{ x: box * 5, y: box * 5 }];
    direction = 'RIGHT';
    score = 0;
    speed = SPEED.MAX;  // Reset to initial speed
    moveQueue = [];
    document.getElementById('score').innerText = `Score: 0`;
    document.getElementById('gameOver').style.display = 'none';
    food = generateFood();
    gameLoop = setInterval(update, speed);
    window.parent.postMessage({ gameMessage: true, gameStart: true }, "*")
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFood();
    moveSnake();
    drawSnake();
    checkCollision();
}