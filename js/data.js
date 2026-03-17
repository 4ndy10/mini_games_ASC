// js/data.js

export const GRID_CONFIGS = {
    EASY: { cols: 15, rows: 10 },
    MEDIUM: { cols: 20, rows: 15 },
    HARD: { cols: 30, rows: 25 }
};

export const state = {
    idPartida: "TD-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
    Usuario: "Jugador_Prueba",
    difficulty: 'EASY',
    lives: 10,
    gold: 150,
    wave: 0,
    score: 0,
    enemiesAlive: 0,
    enemiesEliminated: 0,
    totalGoldEarned: 150,
    totalGoldSpent: 0,
    towersBuilt: 0,
    towersUpgraded: 0,
    startTime: Date.now(),
    gameOver: false,
    isVictory: false,
    spawning: false
};

export const TOWER_TYPES = [
    {
        id: 'basica', name: "Torre Básica", cost: 50, color: "#38bdf8",
        range: 3.75, damage: 10, fireRate: 45,
        upDamage: 8, upRange: 0.5, upFireRate: 5
    },
    {
        id: 'sniper', name: "Sniper", cost: 150, color: "#86efac",
        range: 5, damage: 25, fireRate: 120,
        upDamage: 5, upRange: 0.5, upFireRate: 12
    },
    {
        id: 'granja', name: "Granja", cost: 50, color: "#facc15",
        income: 25, upIncome: 15,
        range: 0, damage: 0, fireRate: 0,
        upDamage: 0, upRange: 0, upFireRate: 0
    }
];

export const ENEMY_TYPES = {
    BASIC: { name: "Básico", speed: 1.5, health: 20, scaling: 15, reward: 5, color: '#f87171' },
    TANK: { name: "Tanque", speed: 0.5, health: 50, scaling: 10, reward: 15, color: '#b91c1c' }
};

export const ALMANAC_DATA = {
    torre_basica: {
        title: "Torre Básica",
        lore: "La columna vertebral de cualquier defensa. Barata, confiable y sorprendentemente efectiva cuando se mejora en grupos.",
        color: "#38bdf8",
        radius: "rect",
        stats: [
            { label: "Daño", value: "10 (+8)" },
            { label: "Rango", value: "3.75 tiles (+0.5)" },
            { label: "Cadencia", value: "0.75s (-5f)" },
            { label: "Costo", value: "$50" }
        ]
    },
    sniper: {
        title: "Sniper",
        lore: "Precision letal a largo alcance. Ideal para eliminar enemigos antes de que se acerquen demasiado, aunque su recarga es lenta.",
        color: "#86efac",
        radius: "rect",
        stats: [
            { label: "Daño", value: "25 (+5)" },
            { label: "Rango", value: "5.0 tiles (+0.5)" },
            { label: "Cadencia", value: "2.0s (-0.2s)" },
            { label: "Costo", value: "$150" }
        ]
    },
    granja: {
        title: "Granja",
        lore: "Una inversión para el futuro. No ataca, pero genera ingresos pasivos al final de cada ronda para financiar defensas más pesadas.",
        color: "#facc15",
        radius: "rect",
        stats: [
            { label: "Ingreso", value: "$25 (+15)" },
            { label: "Costo", value: "$50" },
            { label: "Mejora", value: "$50" }
        ]
    },
    enemigo_basico: {
        title: "Enemigo Básico",
        lore: "Infantería ligera enviada para probar tus defensas. No son una gran amenaza solos, pero cuidado con las hordas.",
        color: "#ef4444",
        radius: "circle",
        isEnemy: true,
        difficulties: {
            EASY: [
                { label: "♥ Vida Base", value: "20", class: "stat-val-red" },
                { label: "⚡ Velocidad", value: "1.5" },
                { label: "💰 Recompensa", value: "$5+", class: "stat-val-gold" },
                { label: "📈 Escalado", value: "+15 HP/ola", class: "stat-val-green" }
            ],
            MEDIUM: [
                { label: "♥ Vida Base", value: "30", class: "stat-val-red" },
                { label: "⚡ Velocidad", value: "1.5" },
                { label: "📈 Escalado", value: "+22.5 HP/ola", class: "stat-val-green" }
            ],
            HARD: [
                { label: "♥ Vida Base", value: "40", class: "stat-val-red" },
                { label: "⚡ Velocidad", value: "1.5" },
                { label: "📈 Escalado", value: "+30 HP/ola", class: "stat-val-green" }
            ]
        }
    },
    tank: {
        title: "Tanque",
        lore: "Una unidad pesada acorazada. Lento pero extremadamente resistente. Requiere fuego concentrado para ser derribado.",
        color: "#b91c1c",
        radius: "circle",
        isEnemy: true,
        difficulties: {
            EASY: [
                { label: "♥ Vida Base", value: "50", class: "stat-val-red" },
                { label: "⚡ Velocidad", value: "0.5" },
                { label: "💰 Recompensa", value: "$15+", class: "stat-val-gold" },
                { label: "📈 Escalado", value: "+10 HP/ola", class: "stat-val-green" }
            ],
            MEDIUM: [
                { label: "♥ Vida Base", value: "75", class: "stat-val-red" },
                { label: "⚡ Velocidad", value: "0.5" },
                { label: "📈 Escalado", value: "+15 HP/ola", class: "stat-val-green" }
            ],
            HARD: [
                { label: "♥ Vida Base", value: "100", class: "stat-val-red" },
                { label: "⚡ Velocidad", value: "0.5" },
                { label: "📈 Escalado", value: "+20 HP/ola", class: "stat-val-green" }
            ]
        }
    }
};