# AGENTS.md

Clon de **Asteroids** en HTML5 Canvas puro. Sin dependencias, sin bundler, sin toolchain.

## Ejecución y verificación

No hay `package.json`, ni build, ni tests, ni lint, ni typecheck. No inventes comandos de verificación: no existen. Abre `index.html` en el navegador, o:

```bash
npx serve .      # http://localhost:3000
```

La única verificación es la prueba manual en el navegador. No afirmes haber "pasado los tests".

## Arquitectura

- Todo el juego vive en **un solo archivo**: `game.js`. Clases `Bullet`, `Asteroid`, `Ship`, `Particle`; estado global (`ship`, `bullets`, `asteroids`, `particles`, `score`, `lives`, `level`, `state`); funciones `update`/`draw`; loop con `requestAnimationFrame` y delta time en segundos (tope 0.05s). Entrada: `index.html` carga `game.js` con `<script>` plano.
- **Sin imports/exports**. Todo queda en scope global. No añadas `import` ni ESM sin cambiar también `index.html` a `<script type="module">`; de lo contrario se rompe.
- Máquina de estados con la variable global `state`: `'playing' | 'dead' | 'gameover'`. `update()` ramifica por estado.
- Espacio toroidal: los bordes envuelven con `wrap(v, max)`.

## Gotchas críticos

- **Canvas 800x600 está hardcodeado en DOS sitios**: el `<canvas>` de `index.html` y las constantes `W`/`H` de `game.js`. Cámbialos siempre juntos o se descuadra el render y el wrap.
- **Semántica de input**: `keys` indica tecla mantenida (rotación, propulsión); `pressed(code)` captura un solo frame y **limpia** el flag al leerlo (disparo, reinicio). No uses `pressed()` para movimiento sostenido ni `keys` para acciones discretas: rompes la distinción "presionado / mantenido".
- **Constantes de tuning** (`RADII`, `SPEEDS`, `POINTS`) indexadas por `size` 1..3 (3 = grande, 1 = pequeño); el índice 0 no se usa. `POINTS = [0,100,50,20]` → pequeño=100, mediano=50, grande=20.
- **Textos de UI en español** (`NIVEL`, `PUNTAJE`, `ESPACIO PARA REINICIAR`). Mantén los strings nuevos en español.

## Notas

- El `README.md` menciona "power-ups" y "estrella fugaz" que **no están implementados** en `game.js`. La fuente de verdad es el código: no asumas esas características como existentes ni las "arregles" basándote solo en el README.