# Roadmap

## MVP (entregado)

Ver el README para la lista completa de funciones implementadas. Resumen:
autenticacion (demo + Supabase preparado), onboarding, dashboard "Hoy",
materias/temas/examenes con preparacion explicable, tareas, agenda con
deteccion determinística de conflictos, planificador semanal con
aprobacion explicita, archivos con extraccion real de texto, asistente de
IA con fuentes citadas, generador de preguntas y correccion, proyectos con
"proximo paso", captura rapida en español natural, gastos basico,
configuracion, y una suite de tests (unit + integration + e2e).

## Version 0.2 (siguiente prioridad)

1. **Conectar un proyecto real de Supabase**: implementar
   `src/server/repositories/*` contra `supabase-js` (las migraciones, tipos
   y clientes ya estan listos — ver ADR 0002), migrar `getSessionUser()` a
   sesiones reales, y sincronizar el modo demo como un modo explicito de
   "solo lectura/reseteable" en vez del unico camino disponible.
2. **Habitos**: registro diario (`habit_logs`, ya modelado en la base de
   datos), rachas, vista semanal.
3. **Entrenamiento**: sesiones (`training_sessions`, ya modelado), volumen
   semanal, integracion con la agenda mas alla de eventos genericos.
4. **Embeddings reales**: activar `EMBEDDING_PROVIDER` para busqueda
   semantica sobre `file_chunks.embedding` (columna `pgvector` ya lista),
   con la busqueda de texto completo actual como fallback cuando no este
   configurado.
5. **Notificaciones**: recordatorios de tareas/examenes proximos, resumen
   diario.

## Version 0.3

1. **Gastos**: categorias personalizables, presupuesto mensual simple,
   graficos basicos.
2. **Objetivos (`goals`)**: la tabla ya existe en el esquema; falta la UI y
   su conexion con tareas/proyectos.
3. **Exportacion de datos del usuario** (JSON descargable: materias,
   tareas, examenes, proyectos, archivos metadata) — ya contemplado como
   requisito de privacidad, pendiente de implementar la UI.
4. **Eliminacion de cuenta**: flujo completo de borrado de todos los datos
   del usuario (relevante sobre todo en modo Supabase).
5. **Mejoras de planificador**: resolver la limitacion conocida de
   granularidad por dia (ver ADR 0004), soporte para bloquear horarios
   fijos directamente desde la UI del planificador.

## Futuro (sin comprometer fecha)

- Integracion con Google Calendar / Gmail
- Aplicacion movil nativa
- Reconocimiento de escritura (apuntes fotografiados)
- Estadisticas deportivas mas ricas
- Seguimiento de gimnasio (series, pesos, progresion)
- Presupuesto personal completo
- Colaboracion con profesores / grupos escolares
- Modelo de suscripcion
- Adaptacion explicita para universidades / trabajadores (el modelo de
  datos ya no esta atado a "estudiante secundario" — `Profile.role` ya
  contempla otros perfiles)
- Asistente por voz
- Modo offline / sincronizacion local-first
