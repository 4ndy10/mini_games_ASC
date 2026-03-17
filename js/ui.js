// js/ui.js
import { state, ALMANAC_DATA, ENEMY_TYPES, TOWER_TYPES } from './data.js';

// Importamos el motor principal y sus variables (que crearemos en el siguiente paso)
import {
    canvas, enemies, getSelectedTower, setSelectedTower,
    setShopTarget, buildTower, restartGameMain, startGameMain, startNextWaveMain
} from './main.js';

export function varColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#38bdf8';
}

// --- ACTUALIZACIÓN DE INTERFAZ (Exportadas para que main.js las use) ---

export function updateUI() {
    document.getElementById('ui-lives').textContent = state.lives;
    document.getElementById('ui-gold').textContent = Math.floor(state.gold);
    document.getElementById('ui-wave').textContent = state.wave;
    document.getElementById('ui-score').textContent = state.score;

    // Update Enemy HUD
    const hudList = document.getElementById('enemy-hud-list');
    if (!hudList) return;
    hudList.innerHTML = '';

    const counts = {};
    enemies.forEach(e => {
        counts[e.typeKey] = (counts[e.typeKey] || 0) + 1;
    });

    if (Object.keys(counts).length === 0) {
        hudList.innerHTML = '<div style="color: #64748b; font-size: 0.8rem; font-style: italic; text-align: center;">- Ninguno -</div>';
    } else {
        Object.entries(counts).forEach(([typeKey, count]) => {
            const type = ENEMY_TYPES[typeKey];
            const item = document.createElement('div');
            item.className = 'enemy-hud-item';
            item.style.marginBottom = '10px';
            item.innerHTML = `
                <div class="enemy-hud-icon" style="background: ${type.color}"></div>
                <span style="color: white; font-weight: 800;">x ${count}</span>
            `;
            hudList.appendChild(item);
        });
    }
}

export function updatePopupContent() {
    const selectedTower = getSelectedTower();
    if (!selectedTower) return;
    document.getElementById('popup-level').textContent = selectedTower.level;

    if (selectedTower.type.id === 'granja') {
        document.getElementById('popup-damage').parentNode.style.display = 'none';
        document.getElementById('popup-range').parentNode.style.display = 'none';
        document.getElementById('popup-fire-rate').parentNode.style.display = 'none';

        let incomeRow = document.getElementById('popup-income-row');
        if (!incomeRow) {
            incomeRow = document.createElement('div');
            incomeRow.id = 'popup-income-row';
            incomeRow.className = 'stat-line';
            incomeRow.innerHTML = '<span>Ingreso:</span> <span id="popup-income">0</span>';
            document.querySelector('.stats-list').appendChild(incomeRow);
        }
        incomeRow.style.display = 'flex';
        document.getElementById('popup-income').textContent = `$${selectedTower.income}`;
    } else {
        document.getElementById('popup-damage').parentNode.style.display = 'flex';
        document.getElementById('popup-range').parentNode.style.display = 'flex';
        document.getElementById('popup-fire-rate').parentNode.style.display = 'flex';
        if (document.getElementById('popup-income-row')) {
            document.getElementById('popup-income-row').style.display = 'none';
        }
        document.getElementById('popup-damage').textContent = selectedTower.damage;
        document.getElementById('popup-range').textContent = Math.floor(selectedTower.range);
        document.getElementById('popup-fire-rate').textContent = (selectedTower.fireRate / 60).toFixed(2) + 's';
    }

    document.getElementById('popup-cost').textContent = selectedTower.upgradeCost;
    const btn = document.getElementById('btn-upgrade-tower');
    const canAfford = state.gold >= selectedTower.upgradeCost;
    btn.className = canAfford ? 'can-afford' : 'cannot-afford';
    btn.disabled = !canAfford;
}

export function openTowerPopup(tower, TILE_SIZE) {
    window.closeShop();
    setSelectedTower(tower);
    const popup = document.getElementById('tower-popup');
    updatePopupContent();
    popup.style.display = 'flex';

    const rect = canvas.getBoundingClientRect();
    const popupWidth = 220;
    const popupHeight = 250;

    let left = rect.left + tower.x + 40;
    let top = rect.top + tower.y - 120;

    if (left + popupWidth > window.innerWidth - 20) {
        left = rect.left + tower.x - popupWidth - 10;
    }

    const footerHeight = 120;
    if (top + popupHeight > window.innerHeight - footerHeight) {
        top = rect.top + tower.y - popupHeight + 10;
    }
    if (top < 80) {
        top = rect.top + tower.y + 40;
    }

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
}

export function showShop(gx, gy, TILE_SIZE) {
    window.closeTowerPopup();
    setShopTarget(gx, gy);
    const shop = document.getElementById('shop-popup');
    const container = document.getElementById('shop-items-container');
    container.innerHTML = '';

    TOWER_TYPES.forEach(type => {
        const canAfford = state.gold >= type.cost;
        const item = document.createElement('div');
        item.className = `shop-item ${canAfford ? '' : 'disabled'}`;
        item.innerHTML = `
            <div class="shop-item-icon" style="background: ${type.color}22; border: 1px solid ${type.color}">
                <div style="width: 20px; height: 20px; background: ${type.color}; border-radius: 4px;"></div>
            </div>
            <div class="shop-item-name">${type.name}</div>
            <div class="shop-item-cost">$${type.cost}</div>
        `;
        if (canAfford) item.onclick = () => {
            buildTower(type);
            window.closeShop();
            updateUI();
        };
        container.appendChild(item);
    });

    shop.style.display = 'flex';
    const rect = canvas.getBoundingClientRect();
    shop.style.left = (rect.left + gx * TILE_SIZE + TILE_SIZE + 10) + 'px';
    shop.style.top = (rect.top + gy * TILE_SIZE - 50) + 'px';
}

export function showGameOverScreen(victory, finalScore, timeSeconds) {
    const screen = document.getElementById('game-over');
    const title = document.getElementById('result-title');
    title.textContent = victory ? "VICTORIA" : "DERROTA";
    title.className = victory ? "victory" : "defeat";
    document.getElementById('metrics-display').innerHTML = `
        <div class="metric-item"><div class="metric-label">Puntaje</div><div class="metric-value">${finalScore}</div></div>
        <div class="metric-item"><div class="metric-label">Enemigos</div><div class="metric-value">${state.enemiesEliminated}</div></div>
        <div class="metric-item"><div class="metric-label">Torres</div><div class="metric-value">${state.towersBuilt}</div></div>
        <div class="metric-item"><div class="metric-label">Tiempo</div><div class="metric-value">${timeSeconds}s</div></div>
    `;
    screen.style.display = 'flex';
}

export function resetUIScreens() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-header').style.display = 'none';
    document.getElementById('game-footer').style.display = 'none';
    document.getElementById('enemy-hud').style.display = 'none';
    canvas.style.display = 'none';
    document.getElementById('menu-overlay').classList.remove('hidden');
    document.getElementById('main-menu').style.display = 'block';
    document.getElementById('difficulty-selector').style.display = 'none';
}


// --- CONEXIÓN CON EL HTML (Global Window Object) ---

window.submitName = function () {
    const input = document.getElementById('player-name-input');
    const name = input.value.trim();
    if (name.length < 2) {
        input.style.borderColor = 'var(--danger-color)';
        return;
    }
    state.Usuario = name;
    document.getElementById('name-overlay').classList.add('hidden');
    document.getElementById('menu-overlay').classList.remove('hidden');
};

window.showDifficultySelector = function () {
    document.getElementById('difficulty-selector').style.display = 'block';
};

window.backToMainMenu = function () {
    document.getElementById('difficulty-selector').style.display = 'none';
    document.getElementById('almanac-overlay').style.display = 'none';
    document.getElementById('menu-overlay').classList.remove('hidden');
};

window.confirmExit = function () {
    document.getElementById('exit-confirm-overlay').style.display = 'flex';
};

window.exitToMenu = function (confirm) {
    document.getElementById('exit-confirm-overlay').style.display = 'none';
    if (confirm) {
        restartGameMain(); // Llama a la lógica principal
    }
};

window.closeTowerPopup = function () {
    document.getElementById('tower-popup').style.display = 'none';
    setSelectedTower(null);
};

window.closeShop = function () {
    document.getElementById('shop-popup').style.display = 'none';
};

window.openAlmanac = function () {
    document.getElementById('menu-overlay').classList.add('hidden');
    document.getElementById('almanac-overlay').style.display = 'block';
    window.loadAlmanacEntry('torre_basica');
};

window.closeAlmanac = function () {
    document.getElementById('almanac-overlay').style.display = 'none';
};

window.loadAlmanacEntry = function (id) {
    const data = ALMANAC_DATA[id];
    const panel = document.getElementById('almanac-details-panel');

    document.querySelectorAll('.almanac-item').forEach(item => {
        if (item.getAttribute('onclick').includes(id)) item.classList.add('active');
        else item.classList.remove('active');
    });

    let visualHTML = `<div class="almanac-visual-placeholder" style="background: ${data.color}; border-radius: ${data.radius === 'circle' ? '50%' : '12px'};"></div>`;

    let statsHTML = '';
    if (data.isEnemy) {
        const diffStyles = {
            EASY: 'background: rgba(21, 128, 61, 0.2); border-color: rgba(34, 197, 94, 0.3);',
            MEDIUM: 'background: rgba(161, 98, 7, 0.2); border-color: rgba(234, 179, 8, 0.3);',
            HARD: 'background: rgba(153, 27, 27, 0.2); border-color: rgba(239, 68, 68, 0.3);'
        };

        for (const [diff, stats] of Object.entries(data.difficulties)) {
            statsHTML += `<div class="almanac-difficulty-divider">${diff === 'EASY' ? 'Fácil' : (diff === 'MEDIUM' ? 'Intermedio' : 'Difícil')}</div>`;
            statsHTML += stats.map(s => `
                <div class="almanac-stat-card" style="${diffStyles[diff]}">
                    <div class="almanac-stat-label">${s.label}</div>
                    <div class="almanac-stat-value ${s.class || ''}">${s.value}</div>
                </div>
            `).join('');
        }
    } else {
        statsHTML = data.stats.map(s => `
            <div class="almanac-stat-card">
                <div class="almanac-stat-label">${s.label}</div>
                <div class="almanac-stat-value">${s.value}</div>
            </div>
        `).join('');
    }

    panel.innerHTML = `
        <button id="btn-close-almanac" onclick="backToMainMenu()">CERRAR Y REGRESAR</button>
        <div class="almanac-visual">${visualHTML}</div>
        <h1 class="almanac-title">${data.title}</h1>
        <p class="almanac-lore">"${data.lore}"</p>
        <div class="almanac-stats">
            ${statsHTML}
        </div>
    `;
};

// Rutas directas a las funciones principales del juego desde los botones
window.startGame = function (difficulty) { startGameMain(difficulty); };
window.startNextWave = function () { startNextWaveMain(); };
window.restartGame = function () { restartGameMain(); };

// Evento del botón de mejorar torre (que no estaba en el HTML directamente)
document.getElementById('btn-upgrade-tower').onclick = () => {
    const selectedTower = getSelectedTower();
    if (!selectedTower || state.gold < selectedTower.upgradeCost) return;

    state.gold -= selectedTower.upgradeCost;
    state.totalGoldSpent += selectedTower.upgradeCost;
    state.towersUpgraded++;

    selectedTower.upgrade();
    updatePopupContent();
    updateUI();
};