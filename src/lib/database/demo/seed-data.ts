import { addDays, format } from "date-fns";
import { DEMO_USER_ID, SECONDARY_DEMO_USER_ID } from "./ids";
import type {
  ActivityLogEntry,
  AvailabilityRule,
  CalendarEvent,
  Conversation,
  Exam,
  Expense,
  FileAsset,
  FileChunk,
  Habit,
  Idea,
  Message,
  PracticeAttempt,
  PracticeQuestion,
  PracticeSet,
  Project,
  ProjectTask,
  StudySession,
  StudyTopic,
  Subject,
  Task,
} from "@/types/domain";

function atDay(now: Date, dayOffset: number, hh: number, mm: number): string {
  const base = addDays(now, dayOffset);
  const dateStr = format(base, "yyyy-MM-dd");
  return `${dateStr}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00-03:00`;
}

/** Smallest positive offset (in days) so that now+offset falls on `targetDow` (0=Sun..6=Sat). */
function nextWeekdayOffset(now: Date, targetDow: number): number {
  const currentDow = now.getDay();
  let diff = targetDow - currentDow;
  if (diff <= 0) diff += 7;
  return diff;
}

export interface SeedData {
  subjects: Subject[];
  studyTopics: StudyTopic[];
  exams: Exam[];
  tasks: Task[];
  events: CalendarEvent[];
  availabilityRules: AvailabilityRule[];
  projects: Project[];
  projectTasks: ProjectTask[];
  ideas: Idea[];
  files: FileAsset[];
  fileChunks: FileChunk[];
  conversations: Conversation[];
  messages: Message[];
  practiceSets: PracticeSet[];
  practiceQuestions: PracticeQuestion[];
  practiceAttempts: PracticeAttempt[];
  studySessions: StudySession[];
  habits: Habit[];
  expenses: Expense[];
  activityLog: ActivityLogEntry[];
}

export function buildSeedData(now: Date = new Date()): SeedData {
  const createdAt = atDay(now, -30, 9, 0);
  const mondayOffset = nextWeekdayOffset(now, 1);
  const saturdayOffset = nextWeekdayOffset(now, 6);
  const sundayOffset = nextWeekdayOffset(now, 0);
  const wednesdayOffset = nextWeekdayOffset(now, 3);

  const subjects: Subject[] = [
    {
      id: "sub-fisica",
      userId: DEMO_USER_ID,
      name: "Fisica",
      color: "blue",
      teacher: "Prof. Gomez",
      course: "5to año",
      description: "Cinematica y dinamica basica.",
      createdAt,
      archivedAt: null,
    },
    {
      id: "sub-matematica",
      userId: DEMO_USER_ID,
      name: "Matematica",
      color: "violet",
      teacher: "Prof. Diaz",
      course: "5to año",
      description: "Ecuaciones y funciones.",
      createdAt,
      archivedAt: null,
    },
  ];

  const studyTopics: StudyTopic[] = [
    {
      id: "top-mru",
      userId: DEMO_USER_ID,
      subjectId: "sub-fisica",
      name: "MRU",
      status: "practicando",
      selfConfidence: 70,
      estimatedConfidence: 60,
      commonMistakes: ["Confundir velocidad con aceleracion"],
      notes: null,
      lastPracticedAt: atDay(now, -5, 19, 0),
      createdAt,
    },
    {
      id: "top-mruv",
      userId: DEMO_USER_ID,
      subjectId: "sub-fisica",
      name: "MRUV",
      status: "aprendiendo",
      selfConfidence: 50,
      estimatedConfidence: 40,
      commonMistakes: ["Errores de signo en la aceleracion"],
      notes: null,
      lastPracticedAt: atDay(now, -10, 19, 0),
      createdAt,
    },
    {
      id: "top-caida-libre",
      userId: DEMO_USER_ID,
      subjectId: "sub-fisica",
      name: "Caida libre",
      status: "practicando",
      selfConfidence: 65,
      estimatedConfidence: 55,
      commonMistakes: [],
      notes: null,
      lastPracticedAt: atDay(now, -6, 19, 0),
      createdAt,
    },
    {
      id: "top-tiro-vertical",
      userId: DEMO_USER_ID,
      subjectId: "sub-fisica",
      name: "Tiro vertical",
      status: "aprendiendo",
      selfConfidence: 20,
      estimatedConfidence: 15,
      commonMistakes: [
        "Confundir el signo de la velocidad al subir y al bajar",
        "Olvidar que la velocidad en el punto mas alto es cero",
      ],
      notes: "Todavia no entiendo bien este tema.",
      lastPracticedAt: null,
      createdAt,
    },
    {
      id: "top-ecuaciones",
      userId: DEMO_USER_ID,
      subjectId: "sub-matematica",
      name: "Ecuaciones",
      status: "dominado",
      selfConfidence: 90,
      estimatedConfidence: 85,
      commonMistakes: [],
      notes: null,
      lastPracticedAt: atDay(now, -3, 18, 0),
      createdAt,
    },
    {
      id: "top-funciones",
      userId: DEMO_USER_ID,
      subjectId: "sub-matematica",
      name: "Funciones",
      status: "practicando",
      selfConfidence: 60,
      estimatedConfidence: 55,
      commonMistakes: [],
      notes: null,
      lastPracticedAt: atDay(now, -8, 18, 0),
      createdAt,
    },
  ];

  const exams: Exam[] = [
    {
      id: "exam-fisica-cinematica",
      userId: DEMO_USER_ID,
      subjectId: "sub-fisica",
      title: "Examen de Fisica: Cinematica",
      scheduledAt: atDay(now, mondayOffset, 9, 0),
      durationMinutes: 80,
      topicIds: ["top-mru", "top-mruv", "top-caida-libre", "top-tiro-vertical"],
      importance: "alta",
      status: "programado",
      fileIds: ["file-tiro-vertical"],
      resultScore: null,
      resultNotes: null,
      createdAt,
    },
  ];

  const tasks: Task[] = [
    {
      id: "task-carpeta",
      userId: DEMO_USER_ID,
      title: "Llevar la carpeta de Fisica",
      description: null,
      dueAt: atDay(now, 1, 8, 0),
      estimatedMinutes: 5,
      priority: "media",
      status: "pendiente",
      subjectId: "sub-fisica",
      projectId: null,
      isFixed: true,
      completedAt: null,
      createdAt,
    },
    {
      id: "task-informe-matematica",
      userId: DEMO_USER_ID,
      title: "Entregar informe de Matematica",
      description: "Ejercicios del capitulo 4.",
      dueAt: atDay(now, -3, 23, 59),
      estimatedMinutes: 60,
      priority: "alta",
      status: "pendiente",
      subjectId: "sub-matematica",
      projectId: null,
      isFixed: false,
      completedAt: null,
      createdAt,
    },
    {
      id: "task-estudiar-tiro-vertical",
      userId: DEMO_USER_ID,
      title: "Estudiar tiro vertical",
      description: "Repasar formulas y hacer ejercicios de practica.",
      dueAt: atDay(now, mondayOffset - 1, 20, 0),
      estimatedMinutes: 60,
      priority: "alta",
      status: "pendiente",
      subjectId: "sub-fisica",
      projectId: null,
      isFixed: false,
      completedAt: null,
      createdAt,
    },
  ];

  const events: CalendarEvent[] = [
    {
      id: "evt-entrenamiento",
      userId: DEMO_USER_ID,
      title: "Entrenamiento de futbol",
      category: "entrenamiento",
      startsAt: atDay(now, wednesdayOffset, 18, 0),
      endsAt: atDay(now, wednesdayOffset, 20, 0),
      location: "Club",
      isFixed: true,
      relatedExamId: null,
      relatedTaskId: null,
      relatedProjectId: null,
      notes: null,
      createdAt,
    },
    {
      id: "evt-partido",
      userId: DEMO_USER_ID,
      title: "Partido de futbol",
      category: "partido",
      startsAt: atDay(now, sundayOffset, 10, 0),
      endsAt: atDay(now, sundayOffset, 12, 0),
      location: "Cancha municipal",
      isFixed: true,
      relatedExamId: null,
      relatedTaskId: null,
      relatedProjectId: null,
      notes: null,
      createdAt,
    },
    {
      id: "evt-estudio-sabado",
      userId: DEMO_USER_ID,
      title: "Bloque de estudio",
      category: "estudio",
      startsAt: atDay(now, saturdayOffset, 10, 0),
      endsAt: atDay(now, saturdayOffset, 12, 0),
      location: null,
      isFixed: false,
      relatedExamId: "exam-fisica-cinematica",
      relatedTaskId: null,
      relatedProjectId: null,
      notes: null,
      createdAt,
    },
    {
      id: "evt-cumple-conflicto",
      userId: DEMO_USER_ID,
      title: "Cumpleaños de un amigo",
      category: "personal",
      startsAt: atDay(now, saturdayOffset, 11, 0),
      endsAt: atDay(now, saturdayOffset, 13, 0),
      location: null,
      isFixed: true,
      relatedExamId: null,
      relatedTaskId: null,
      relatedProjectId: null,
      notes: "Se superpone a proposito con el bloque de estudio para mostrar deteccion de conflictos.",
      createdAt,
    },
  ];

  const availabilityRules: AvailabilityRule[] = [
    {
      id: "avail-colegio",
      userId: DEMO_USER_ID,
      weekday: 1,
      startTime: "08:00",
      endTime: "13:00",
      kind: "no_disponible",
      label: "Colegio",
    },
    {
      id: "avail-sabado",
      userId: DEMO_USER_ID,
      weekday: 6,
      startTime: "09:00",
      endTime: "11:00",
      kind: "disponible",
      label: "Solo dos horas para estudiar los sabados",
    },
  ];

  const projects: Project[] = [
    {
      id: "proj-unity-terror",
      userId: DEMO_USER_ID,
      name: "Juego de terror en Unity",
      description: "Prototipo de un juego de terror en primera persona.",
      status: "en_progreso",
      priority: "media",
      targetDate: format(addDays(now, 60), "yyyy-MM-dd"),
      technologies: ["Unity", "C#"],
      links: [],
      nextStep: "Implementar el sistema de iluminacion y sonido ambiental",
      progress: 35,
      createdAt,
    },
  ];

  const projectTasks: ProjectTask[] = [
    {
      id: "ptask-nivel-1",
      userId: DEMO_USER_ID,
      projectId: "proj-unity-terror",
      title: "Diseñar el primer nivel",
      status: "pendiente",
      createdAt,
    },
    {
      id: "ptask-inventario",
      userId: DEMO_USER_ID,
      projectId: "proj-unity-terror",
      title: "Programar el sistema de inventario",
      status: "en_progreso",
      createdAt,
    },
  ];

  const ideas: Idea[] = [
    {
      id: "idea-multijugador",
      userId: DEMO_USER_ID,
      content: "Agregar un modo multijugador local al juego de terror",
      tags: ["proyecto", "unity"],
      convertedToProjectId: null,
      convertedToTaskId: null,
      createdAt: atDay(now, -2, 21, 0),
    },
  ];

  const tiroVerticalText =
    "Tiro vertical: es un movimiento rectilineo uniformemente variado donde un objeto se lanza " +
    "hacia arriba con una velocidad inicial y la unica aceleracion que actua es la de la gravedad " +
    "(g = 9,8 m/s2), siempre dirigida hacia abajo. Formulas clave: v(t) = v0 - g*t, y(t) = y0 + v0*t - " +
    "(1/2)*g*t^2, v^2 = v0^2 - 2*g*(y - y0). En el punto mas alto la velocidad es cero pero la " +
    "aceleracion sigue siendo g. Error comun: creer que la aceleracion se anula en el punto mas alto. " +
    "El tiempo de subida es igual al tiempo de bajada (despreciando el rozamiento del aire) y la " +
    "velocidad de llegada al punto de partida tiene la misma magnitud que la velocidad inicial, con " +
    "signo opuesto.";

  const files: FileAsset[] = [
    {
      id: "file-tiro-vertical",
      userId: DEMO_USER_ID,
      originalName: "Resumen tiro vertical.txt",
      safeName: "resumen-tiro-vertical.txt",
      mimeType: "text/plain",
      sizeBytes: tiroVerticalText.length,
      storagePath: "demo/file-tiro-vertical.txt",
      status: "listo",
      subjectId: "sub-fisica",
      projectId: null,
      extractedText: tiroVerticalText,
      processingError: null,
      contentHash: "demo-hash-tiro-vertical",
      createdAt: atDay(now, -4, 20, 0),
    },
  ];

  const fileChunks: FileChunk[] = [
    {
      id: "chunk-tiro-vertical-1",
      userId: DEMO_USER_ID,
      fileId: "file-tiro-vertical",
      chunkIndex: 0,
      content: tiroVerticalText,
      charCount: tiroVerticalText.length,
      page: null,
      embedding: null,
    },
  ];

  const conversations: Conversation[] = [
    {
      id: "conv-tiro-vertical",
      userId: DEMO_USER_ID,
      title: "Dudas sobre tiro vertical",
      scope: { type: "subject", subjectId: "sub-fisica" },
      createdAt: atDay(now, -4, 20, 15),
    },
  ];

  const messages: Message[] = [
    {
      id: "msg-1",
      conversationId: "conv-tiro-vertical",
      userId: DEMO_USER_ID,
      role: "user",
      content: "¿Por que la velocidad en el punto mas alto del tiro vertical es cero?",
      sources: [],
      createdAt: atDay(now, -4, 20, 15),
    },
    {
      id: "msg-2",
      conversationId: "conv-tiro-vertical",
      userId: DEMO_USER_ID,
      role: "assistant",
      content:
        "Porque en el punto mas alto el objeto deja de subir y todavia no empezo a bajar: es el instante " +
        "en el que la velocidad cambia de signo. Ojo: la aceleracion (g) NO se anula ahi, sigue actuando " +
        "hacia abajo durante todo el movimiento.",
      sources: [
        {
          fileId: "file-tiro-vertical",
          fileName: "Resumen tiro vertical.txt",
          chunkId: "chunk-tiro-vertical-1",
          excerpt: "En el punto mas alto la velocidad es cero pero la aceleracion sigue siendo g.",
          page: null,
        },
      ],
      createdAt: atDay(now, -4, 20, 16),
    },
  ];

  const practiceSets: PracticeSet[] = [
    {
      id: "set-tiro-vertical",
      userId: DEMO_USER_ID,
      subjectId: "sub-fisica",
      topicId: "top-tiro-vertical",
      title: "Practica: Tiro vertical",
      createdAt: atDay(now, -4, 20, 30),
      generatedBy: "heuristico",
    },
  ];

  const practiceQuestions: PracticeQuestion[] = [
    {
      id: "q-tiro-1",
      setId: "set-tiro-vertical",
      kind: "respuesta_breve",
      difficulty: "media",
      prompt: "¿Cual es el valor de la aceleracion en el punto mas alto de un tiro vertical?",
      options: null,
      expectedAnswer: "g, aproximadamente 9,8 m/s2 hacia abajo",
      gradingCriteria: [
        "Debe indicar que la aceleracion no es cero",
        "Debe mencionar que sigue siendo g (~9,8 m/s2)",
        "Debe indicar que apunta hacia abajo",
      ],
      explanation:
        "La aceleracion de la gravedad actua durante todo el movimiento, incluso cuando la velocidad es cero.",
      commonMistakes: ["Creer que la aceleracion es cero en el punto mas alto"],
      sourceFileId: "file-tiro-vertical",
      sourceExcerpt: "En el punto mas alto la velocidad es cero pero la aceleracion sigue siendo g.",
    },
    {
      id: "q-tiro-2",
      setId: "set-tiro-vertical",
      kind: "verdadero_falso",
      difficulty: "facil",
      prompt: "El tiempo de subida es igual al tiempo de bajada en un tiro vertical (sin rozamiento).",
      options: ["Verdadero", "Falso"],
      expectedAnswer: "Verdadero",
      gradingCriteria: ["Debe responder Verdadero y justificar por simetria del movimiento"],
      explanation: "Por la simetria del MRUV, ambos tiempos son iguales si no hay rozamiento del aire.",
      commonMistakes: ["Responder Falso por confundir con caida libre desde otra altura"],
      sourceFileId: "file-tiro-vertical",
      sourceExcerpt: "El tiempo de subida es igual al tiempo de bajada.",
    },
  ];

  const practiceAttempts: PracticeAttempt[] = [
    {
      id: "attempt-1",
      userId: DEMO_USER_ID,
      questionId: "q-tiro-1",
      answerText: "Es cero porque el objeto se detiene un instante",
      isCorrect: false,
      feedback:
        "Te falto identificar que la aceleracion sigue siendo g. Que la velocidad sea cero no significa " +
        "que la aceleracion tambien lo sea.",
      firstErrorHint: "Pensa que pasa con la fuerza de gravedad: ¿deja de actuar en algun momento?",
      attemptNumber: 1,
      createdAt: atDay(now, -1, 19, 0),
    },
  ];

  const studySessions: StudySession[] = [
    {
      id: "session-ecuaciones",
      userId: DEMO_USER_ID,
      subjectId: "sub-matematica",
      topicId: "top-ecuaciones",
      examId: null,
      startsAt: atDay(now, -3, 18, 0),
      endsAt: atDay(now, -3, 19, 0),
      completed: true,
    },
  ];

  const habits: Habit[] = [
    {
      id: "habit-agua",
      userId: DEMO_USER_ID,
      name: "Tomar agua",
      targetPerWeek: 7,
      createdAt,
      archivedAt: null,
    },
  ];

  const expenses: Expense[] = [
    {
      id: "expense-salida",
      userId: DEMO_USER_ID,
      amount: 8500,
      currency: "ARS",
      category: "Salida",
      description: "Salida con amigos",
      spentAt: format(now, "yyyy-MM-dd"),
      createdAt: atDay(now, 0, 21, 0),
    },
  ];

  const activityLog: ActivityLogEntry[] = [
    {
      id: "activity-1",
      userId: DEMO_USER_ID,
      action: "creo",
      entityType: "exam",
      entityId: "exam-fisica-cinematica",
      createdAt: atDay(now, -4, 20, 0),
    },
    {
      id: "activity-2",
      userId: DEMO_USER_ID,
      action: "subio",
      entityType: "file",
      entityId: "file-tiro-vertical",
      createdAt: atDay(now, -4, 20, 5),
    },
    {
      id: "activity-3",
      userId: DEMO_USER_ID,
      action: "respondio",
      entityType: "practice_attempt",
      entityId: "attempt-1",
      createdAt: atDay(now, -1, 19, 0),
    },
  ];

  return {
    subjects,
    studyTopics,
    exams,
    tasks,
    events,
    availabilityRules,
    projects,
    projectTasks,
    ideas,
    files,
    fileChunks,
    conversations,
    messages,
    practiceSets,
    practiceQuestions,
    practiceAttempts,
    studySessions,
    habits,
    expenses,
    activityLog,
  };
}

export { DEMO_USER_ID, SECONDARY_DEMO_USER_ID };
