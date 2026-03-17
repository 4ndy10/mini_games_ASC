// js/main.js
import { GRID_CONFIGS, state, TOWER_TYPES } from './data.js';
import { FloatingText, Enemy, Tower, Projectile } from './entities.js';
import { updateUI, openTowerPopup, showShop, showGameOverScreen, resetUIScreens, updatePopupContent, varColor } from './ui.js';

// --- VARIABLES GLOBALES Y EXPORTACIONES ---
export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');

export let TILE_SIZE = 40;
export let GRID_WIDTH = 15;
export let GRID_HEIGHT = 10;
const FPS = 60;
let gameState = 'MENU';

export let enemies = [];
let towers = [];
export let projectiles = [];
export let floatingTexts = [];
let MAP_DATA = [];
export let WAYPOINTS = [];
let waveTimer = 0;

export let selectedTower = null;
export let hoveredTower = null;
let shopTarget = { x: 0, y: 0 };
let lastClickTime = 0;

// Setters y Getters para UI
export const getSelectedTower = () => selectedTower;
export const setSelectedTower = (tower) => { selectedTower = tower; };
export const setShopTarget = (gx, gy) => { shopTarget = { x: gx, y: gy }; };

// --- GENERACIÓN DE MAPA ---
function generarCaminoAleatorio(cols, rows) {
    MAP_DATA = Array.from({ length: rows }, () => Array(cols).fill(0));
    WAYPOINTS.length = 0; // Limpiar array manteniendo la referencia
    WAYPOINTS.push({ x: 0, y: 0 });
    let curX = 0, curY = 0;
    MAP_DATA[0][0] = 2; // Spawn

    const targetX = cols - 1;
    const targetY = rows - 1;

    let numInternalCheckpoints = 3;
    if (state.difficulty === 'MEDIUM') numInternalCheckpoints = 5;
    if (state.difficulty === 'HARD') numInternalCheckpoints = 7;

    const internalWaypoints = [];
    for (let i = 0; i < numInternalCheckpoints; i++) {
        const minCol = Math.floor((cols - 2) * (i / numInternalCheckpoints)) + 1;
        const maxCol = Math.floor((cols - 2) * ((i + 1) / numInternalCheckpoints));
        internalWaypoints.push({
            x: minCol + Math.floor(Math.random() * (maxCol - minCol + 1)),
            y: 1 + Math.floor(Math.random() * (rows - 2))
        });
    }
    internalWaypoints.push({ x: targetX, y: targetY });

    for (const wp of internalWaypoints) {
        let safety = 0;
        while ((curX !== wp.x || curY !== wp.y) && safety < 1000) {
            safety++;
            let dx = wp.x - curX;
            let dy = wp.y - curY;

            let moveX;
            if (Math.abs(dx) > 0 && Math.abs(dy) > 0) {
                moveX = Math.random() < Math.abs(dx) / (Math.abs(dx) + Math.abs(dy));
            } else {
                moveX = Math.abs(dx) > 0;
            }

            let nextX = curX + (moveX ? Math.sign(dx) : 0);
            let nextY = curY + (moveX ? 0 : Math.sign(dy));

            curX = nextX;
            curY = nextY;

            if (!WAYPOINTS.some(w => w.x === curX && w.y === curY)) {
                WAYPOINTS.push({ x: curX, y: curY });
            }

            if (curX === targetX && curY === targetY) {
                MAP_DATA[curY][curX] = 3; // Base
            } else {
                if (MAP_DATA[curY][curX] === 0) MAP_DATA[curY][curX] = 1;
            }
        }
    }
    MAP_DATA[targetY][targetX] = 3;
}


// --- LÓGICA CORE EXPORTADA PARA UI ---
export function startGameMain(difficulty) {
    state.lives = 10; state.gold = 150; state.wave = 0; state.score = 0;
    state.enemiesAlive = 0; state.enemiesEliminated = 0;
    state.totalGoldEarned = 150; state.totalGoldSpent = 0;
    state.towersBuilt = 0; state.towersUpgraded = 0;
    state.gameOver = false; state.isVictory = false;
    state.startTime = Date.now();

    enemies.length = 0; towers = []; projectiles.length = 0; floatingTexts.length = 0;

    state.difficulty = difficulty;
    const config = GRID_CONFIGS[difficulty];
    GRID_WIDTH = config.cols; GRID_HEIGHT = config.rows;

    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.7;
    TILE_SIZE = Math.min(maxWidth / GRID_WIDTH, maxHeight / GRID_HEIGHT);
    canvas.width = GRID_WIDTH * TILE_SIZE;
    canvas.height = GRID_HEIGHT * TILE_SIZE;
    canvas.style.display = 'block';

    generarCaminoAleatorio(GRID_WIDTH, GRID_HEIGHT);

    document.getElementById('menu-overlay').classList.add('hidden');
    document.getElementById('game-header').style.display = 'flex';
    document.getElementById('game-footer').style.display = 'flex';
    document.getElementById('enemy-hud').style.display = 'flex';
    document.getElementById('game-over').style.display = 'none';

    gameState = 'WAITING';
    const btnNext = document.getElementById('btn-next-round');
    btnNext.style.display = 'block';
    btnNext.textContent = 'Iniciar Ronda';
    updateUI();
    if (waveTimer === 0) { waveTimer = -1; gameLoop(); }
}

function spawnWave() {
    const count = 5 + state.wave * 2;
    state.spawning = true;
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            if (state.gameOver) return;
            const isTank = state.wave >= 3 && Math.random() < 0.2;
            enemies.push(new Enemy(state.wave, isTank ? 'TANK' : 'BASIC'));
            if (i === count - 1) state.spawning = false;
        }, i * 1000);
    }
}

export function startNextWaveMain() {
    if (gameState !== 'WAITING') return;
    state.wave++; gameState = 'PLAYING';
    document.getElementById('btn-next-round').style.display = 'none';
    document.getElementById('btn-next-round').textContent = 'Siguiente Ronda';
    spawnWave();
    updateUI();
}

function gameLoop() {
    update();
    draw();
    if (!state.gameOver) requestAnimationFrame(gameLoop);
}

function update() {
    if (gameState === 'MENU' || state.gameOver) return;
    enemies.forEach(e => e.update());

    const activeEnemies = enemies.filter(e => !e.isDead);
    const deadEnemies = enemies.filter(e => e.isDead);

    deadEnemies.forEach(e => {
        if (e.reachedBase) {
            state.lives--;
            if (state.lives <= 0) endGame(false);
        } else {
            state.gold += e.reward;
            state.totalGoldEarned += e.reward;
            state.enemiesEliminated++;
            state.score += 10;
            floatingTexts.push(new FloatingText(e.x, e.y, `+${Math.floor(e.reward)}`, varColor('--gold-color')));
        }
    });

    // Actualizar la referencia del array global
    enemies.length = 0;
    enemies.push(...activeEnemies);
    state.enemiesAlive = enemies.length;

    const btnNext = document.getElementById('btn-next-round');
    if (gameState === 'PLAYING') {
        if (state.enemiesAlive <= 3 && !state.spawning) {
            if (btnNext.style.display !== 'block') btnNext.style.display = 'block';
        } else {
            if (btnNext.style.display !== 'none') btnNext.style.display = 'none';
        }
    }

    if (gameState === 'PLAYING' && state.enemiesAlive === 0 && !state.spawning) {
        gameState = 'WAITING';
        collectRoundRewards();
    }

    towers.forEach(t => t.update(enemies));

    const activeTexts = floatingTexts.filter(ft => ft.life > 0);
    floatingTexts.length = 0;
    floatingTexts.push(...activeTexts);
    floatingTexts.forEach(ft => ft.update());

    if (selectedTower) updatePopupContent();

    if (document.getElementById('shop-popup').style.display === 'flex') {
        const items = document.querySelectorAll('.shop-item');
        items.forEach((item, index) => {
            const type = TOWER_TYPES[index];
            const canAfford = state.gold >= type.cost;
            item.className = `shop-item ${canAfford ? '' : 'disabled'}`;
            item.onclick = canAfford ? () => { buildTower(type); window.closeShop(); updateUI(); } : null;
        });
    }
    updateUI();
}

function collectRoundRewards() {
    let totalFarmIncome = 0;
    towers.forEach(t => {
        if (t.type.id === 'granja') totalFarmIncome += t.income;
    });

    const interestReward = 10 + (state.wave - 1);
    const totalReward = totalFarmIncome + interestReward;

    state.gold += totalReward;
    state.totalGoldEarned += totalReward;

    if (totalReward > 0) {
        floatingTexts.push(new FloatingText(canvas.width / 2, canvas.height / 2, `¡Ronda Completada! +$${totalReward}`, varColor('--gold-color')));
        if (totalFarmIncome > 0) {
            floatingTexts.push(new FloatingText(canvas.width / 2, canvas.height / 2 + 30, `(Granjas: +$${totalFarmIncome})`, varColor('--gold-color')));
        }
    }
    updateUI();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const type = MAP_DATA[y][x];
            if (type === 1) ctx.fillStyle = '#1e293b';
            else if (type === 2) ctx.fillStyle = '#ef4444';
            else if (type === 3) ctx.fillStyle = '#3b82f6';
            else ctx.fillStyle = '#0f172a';

            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            if (type === 2) {
                ctx.strokeStyle = '#f87171'; ctx.lineWidth = 3;
                ctx.strokeRect(x * TILE_SIZE + 4, y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            } else if (type === 3) {
                ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 3;
                ctx.strokeRect(x * TILE_SIZE + 4, y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            }
        }
    }
    enemies.forEach(e => e.draw(ctx));
    towers.forEach(t => t.draw(ctx));

    const activeProjectiles = projectiles.filter(p => p.life > 0);
    projectiles.length = 0;
    projectiles.push(...activeProjectiles);
    projectiles.forEach(p => p.draw(ctx));

    floatingTexts.forEach(ft => ft.draw(ctx));
}

export function buildTower(type) {
    if (state.gold < type.cost) return;
    state.gold -= type.cost;
    state.totalGoldSpent += type.cost;
    state.towersBuilt++;
    const tower = new Tower(shopTarget.x, shopTarget.y, type);
    towers.push(tower);
    MAP_DATA[shopTarget.y][shopTarget.x] = 4;
    updateUI();
}

function endGame(victory) {
    state.gameOver = true; state.isVictory = victory;
    const timeSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    const finalScore = state.score + (state.lives * 100) + (state.wave * 50);
    showGameOverScreen(victory, finalScore, timeSeconds);
}

export function restartGameMain() {
    resetUIScreens();
    gameState = 'MENU';
    state.idPartida = "TD-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
}

function debounce() {
    const now = Date.now();
    if (now - lastClickTime < 300) return true;
    lastClickTime = now; return false;
}

// --- EVENT LISTENERS ---
canvas.addEventListener('mousemove', (e) => {
    if (gameState === 'MENU' || state.gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const gy = Math.floor((e.clientY - rect.top) / TILE_SIZE);
    if (gy >= 0 && gy < GRID_HEIGHT && gx >= 0 && gx < GRID_WIDTH) {
        hoveredTower = towers.find(t => t.gridX === gx && t.gridY === gy) || null;
    }
});

canvas.addEventListener('click', (e) => {
    if (gameState === 'MENU' || state.gameOver || debounce()) return;
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const gy = Math.floor((e.clientY - rect.top) / TILE_SIZE);
    if (gy < 0 || gy >= GRID_HEIGHT || gx < 0 || gx >= GRID_WIDTH) return;

    const towerAtCell = towers.find(t => t.gridX === gx && t.gridY === gy);
    if (towerAtCell) openTowerPopup(towerAtCell, TILE_SIZE);
    else if (MAP_DATA[gy][gx] === 0) showShop(gx, gy, TILE_SIZE);
    else { window.closeTowerPopup(); window.closeShop(); }
});

window.onclick = (e) => {
    if (e.target.id !== 'gameCanvas' && !e.target.closest('#tower-popup') && !e.target.closest('#shop-popup')) {
        // closeTowerPopup(); closeShop(); 
    }
};