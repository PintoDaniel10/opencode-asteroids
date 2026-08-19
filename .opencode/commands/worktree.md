---
description: Crea un git worktree en .worktrees/ a partir del argumento.
---

Crea un git worktree a partir del siguiente argumento del usuario:

$ARGUMENTS

Reglas estrictas:

1. Analiza el argumento y deriva un único nombre de worktree en formato slug:
   - minúsculas
   - palabras separadas por un solo guion
   - sin espacios
   - sin barras: convierte cualquier '/' en '-'
   - corto y descriptivo según el contexto del argumento
   - si el argumento ya es un slug válido, úsalo tal cual
   Ejemplos: "fix the bullets bug" -> "fix-the-bullets-bug";
   "feature/triple-shot" -> "feature-triple-shot"; "refactor" -> "refactor".

2. Ejecuta EXACTAMENTE este comando bash, sustituyendo <nombre> por el slug
   derivado, y nada más:
   git worktree add .worktrees/<nombre>

3. No hagas nada adicional:
   - No cambies de directorio (no uses `cd`; el comando ya corre en la raíz
     del proyecto).
   - No pases flags extra (-b, -B, --detach, etc.).
   - No crees la carpeta .worktrees/ a mano; git worktree add la crea.
   - No edites archivos, no hagas commit, no push, no reportes de estado extra.

4. Devuelve únicamente el resultado de la ejecución del comando.
5. Si el argumentos es muy largo, simplificalo a un nombre significativo.