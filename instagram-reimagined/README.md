# Instagram Reimaginado

Rediseño ético de Instagram para el trabajo escolar **"Rediseñar una app desde la ética"**.

> ¿Cómo sería Instagram si estuviera diseñada para priorizar el bienestar de sus usuarios en lugar de maximizar el tiempo que pasan conectados?

Es una aplicación web interactiva (no un mockup): las dos versiones de Instagram funcionan de verdad, con datos ficticios y sin conectarse a ninguna cuenta real.

## Cómo correrlo

Necesitás Node.js 20 o más nuevo.

```bash
cd instagram-reimagined
npm install
npm run dev
```

Abrí la dirección que muestra la terminal (normalmente http://localhost:5173).

Para la versión final optimizada:

```bash
npm run build
npm run preview
```

Otros comandos: `npm test` (tests de la lógica), `npm run typecheck`, `npm run check` (todo junto).

## Qué incluye

| Sección | Qué hay |
| --- | --- |
| **Inicio** | Presentación del proyecto, los seis cambios (A–F) y cómo recorrerlo. |
| **Simulador** | Un teléfono con Instagram completo. El interruptor de arriba cambia entre *Instagram actual* e *Instagram ético*, y un panel explica qué mecanismo está activo en cada pantalla. |
| **Comparar** | Dos teléfonos interactivos lado a lado (feed, notificaciones, reels, perfil y explorar) con ejemplos concretos y una tabla resumen. |
| **Análisis ético** | Notificaciones, algoritmo, interfaz y métricas: cómo funcionan, qué emociones generan y qué riesgos tienen, separando **datos comprobados** de **posibles efectos**. Cada una tiene una demo interactiva. |
| **Presentación** | Cinco diapositivas con flechas del teclado y pantalla completa (tecla **F**) para exponer en clase. |

### Instagram actual (antes)

Feed con scroll infinito real, historias que se encadenan solas (incluso de cuentas que no seguís), reels infinitos en bucle, notificaciones con urgencia artificial y contadores rojos, banners que interrumpen cada ~20 segundos, likes y seguidores protagonistas, Explorar sin fondo que repite lo más viral.

### Instagram ético (después)

- **A. Scroll consciente:** el feed llega en bloques de 5 y pregunta *"Ya viste las novedades más importantes. ¿Querés seguir o hacer una pausa?"*. Al terminar aparece *"Estás al día"*. Indicador discreto de tiempo de uso.
- **B. Notificaciones inteligentes:** lo importante (mensajes, menciones) primero; el resto agrupado en un resumen. Elegís cuándo recibirlas y qué categorías. Lenguaje neutro.
- **C. Algoritmo transparente:** botón *"¿Por qué?"* en cada publicación, feed cronológico o personalizado, control de intereses, *"ver menos de esto"* y nunca más de 2 publicaciones seguidas del mismo tema.
- **D. Métricas saludables:** likes ocultos por defecto, seguidores en segundo plano, métricas privadas que priorizan interacciones significativas.
- **E. Modo bienestar:** interfaz más tranquila, recordatorios de descanso configurables, panel de tiempo de uso, sin mensajes culpabilizadores.
- **F. Reels conscientes:** contador, pausas opcionales cada N reels, límite diario y *"Terminar sesión"* sin perder lo guardado.

### Tips para la exposición

- En el panel del simulador (versión ética) usá **+10 min** o **Acelerar ×60** para que aparezca el recordatorio de descanso sin esperar.
- En **Reels**, deslizá 5 videos en la versión ética para mostrar la pausa.
- **Reiniciar demo** está en el panel de Bienestar (ícono de hoja dentro del teléfono).
- Lo que hacés (likes, guardados, ajustes) se guarda solo en tu navegador.

## Cómo está hecho

- React 19 + TypeScript + Vite, Tailwind CSS, Framer Motion e íconos Lucide.
- Router por hash: funciona en cualquier hosting estático, sin servidor.
- Las "fotos" son ilustraciones vectoriales generadas por código (`src/components/art/SceneArt.tsx`): no hay imágenes de personas reales y funciona sin internet.
- La lógica está separada de la interfaz en `src/lib` (feed, algoritmo, notificaciones, reels) y tiene tests en `tests/`.
- Respeta la preferencia del sistema "reducir movimiento".

```
src/
  components/
    phone/       teléfono simulado: feed, reels, notificaciones, explorar, perfil
    analysis/    demos interactivas del análisis
    layout/      barra superior, interruptor de versión, pie
    art/         ilustraciones y avatares
    ui/          componentes base (hoja inferior, interruptor, selector)
  data/          contenido ficticio y textos del análisis
  lib/           lógica pura (con tests)
  pages/         Inicio, Simulador, Comparar, Análisis, Presentación
  state/         estado global, tiempo de uso simulado, router y tema
```

## Publicarlo

Es un sitio estático: `npm run build` genera la carpeta `dist/`. En Vercel, creá un proyecto con *Root Directory* `instagram-reimagined`, comando `npm run build` y salida `dist`.

## Aclaración

Proyecto escolar con datos ficticios. No está afiliado a Meta ni a Instagram. Los datos sobre funciones reales de Instagram (ocultar likes, "Tomate un descanso", feed cronológico, etc.) se basan en anuncios públicos de la empresa; los efectos sobre las personas se presentan como *posibles*, no como algo que le pase a todo el mundo.
