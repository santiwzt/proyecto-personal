/**
 * Central app identity. Change the product name/description here only —
 * nothing else in the codebase should hardcode "Nexo" as a display string.
 */
export const appConfig = {
  name: "Nexo Personal OS",
  shortName: "Nexo",
  description:
    "Sistema operativo personal con inteligencia artificial para organizar estudios, examenes, proyectos, actividades, objetivos, habitos, archivos y planificacion diaria.",
  locale: "es-AR",
  timeZone: "America/Argentina/Buenos_Aires",
  weekStartsOn: 1 as const, // Monday
  dateFormat: "dd/MM/yyyy",
  /** Shown on the Terminos de uso / Politica de privacidad pages as the contact address. */
  contactEmail: "santi.wzt@gmail.com",
} as const;
