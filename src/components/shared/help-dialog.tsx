"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { appConfig } from "@/config/app";

interface GuideSection {
  title: string;
  body: string;
}

const SECTIONS: GuideSection[] = [
  {
    title: "Hoy",
    body: "Tu pantalla principal: lo mas urgente del dia (tareas venciendo, proximo examen, disponibilidad libre) y un resumen de actividad reciente.",
  },
  {
    title: "Captura rapida",
    body: 'El boton con la chispa, arriba de todo. Escribi en lenguaje natural ("Rindo Fisica el lunes a las 9", "Gaste 5000 en el colectivo") y Nexo detecta solo si es una tarea, examen, evento, idea o gasto.',
  },
  {
    title: "Agenda",
    body: 'Tu calendario y disponibilidad semanal. Ahi tambien esta "Generar plan": arma una propuesta de estudio para la semana usando tus materias, examenes, tareas y horarios libres, señalando conflictos (superposiciones, sobrecarga, examenes sin sesiones de estudio) antes de que se conviertan en un problema.',
  },
  {
    title: "Estudios",
    body: "Tus materias, con sus temas y examenes. Cada examen muestra un puntaje de preparacion (que tan listo estas), calculado a partir de tus temas repasados y practicas hechas.",
  },
  {
    title: "Archivos y Asistente",
    body: "Subi apuntes (PDF, Word) en Archivos, y despues pedile al Asistente que te explique, resuma o tome examen sobre ese material — siempre cita de donde saco la respuesta, nunca inventa.",
  },
  {
    title: "Proyectos",
    body: "Para lo que no es puramente academico: proyectos personales con sus propias tareas, y un espacio para anotar ideas sueltas que despues podes convertir en tarea o proyecto.",
  },
  {
    title: "Habitos, Entrenamiento y Gastos",
    body: "Seguimiento simple de habitos que queres mantener, tus sesiones de entrenamiento, y tus gastos — todo en el mismo lugar que el resto de tu organizacion.",
  },
  {
    title: "Notificaciones",
    body: 'En Configuracion podes activar un aviso diario (push, al celular o navegador) si tenes examenes o tareas por vencer hoy o mañana.',
  },
];

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Como funciona {appConfig.shortName}</DialogTitle>
          <DialogDescription>Una guia rapida de cada seccion.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <p className="text-sm text-muted-foreground">{section.body}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
