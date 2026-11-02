# 0008 — "Instagram Reimaginado" vive como app independiente en `instagram-reimagined/`

## Status
Accepted

## Context
Se pidió un trabajo escolar ("Rediseñar una app desde la ética"): una
simulación interactiva de Instagram antes/después centrada en el bienestar
digital, con React, TypeScript, Tailwind CSS y Framer Motion. No tiene
relación funcional con Nexo Personal OS: no usa su autenticación, su base de
datos, su capa de IA ni sus convenciones de dominio, y debe poder abrirse y
presentarse en clase sin credenciales ni servidor.

## Decision
El proyecto se agrega como una app separada en `instagram-reimagined/`:

- **Vite + React + TypeScript + Tailwind CSS 3 + Framer Motion + Lucide**,
  con su propio `package.json` y `package-lock.json` (npm), independiente
  del workspace pnpm de Nexo.
- Es un sitio 100% estático (router por hash), así que se puede publicar en
  cualquier hosting estático o abrir con `npm run preview`.
- La lógica pura (feed, algoritmo, notificaciones, reels) está en
  `instagram-reimagined/src/lib` con tests propios en Vitest.
- La raíz excluye la carpeta de ESLint, `tsconfig.json` y Prettier para que
  `pnpm check` de Nexo no dependa de este proyecto, y el CI tiene un job
  aparte para él.

No se cambia el stack de Nexo (Next.js) en ningún aspecto.

## Consequences
- Dos gestores de paquetes conviven en el repo (pnpm en la raíz, npm en la
  subcarpeta). Es intencional para que cada proyecto se instale solo.
- Para desplegarlo en Vercel hay que crear un proyecto aparte con
  *Root Directory* `instagram-reimagined`, build `npm run build` y salida
  `dist`.
