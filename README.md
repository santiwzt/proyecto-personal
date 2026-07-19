# Nexo Personal OS

Sistema operativo personal con inteligencia artificial para organizar
estudios, examenes, proyectos, actividades, objetivos, habitos, archivos y
planificacion diaria.

No es un calendario, ni una lista de tareas, ni un chatbot generico: es una
capa que conecta materias, examenes, tareas, horarios, disponibilidad,
proyectos y material de estudio para proponer planes realistas, explicar
*por que*, y nunca tomar una accion irreversible sin tu aprobacion.

> El nombre del producto se puede cambiar en cualquier momento editando
> `src/config/app.ts` — no esta hardcodeado en ningun otro lado.

## Estado actual del proyecto

MVP funcional, corriendo en produccion contra un proyecto real de Supabase
(auth, base de datos, recuperacion de contraseña) con **modo demo** (sin
credenciales, datos en memoria) disponible para probarlo sin setup.
Ver [ROADMAP.md](./ROADMAP.md) para lo que sigue.

## Funciones implementadas

- **Autenticacion**: registro/login real contra Supabase Auth (con
  confirmacion por email y recuperacion de contraseña), o modo demo (cookie
  de sesion, sin password) para probar la app sin crear cuenta.
- **Onboarding** inicial (nombre, rol).
- **Dashboard "Hoy"**: proximo compromiso, tareas importantes, examenes
  cercanos con preparacion estimada, tiempo de estudio recomendado, progreso
  diario, conflictos detectados, actividad reciente.
- **Materias**: color, profesor, curso, temas con estado/confianza propia y
  estimada, examenes, archivos asociados.
- **Examenes**: preparacion estimada explicable (factores visibles, no una
  cifra misteriosa).
- **Tareas**: prioridad, fecha limite, estado (con "vencida" calculado en
  vivo).
- **Agenda**: vista de semana y de mes (con el dia actual resaltado), tocar
  un dia abre un dialogo para agregar un evento o tarea a esa fecha
  eligiendo el horario; eventos, disponibilidad semanal, deteccion
  determinística de conflictos (solapamientos, fuera de disponibilidad,
  sobrecarga diaria, examenes sin sesiones, descansos insuficientes).
- **Planificador semanal con IA**: genera una propuesta de bloques de
  estudio (con motivo explicado para cada uno) que **requiere aprobacion
  explicita** antes de tocar la agenda real. El algoritmo de planificacion
  en si es codigo determinístico, no un llamado a un modelo — ver
  [docs/decisions/0004](./docs/decisions/0004-planner-is-deterministic.md).
- **Archivos**: sube PDF/DOCX/TXT/Markdown/imagenes; validacion real de
  MIME (no por extension), deduplicado por hash, extraccion de texto real
  (o un aviso honesto cuando no se puede, p. ej. un PDF escaneado).
- **Asistente de IA basado en archivos**: chat con streaming, con fuentes
  citadas, que solo usa el material que autorizaste. Sin proveedor de IA
  configurado, responde citando texto real de tus archivos y, cuando no
  encuentra nada relacionado, da consejos generales de estudio en vez de
  simplemente disculparse.
- **Generador de preguntas de practica** y **correccion de respuestas**
  (opcion multiple, verdadero/falso, respuesta breve, desarrollo), con pista
  antes de la solucion completa.
- **Proyectos personales** con "proximo paso" siempre visible.
- **Objetivos**: metas de mediano/largo plazo con fecha limite opcional y
  seguimiento de progreso.
- **Habitos**: registro diario, rachas, vista semanal.
- **Entrenamiento**: sesiones con volumen semanal.
- **Gastos**: registro con categorias (con autocompletado), presupuesto
  mensual y grafico de gasto por categoria.
- **Captura rapida**: interpreta frases en español natural (tareas,
  examenes, eventos, ideas, gastos) y siempre pide confirmacion antes de
  guardar.
- **Notificaciones push** (PWA instalable) para examenes/tareas proximos.
- **Configuracion**: editar perfil, preferencias, consentimiento de IA,
  exportar todos tus datos a JSON, eliminar la cuenta por completo.
- Suite de tests automatizados (unitarios, de integracion, y un recorrido
  end-to-end con Playwright).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript estricto
- Tailwind CSS v4
- Componentes accesibles construidos sobre Radix UI + `class-variance-authority`
- Zod para validacion, React Hook Form donde hace falta
- Supabase (Postgres + Auth + Storage) — preparado, modo demo por defecto
- Anthropic SDK (Claude) con fallback heuristico sin costo cuando no hay
  API key configurada
- Vitest + Testing Library, Playwright
- ESLint + Prettier

Ver [docs/decisions](./docs/decisions) para el razonamiento detras de cada
eleccion (incluyendo por que ESLint y TypeScript estan fijados a versiones
especificas).

## Requisitos

- Node.js 20 o superior
- pnpm 10 (el script de instalacion lo instala via corepack si falta)
- Git (opcional para correr la app, necesario para contribuir)

## Instalacion

### Windows (PowerShell)

```powershell
git clone <url-del-repositorio>
cd nexo-personal-os
./scripts/setup.ps1
```

### macOS / Linux

```bash
git clone <url-del-repositorio>
cd nexo-personal-os
./scripts/setup.sh
```

Ambos scripts: comprueban Node/pnpm, instalan dependencias, crean
`.env.local` desde `.env.example` (sin sobrescribir uno existente), y
corren lint/typecheck/tests para confirmar que todo esta en orden.

## Variables de entorno

Ver [`.env.example`](./.env.example) para la lista completa con
comentarios. Ninguna tiene un valor real — `.env.local` (git-ignorado) es
donde va tu configuracion real, si la necesitas.

Con `NEXT_PUBLIC_DATA_MODE=demo` (el valor por defecto) **no necesitas
ninguna otra variable** para correr la aplicacion completa.

## Configuracion de Supabase (opcional)

Solo necesaria si queres usar `NEXT_PUBLIC_DATA_MODE=supabase` en vez del
modo demo:

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia la URL y las claves (`anon` y `service_role`) a `.env.local`.
3. Aplica las migraciones: `pnpm db:migrate` (requiere el Supabase CLI
   instalado y autenticado, o una variable `DATABASE_URL` — el script te
   indica exactamente que falta si algo no esta configurado).
4. Opcional: `pnpm db:seed` para cargar datos de ejemplo.
5. Opcional: `pnpm db:generate` para regenerar `src/types/database.ts` desde
   el esquema real.

La capa de repositorios (`src/server/repositories`) ya implementa ambos
modos en cada archivo (demo y Supabase real) — ver
[docs/decisions/0002](./docs/decisions/0002-supabase-repository-deferred.md)
para el contexto de por que se empezo solo con demo mode. Si ya tenes un
proyecto de Supabase conectado, recorda correr `pnpm db:migrate` (o pegar el
SQL nuevo en el editor de Supabase) cada vez que se agrega una migracion —
de lo contrario las columnas/tablas nuevas no van a existir todavia del lado
real, aunque el modo demo funcione sin problema.

## Migraciones

Todas las migraciones SQL versionadas estan en `supabase/migrations/`
(28 tablas, Row Level Security en todas, `pgvector` + busqueda de texto
completo para `file_chunks`). `supabase/seed.sql` tiene datos de
demostracion con UUIDs fijos.

## Ejecucion local

```bash
pnpm dev
```

Abri [http://localhost:3000](http://localhost:3000) y eleg "Continuar en
modo demo".

## Modo demo

Activo por defecto (`NEXT_PUBLIC_DATA_MODE=demo`). Corre enteramente sobre
un store en memoria (`src/lib/database/demo`), sin ninguna credencial
externa. Se reinicia con cada reinicio del servidor — **no es persistencia
real** y la interfaz lo deja claro (badge "Modo demo" visible). Viene
precargado con materias, un examen proximo, tareas (algunas vencidas a
proposito), un proyecto, y un conflicto de agenda de ejemplo, para poder
recorrer el producto completo desde el primer minuto.

## Testing

```bash
pnpm test          # unitarios + integracion (Vitest)
pnpm test:watch    # modo watch
pnpm test:e2e      # recorrido end-to-end (Playwright)
pnpm check         # lint + typecheck + test + build, en ese orden
```

La suite cubre: deteccion de conflictos, calculo de preparacion de examen,
motor del planificador, parser de captura rapida, division de documentos,
recuperacion de contexto (RAG), generacion de preguntas, correccion de
respuestas, validacion de archivos, aislamiento entre usuarios, y
autenticacion/limite de uso en los endpoints de IA — mas un recorrido
completo end-to-end contra un navegador real.

## Estructura del proyecto

```text
src/
  app/            Rutas (App Router). Delegan todo a features/server/.
  components/     ui (primitivas), layout (chrome), shared (transversales)
  features/       Componentes de presentacion por funcionalidad
  lib/            ai, auth, database, storage, validation, dates, errors
  server/
    actions/      Server Actions: validar -> autorizar -> repos/services
    repositories/ Unico lugar que toca persistencia (demo o Supabase)
    services/     Logica de negocio pura, sin dependencias de framework
  types/          domain.ts (fuente de verdad) y database.ts
  config/         app.ts (identidad del producto), env.ts (validado con zod)
tests/
  unit/           Servicios puros
  integration/    Server actions con auth simulada
  e2e/            Recorrido completo con Playwright
supabase/
  migrations/     SQL versionado
  seed.sql        Datos de demostracion (no para produccion)
scripts/          setup.sh, setup.ps1, scripts de base de datos
docs/
  decisions/      Registro de decisiones arquitectonicas (ADRs)
```

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para el detalle de cada capa y los
flujos principales (auth, archivos, RAG, planificador).

## Seguridad

Ver [SECURITY.md](./SECURITY.md). En resumen: aislamiento estricto por
usuario (en codigo para el modo demo, con RLS para Supabase), validacion de
archivos por contenido real (no por extension), rate limiting configurable
en los endpoints de IA, y la clave de servicio de Supabase confinada a un
unico archivo server-only.

## Roadmap

Ver [ROADMAP.md](./ROADMAP.md).

## Problemas comunes

- **`pnpm lint` falla con un error de ESLint/plugin-react**: asegurate de
  tener las versiones exactas fijadas en `package.json` (`eslint@9.39.5`).
  Ver [docs/decisions/0006](./docs/decisions/0006-tooling-version-pins.md).
- **El build falla por variables de entorno**: en modo demo no deberia
  faltar ninguna — `NEXT_PUBLIC_DATA_MODE=demo` es el valor por defecto.
- **Playwright no encuentra un navegador**: en tu maquina, correlo
  normalmente (`pnpm exec playwright install chromium` una vez). Este
  repositorio corrio sus pruebas de desarrollo contra un sandbox con un
  Chromium pre-instalado en una ruta particular; `playwright.config.ts` solo
  lo usa si esa ruta existe, así que en cualquier otra maquina cae al
  comportamiento estandar de Playwright.
- **El asistente/planificador no generan texto con IA**: revisa que
  `ANTHROPIC_API_KEY` este configurada en `.env.local`. Sin ella, esas
  funciones siguen andando en su modo heuristico (gratis, sin llamadas
  externas), pero con respuestas mas simples.

## Como contribuir

Ver [CONTRIBUTING.md](./CONTRIBUTING.md).
