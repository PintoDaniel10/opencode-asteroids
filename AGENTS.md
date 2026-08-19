# AGENTS.md

Clon de **Asteroids** en HTML5 Canvas puro. Sin dependencias, sin bundler, sin toolchain.

## Ejecución y verificación

No hay `package.json`, ni build, ni tests, ni lint, ni typecheck. No inventes comandos de verificación: no existen. Abre `index.html` en el navegador, o:

```bash
npx serve .      # http://localhost:3000
```

La única verificación es la prueba manual en el navegador. No afirmes haber "pasado los tests".

## Arquitectura

- Todo el juego vive en **un solo archivo**: `game.js`. Clases `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`; estado global (`ship`, `bullets`, `asteroids`, `particles`, `powerups`, `score`, `lives`, `level`, `state`); funciones `update`/`draw`; loop con `requestAnimationFrame` y delta time en segundos (tope 0.05s). Entrada: `index.html` carga `game.js` con `<script>` plano.
- **Sin imports/exports**. Todo queda en scope global. No añadas `import` ni ESM sin cambiar también `index.html` a `<script type="module">`; de lo contrario se rompe.
- Máquina de estados con la variable global `state`: `'playing' | 'dead' | 'gameover'`. `update()` ramifica por estado.
- Espacio toroidal: los bordes envuelven con `wrap(v, max)`.

## Gotchas críticos

- **Canvas 800x600 está hardcodeado en DOS sitios**: el `<canvas>` de `index.html` y las constantes `W`/`H` de `game.js`. Cámbialos siempre juntos o se descuadra el render y el wrap.
- **Semántica de input**: `keys` indica tecla mantenida (rotación, propulsión); `pressed(code)` captura un solo frame y **limpia** el flag al leerlo (disparo, reinicio). No uses `pressed()` para movimiento sostenido ni `keys` para acciones discretas: rompes la distinción "presionado / mantenido".
- **Constantes de tuning** (`RADII`, `SPEEDS`, `POINTS`) indexadas por `size` 1..3 (3 = grande, 1 = pequeño); el índice 0 no se usa. `POINTS = [0,100,50,20]` → pequeño=100, mediano=50, grande=20.
- **Textos de UI en español** (`NIVEL`, `PUNTAJE`, `ESPACIO PARA REINICIAR`). Mantén los strings nuevos en español.

## Notas

- Existe un power-up **"velocidad"**: pickup flotante (`PowerUp`, rayo dorado con wrap de bordes) que al tocarlo la nave duplica la propulsión (`THRUST * BOOST_MULT`) durante `BOOST_DURATION` segundos. Spawnea con `POWERUP_CHANCE` al destruir asteroides `size >= 2`. Se pierde al morir y al avanzar de nivel (`ship.reset()` pone `boostTimer = 0` y `nextLevel`/`initGame` vacían `powerups`).
- Existe un power-up **"triple shot"**: pickup flotante (`PowerUp` con `type === 'triple'`, tridente cian `TRIPLE_COLOR` con wrap de bordes) que al tocarlo la nave dispara 3 balas en abanico desde el morro (`angle ± TRIPLE_SPREAD`) durante `TRIPLE_DURATION` segundos. `tryShoot()` ramifica por `tripleTimer > 0`. Convive con el de velocidad y el de escudo: los tres pueden apilarse. Mismo spawn que los demás (`POWERUP_CHANCE` al destruir `size >= 2`), reparto 33/33/33 entre `'boost'`, `'triple'` y `'shield'`. Se pierde al morir y al avanzar de nivel (`ship.reset()` pone `tripleTimer = 0`). El HUD muestra `TRIPLE  {t}s` en cian, apilado bajo `VELOCIDAD x2` y sobre `ESCUDO` según cuántos estén activos.
- Existe un power-up **"escudo"**: pickup flotante (`PowerUp` con `type === 'shield'`, símbolo azul `SHIELD_COLOR` con anillo y hexágono, wrap de bordes) que al tocarlo la nave queda protegida por un anillo translúcido de radio `SHIELD_RADIUS` durante `SHIELD_DURATION` segundos. Mientras está activo, los asteroides y estrellas fugaces que tocan el anillo se destruyen al contacto (sin split ni puntos), en lugar de matar a la nave. `Ship.draw()` pinta el anillo en espacio mundial tras el `restore()`, con parpadeo en el último segundo. Se pierde al morir y al avanzar de nivel (`ship.reset()` pone `shieldTimer = 0`). El HUD muestra `ESCUDO  {t}s` en azul, apilado bajo `VELOCIDAD x2` y `TRIPLE` según cuántos estén activos.
- El `README.md` menciona una "estrella fugaz" que **no está implementada** en `game.js`. La fuente de verdad es el código: no la asumas como existente ni la "arregles" basándote solo en el README.