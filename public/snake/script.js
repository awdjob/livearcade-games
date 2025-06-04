const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set a fixed box size and calculate canvas size from it
const BOX_SIZE = 20;
const GRID_SIZE = 30;
canvas.width = canvas.height = BOX_SIZE * GRID_SIZE;

// Update box constant to use our fixed size
const box = BOX_SIZE;

let score = 0;
let speed = 150;
let snake = [{ x: box * 5, y: box * 5 }];
let direction = 'RIGHT';
let food = generateFood();
let gameLoop;

function startGame() {
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

document.addEventListener('keydown', changeDirection);

// Add button controls
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
        if (speed > 50) speed -= 5;
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
        document.getElementById('gameOver').style.display = 'block';
        clearInterval(gameLoop);
    }
}

function restartGame() {
    snake = [{ x: box * 5, y: box * 5 }];
    direction = 'RIGHT';
    score = 0;
    speed = 150;
    document.getElementById('score').innerText = `Score: 0`;
    document.getElementById('gameOver').style.display = 'none';
    food = generateFood();
    gameLoop = setInterval(update, speed);
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFood();
    moveSnake();
    drawSnake();
    checkCollision();
}