import type { Metadata } from "next";
import { appConfig } from "@/config/app";
import { LegalPageLayout, LegalSection } from "@/components/shared/legal-page-layout";

export const metadata: Metadata = {
  title: `Politica de privacidad — ${appConfig.shortName}`,
};

export default function PrivacidadPage() {
  return (
    <LegalPageLayout title="Politica de privacidad" lastUpdated="19/07/2026">
      <LegalSection title="1. Que datos guardamos">
        <p>Guardamos lo necesario para que la aplicacion funcione:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Datos de tu cuenta: nombre, email y rol (estudiante, profesional, etc.).</li>
          <li>
            El contenido que vos cargas: materias, temas, examenes, tareas, eventos de agenda, disponibilidad,
            proyectos, ideas, habitos, sesiones de entrenamiento, gastos y objetivos.
          </li>
          <li>
            Archivos que subis (apuntes, PDFs) y el texto que extraemos de ellos para que el asistente pueda
            citarlos.
          </li>
          <li>Tus conversaciones con el asistente de IA.</li>
          <li>
            Si activaste las notificaciones, la suscripcion tecnica de tu navegador necesaria para enviartelas (no
            accedemos a tu ubicacion ni a otra informacion de tu dispositivo).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Para que los usamos">
        <p>
          Unicamente para darte la funcionalidad de {appConfig.shortName}: mostrarte tu informacion, calcular
          conflictos de agenda, preparar el planificador semanal, generar recordatorios y responder en el asistente.
          No usamos tus datos para publicidad ni los vendemos a nadie.
        </p>
      </LegalSection>

      <LegalSection title="3. Inteligencia artificial">
        <p>
          Por defecto, el asistente, el generador de preguntas y la correccion funcionan con reglas propias, sin
          proveedor externo — tu contenido nunca sale de la aplicacion. Si en algun momento configuramos un proveedor
          de IA real (por ejemplo Anthropic), tu contenido solo se le envia para esa consulta puntual si vos diste tu
          consentimiento explicito en Configuracion, y podes retirarlo cuando quieras.
        </p>
      </LegalSection>

      <LegalSection title="4. Donde se guardan tus datos">
        <p>
          Tu informacion se guarda en una base de datos de Supabase con seguridad a nivel de fila: el sistema impide
          que cualquier usuario, incluso por error de programacion, pueda leer o modificar los datos de otro. Tu
          contraseña la gestiona Supabase Auth de forma cifrada — nunca la vemos en texto plano.
        </p>
      </LegalSection>

      <LegalSection title="5. Cookies">
        <p>
          Usamos una unica cookie tecnica para mantener tu sesion iniciada. No usamos cookies de rastreo, publicidad
          ni analytics de terceros.
        </p>
      </LegalSection>

      <LegalSection title="6. Con quien compartimos datos">
        <p>
          Con nadie, salvo: el proveedor de infraestructura que aloja la aplicacion (Supabase y Vercel), y el
          proveedor de IA si activaste ese consentimiento (ver seccion 3). No compartimos ni vendemos tu informacion
          a terceros con fines comerciales.
        </p>
      </LegalSection>

      <LegalSection title="7. Tus derechos sobre tus datos">
        <p>
          Desde <em>Configuracion</em> podes en cualquier momento: editar tu perfil, descargar una copia completa de
          todo lo que cargaste en formato JSON, y eliminar tu cuenta junto con absolutamente todos tus datos de forma
          permanente.
        </p>
      </LegalSection>

      <LegalSection title="8. Menores de edad">
        <p>
          {appConfig.shortName} fue pensado inicialmente para estudiantes secundarios. Si sos menor de edad,
          recomendamos usar la aplicacion con la supervision de un adulto responsable.
        </p>
      </LegalSection>

      <LegalSection title="9. Cambios en esta politica">
        <p>
          Si actualizamos esta politica de forma relevante, lo vamos a reflejar en esta misma pagina con una nueva
          fecha.
        </p>
      </LegalSection>

      <LegalSection title="10. Contacto">
        <p>
          Para consultas sobre tus datos o esta politica, escribinos a{" "}
          <a className="underline" href={`mailto:${appConfig.contactEmail}`}>
            {appConfig.contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
