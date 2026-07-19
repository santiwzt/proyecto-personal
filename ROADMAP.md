# Roadmap

## MVP + Version 0.2 + Version 0.3 (entregado)

Ver el README para la lista completa de funciones implementadas. Resumen:
autenticacion real contra Supabase (con recuperacion de contraseña) o modo
demo, onboarding, dashboard "Hoy", materias/temas/examenes con preparacion
explicable, tareas, agenda con vista de semana y de mes, deteccion
determinística de conflictos, planificador semanal con aprobacion explicita,
archivos con extraccion real de texto, asistente de IA heuristico (sin costo)
con fuentes citadas y consejos generales cuando no hay material que coincida,
generador de preguntas y correccion, proyectos con "proximo paso", captura
rapida en español natural, habitos con rachas, entrenamiento con volumen
semanal, objetivos con seguimiento de progreso, gastos con categorias,
presupuesto mensual y grafico por categoria, notificaciones push (PWA
instalable), editar perfil, exportar todos los datos a JSON, eliminar cuenta,
configuracion, y una suite de tests (unit + integration + e2e).

`src/server/repositories/*` ya tiene una implementacion dual demo/Supabase en
cada archivo (no solo preparada — ver ADR 0002 para el contexto original de
por que se diferio, y el codigo actual para el estado real).

## Siguiente prioridad

1. **Mejoras de planificador**: resolver la limitacion conocida de
   granularidad por dia (ver ADR 0004), soporte para bloquear horarios
   fijos directamente desde la UI del planificador.
2. **Busqueda semantica real**: deliberadamente no implementada por ahora
   -- ver ADR 0007 (mismo problema de costo por request que el motor de IA
   principal). El punto de entrada (`EMBEDDING_PROVIDER`, columna
   `file_chunks.embedding`) sigue listo si se revisita mas adelante.
3. **Objetivos conectados con tareas/proyectos**: hoy `goals` es
   independiente; falta poder vincular un objetivo a las tareas o proyectos
   que contribuyen a el.

## Futuro (sin comprometer fecha)

- Integracion con Google Calendar / Gmail
- Aplicacion movil nativa
- Reconocimiento de escritura (apuntes fotografiados)
- Estadisticas deportivas mas ricas
- Seguimiento de gimnasio (series, pesos, progresion)
- Presupuesto personal multi-moneda (hoy el presupuesto mensual es solo ARS)
- Colaboracion con profesores / grupos escolares
- Modelo de suscripcion
- Adaptacion explicita para universidades / trabajadores (el modelo de
  datos ya no esta atado a "estudiante secundario" — `Profile.role` ya
  contempla otros perfiles)
- Asistente por voz
- Modo offline / sincronizacion local-first
