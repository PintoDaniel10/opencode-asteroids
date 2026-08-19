'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño
const ACCENT = '#ffd23f';
const POWERUP_CHANCE = 0.15;
const POWERUP_LIFE   = 10;
const BOOST_DURATION  = 5;
const BOOST_MULT      = 2;
const SHIELD_DURATION = 8;
const SHIELD_COLOR    = '#3fa9ff';
const SHIELD_RADIUS   = 22;
const TRIPLE_DURATION = 5;
const TRIPLE_SPREAD   = 0.18;
const TRIPLE_COLOR    = '#3fd2ff';
const SHOOTING_STAR_SPEED   = 220;
const SHOOTING_STAR_LIFE    = 6;
const SHOOTING_STAR_POINTS  = 200;
const SHOOTING_STAR_INTERVAL = 10;

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.boostTimer    = 0;
    this.shieldTimer   = 0;
    this.tripleTimer   = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.boostTimer    > 0) this.boostTimer    -= dt;
    if (this.shieldTimer   > 0) this.shieldTimer   -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer   -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      const thrust = this.boostTimer > 0 ? THRUST * BOOST_MULT : THRUST;
      this.vx += Math.cos(this.angle) * thrust * dt;
      this.vy += Math.sin(this.angle) * thrust * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleTimer > 0) {
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const boosted = this.boostTimer > 0;
    ctx.strokeStyle = boosted ? ACCENT : '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Indicador de triple shot: abanico cian en el morro
    if (this.tripleTimer > 0) {
      ctx.strokeStyle = TRIPLE_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const off of [-TRIPLE_SPREAD, 0, TRIPLE_SPREAD]) {
        ctx.moveTo(20, 0);
        ctx.lineTo(20 + Math.cos(off) * 8, Math.sin(off) * 8);
      }
      ctx.stroke();
    }

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(boosted ? 12 : 6, boosted ? 24 : 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = boosted ? 'rgba(255, 210, 63, 0.95)' : 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    ctx.restore();

    // Escudo: anillo translúcido alrededor de la nave (espacio mundial)
    if (this.shieldTimer > 0) {
      const blink = this.shieldTimer < 1 && Math.floor(this.shieldTimer * 8) % 2 === 0;
      if (!blink) {
        ctx.save();
        ctx.strokeStyle = 'rgba(63, 169, 255, 0.85)';
        ctx.fillStyle   = 'rgba(63, 169, 255, 0.12)';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, SHIELD_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

class PowerUp {
  constructor(x, y, type = 'boost') {
    this.type = type;
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 50);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 12;
    this.rot = 0;
    this.ttl  = POWERUP_LIFE;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += 2 * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    if (this.type === 'triple') {
      ctx.strokeStyle = TRIPLE_COLOR;
      ctx.fillStyle   = 'rgba(63, 210, 255, 0.18)';
      ctx.lineWidth   = 2;
      ctx.lineJoin    = 'round';
      ctx.lineCap     = 'round';
      // Tridente: base común + 3 puntas en abanico
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(0, 2);
      ctx.moveTo(0, 2);
      ctx.lineTo(-10, -8);
      ctx.moveTo(0, 2);
      ctx.lineTo(0, -12);
      ctx.moveTo(0, 2);
      ctx.lineTo(10, -8);
      ctx.stroke();
      // Puntas de las 3 flechas
      for (const [px, py] of [[-10, -8], [0, -12], [10, -8]]) {
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === 'shield') {
      ctx.strokeStyle = SHIELD_COLOR;
      ctx.fillStyle   = 'rgba(63, 169, 255, 0.18)';
      ctx.lineWidth   = 2;
      ctx.lineJoin    = 'round';

      // Anillo exterior
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.stroke();

      // Símbolo de escudo
      ctx.beginPath();
      ctx.moveTo( 0, -8);
      ctx.lineTo( 7, -4);
      ctx.lineTo( 7,  4);
      ctx.lineTo( 0,  8);
      ctx.lineTo(-7,  4);
      ctx.lineTo(-7, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeStyle = ACCENT;
      ctx.fillStyle   = 'rgba(255, 210, 63, 0.18)';
      ctx.lineWidth   = 2;
      ctx.lineJoin    = 'round';
      ctx.beginPath();
      ctx.moveTo( 4, -13);
      ctx.lineTo(-5,   2);
      ctx.lineTo( 0,   2);
      ctx.lineTo(-3,  13);
      ctx.lineTo( 6,  -2);
      ctx.lineTo( 1,  -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Asteroide especial: rápido, desaparece con el tiempo, otorga puntos bonus.
class ShootingStar {
  constructor() {
    // Entra desde un borde con dirección hacia el campo
    const side = randInt(0, 3);
    let x, y, angle;
    if (side === 0) {            // arriba → hacia abajo
      x = rand(0, W);
      y = 0;
      angle = rand(Math.PI * 0.25, Math.PI * 0.75);
    } else if (side === 1) {     // derecha → hacia izquierda
      x = W;
      y = rand(0, H);
      angle = rand(Math.PI * 0.75, Math.PI * 1.25);
    } else if (side === 2) {     // abajo → hacia arriba
      x = rand(0, W);
      y = H;
      angle = rand(Math.PI * 1.25, Math.PI * 1.75);
    } else {                     // izquierda → hacia derecha
      x = 0;
      y = rand(0, H);
      angle = rand(-Math.PI * 0.25, Math.PI * 0.25);
    }
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * SHOOTING_STAR_SPEED;
    this.vy = Math.sin(angle) * SHOOTING_STAR_SPEED;
    this.radius = 16;
    this.rot      = 0;
    this.rotSpeed = rand(-3, 3);
    this.life = SHOOTING_STAR_LIFE;
    this.ttl  = SHOOTING_STAR_LIFE;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo al final de su vida
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;

    // Estela (espacio mundial, opuesta a la velocidad)
    ctx.strokeStyle = 'rgba(255, 210, 63, 0.4)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.04, this.y - this.vy * 0.04);
    ctx.stroke();

    // Estrella de 5 puntas
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = ACCENT;
    ctx.fillStyle   = 'rgba(255, 210, 63, 0.25)';
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? this.radius : this.radius * 0.45;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups, shootingStars;
let score, lives, level;
let shootingStarTimer;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  shootingStars = [];
  shootingStarTimer = SHOOTING_STAR_INTERVAL;
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  shootingStars = [];
  shootingStarTimer = SHOOTING_STAR_INTERVAL;
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));
  shootingStars.forEach(s => s.update(dt));

  // Spawn periódico de estrella fugaz
  shootingStarTimer -= dt;
  if (shootingStarTimer <= 0) {
    shootingStars.push(new ShootingStar());
    shootingStarTimer = SHOOTING_STAR_INTERVAL + rand(-2, 3);
  }

  if (!ship.dead) {
    for (const p of powerups) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        if (p.type === 'triple')      ship.tripleTimer = TRIPLE_DURATION;
        else if (p.type === 'shield') ship.shieldTimer = SHIELD_DURATION;
        else                          ship.boostTimer  = BOOST_DURATION;
        p.dead = true;
      }
    }
  }

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        if (a.size >= 2 && Math.random() < POWERUP_CHANCE) {
          const r = Math.random();
          const type = r < 1/3 ? 'boost' : r < 2/3 ? 'triple' : 'shield';
          powerups.push(new PowerUp(a.x, a.y, type));
        }
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs estrella fugaz
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += SHOOTING_STAR_POINTS;
        explode(s.x, s.y, 12);
      }
    }
  }
  shootingStars = shootingStars.filter(s => !s.dead);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    if (ship.shieldTimer > 0) {
      // El escudo destruye asteroides al contacto (sin split ni puntos)
      for (const a of asteroids) {
        if (!a.dead && dist(ship, a) < SHIELD_RADIUS + a.radius) {
          a.dead = true;
          explode(a.x, a.y, a.size * 5);
        }
      }
      asteroids = asteroids.filter(a => !a.dead);
      for (const s of shootingStars) {
        if (!s.dead && dist(ship, s) < SHIELD_RADIUS + s.radius) {
          s.dead = true;
          explode(s.x, s.y, 12);
        }
      }
      shootingStars = shootingStars.filter(s => !s.dead);
    } else {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * 0.82) {
          killShip();
          break;
        }
      }
      if (!ship.dead) {
        for (const s of shootingStars) {
          if (dist(ship, s) < ship.radius + s.radius * 0.82) {
            killShip();
            break;
          }
        }
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  let hudY = 46;
  if (ship.boostTimer > 0) {
    ctx.fillStyle = ACCENT;
    ctx.fillText(`VELOCIDAD x2  ${ship.boostTimer.toFixed(1)}s`, W / 2, hudY);
    hudY += 18;
  }

  if (ship.tripleTimer > 0) {
    ctx.fillStyle = TRIPLE_COLOR;
    ctx.fillText(`TRIPLE  ${ship.tripleTimer.toFixed(1)}s`, W / 2, hudY);
    hudY += 18;
  }

  if (ship.shieldTimer > 0) {
    ctx.fillStyle = SHIELD_COLOR;
    ctx.fillText(`ESCUDO  ${ship.shieldTimer.toFixed(1)}s`, W / 2, hudY);
  }

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  shootingStars.forEach(s => s.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
