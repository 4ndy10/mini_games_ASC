// js/entities.js
import { state, ENEMY_TYPES } from './data.js';

// Importamos variables dinámicas desde main.js (¡magia de los módulos ES6!)
import { TILE_SIZE, WAYPOINTS, hoveredTower, selectedTower, floatingTexts, projectiles } from './main.js';

export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.alpha = 1;
        this.life = 60;
    }
    update() {
        this.y -= 0.5;
        this.alpha -= 1 / 60;
        this.life--;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

export class Enemy {
    constructor(wave, typeKey = 'BASIC') {
        const type = ENEMY_TYPES[typeKey];
        this.typeKey = typeKey;
        this.x = WAYPOINTS[0].x * TILE_SIZE + TILE_SIZE / 2;
        this.y = WAYPOINTS[0].y * TILE_SIZE + TILE_SIZE / 2;
        this.waypointIndex = 0;
        this.speed = type.speed;
        const difficultyMultiplier = state.difficulty === 'HARD' ? 2 : (state.difficulty === 'MEDIUM' ? 1.5 : 1);
        this.maxHealth = (type.health + (wave * type.scaling)) * difficultyMultiplier;
        this.health = this.maxHealth;
        this.reward = type.reward + Math.floor(wave / 2);
        this.radius = typeKey === 'TANK' ? TILE_SIZE * 0.4 : TILE_SIZE * 0.3;
        this.color = type.color;
        this.isDead = false;
        this.reachedBase = false;
    }

    update() {
        if (this.isDead) return;
        const target = WAYPOINTS[this.waypointIndex];
        const targetX = target.x * TILE_SIZE + TILE_SIZE / 2;
        const targetY = target.y * TILE_SIZE + TILE_SIZE / 2;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.waypointIndex++;
            if (this.waypointIndex >= WAYPOINTS.length) {
                this.reachedBase = true;
                this.isDead = true;
                return;
            }
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const healthBarWidth = TILE_SIZE * 0.6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x - healthBarWidth / 2, this.y - TILE_SIZE * 0.45, healthBarWidth, 5);
        const hpPercent = this.health / this.maxHealth;
        ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : (hpPercent > 0.2 ? '#facc15' : '#ef4444');
        ctx.fillRect(this.x - healthBarWidth / 2, this.y - TILE_SIZE * 0.45, hpPercent * healthBarWidth, 5);
    }
}

export class Tower {
    constructor(gridX, gridY, type) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.type = type;
        this.x = gridX * TILE_SIZE + TILE_SIZE / 2;
        this.y = gridY * TILE_SIZE + TILE_SIZE / 2;
        this.level = 1;
        this.range = TILE_SIZE * type.range;
        this.damage = type.damage;
        this.fireRate = type.fireRate;
        this.cooldown = 0;
        this.target = null;
        this.cost = type.cost;
        this.upgradeCost = type.id === 'granja' ? 50 : Math.floor(type.cost * 1.5);
        this.color = type.color;
        if (type.id === 'granja') {
            this.income = type.income;
        }
    }

    update(enemies) {
        if (this.type.id === 'granja') return;
        if (this.cooldown > 0) this.cooldown--;
        if (!this.target || this.target.isDead || this.getDistance(this.target) > this.range) {
            this.target = this.findFirstEnemy(enemies);
        }
        if (this.target && this.cooldown <= 0) {
            this.shoot();
        }
    }

    findFirstEnemy(enemies) {
        let bestTarget = null;
        let maxProgress = -1;

        for (let e of enemies) {
            let d = this.getDistance(e);
            if (d < this.range) {
                let progress = e.waypointIndex;
                if (progress > maxProgress) {
                    maxProgress = progress;
                    bestTarget = e;
                } else if (progress === maxProgress && bestTarget) {
                    const targetWP = WAYPOINTS[e.waypointIndex];
                    if (targetWP) {
                        const distToWP_current = Math.sqrt((targetWP.x * TILE_SIZE + TILE_SIZE / 2 - e.x) ** 2 + (targetWP.y * TILE_SIZE + TILE_SIZE / 2 - e.y) ** 2);
                        const targetWP_best = WAYPOINTS[bestTarget.waypointIndex];
                        const distToWP_best = Math.sqrt((targetWP_best.x * TILE_SIZE + TILE_SIZE / 2 - bestTarget.x) ** 2 + (targetWP_best.y * TILE_SIZE + TILE_SIZE / 2 - bestTarget.y) ** 2);
                        if (distToWP_current < distToWP_best) {
                            bestTarget = e;
                        }
                    }
                }
            }
        }
        return bestTarget;
    }

    getDistance(entity) {
        return Math.sqrt((entity.x - this.x) ** 2 + (entity.y - this.y) ** 2);
    }

    shoot() {
        this.target.health -= this.damage;
        floatingTexts.push(new FloatingText(this.target.x, this.target.y - 10, `${this.damage}`, 'white'));
        if (this.target.health <= 0) this.target.isDead = true;
        this.cooldown = this.fireRate;
        projectiles.push(new Projectile(this.x, this.y, this.target.x, this.target.y));
    }

    upgrade() {
        this.level++;
        if (this.type.id === 'granja') {
            this.income += this.type.upIncome;
        } else {
            this.damage += this.type.upDamage;
            this.range += TILE_SIZE * this.type.upRange;
            this.fireRate = Math.max(15, this.fireRate - this.type.upFireRate);
        }
        this.upgradeCost = Math.floor(this.upgradeCost * 1.8);
    }

    draw(ctx) {
        if ((hoveredTower === this || selectedTower === this) && this.type.id !== 'granja') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - TILE_SIZE * 0.35, this.y - TILE_SIZE * 0.35, TILE_SIZE * 0.7, TILE_SIZE * 0.7);

        if (this.type.id !== 'granja') {
            ctx.fillStyle = '#cbd5e1';
            ctx.save();
            ctx.translate(this.x, this.y);
            if (this.target) {
                let angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                ctx.rotate(angle);
            }
            ctx.fillRect(0, -TILE_SIZE * 0.1, TILE_SIZE * 0.5, TILE_SIZE * 0.2);
            ctx.restore();
        } else {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.font = `bold ${Math.floor(TILE_SIZE * 0.4)}px Inter`;
            ctx.textAlign = 'center';
            ctx.fillText('$', this.x, this.y + TILE_SIZE * 0.15);
        }
        ctx.fillStyle = 'white';
        ctx.font = `${Math.floor(TILE_SIZE * 0.25)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`L${this.level}`, this.x, this.y + TILE_SIZE * 0.1);

        if (state.gold >= this.upgradeCost) {
            ctx.save();
            ctx.translate(this.x + TILE_SIZE * 0.25, this.y - TILE_SIZE * 0.4);
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(-TILE_SIZE * 0.1, TILE_SIZE * 0.15); ctx.lineTo(TILE_SIZE * 0.1, TILE_SIZE * 0.15);
            ctx.closePath();
            ctx.fillStyle = "#22c55e";
            ctx.fill();
            ctx.fillRect(-TILE_SIZE * 0.04, TILE_SIZE * 0.15, TILE_SIZE * 0.08, TILE_SIZE * 0.1);
            ctx.restore();
        }
    }
}

export class Projectile {
    constructor(sx, sy, tx, ty) {
        this.sx = sx; this.sy = sy;
        this.tx = tx; this.ty = ty;
        this.life = 10;
    }
    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8'; // <--- Hexadecimal directo
        ctx.lineWidth = 2;
        ctx.globalAlpha = Math.max(0, this.life / 10);
        ctx.beginPath();
        ctx.moveTo(this.sx, this.sy);
        ctx.lineTo(this.tx, this.ty);
        ctx.stroke();
        ctx.restore();
        this.life--;
    }
}