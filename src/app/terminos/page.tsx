import type { Metadata } from "next";
import { appConfig } from "@/config/app";
import { LegalPageLayout, LegalSection } from "@/components/shared/legal-page-layout";

export const metadata: Metadata = {
  title: `Terminos de uso — ${appConfig.shortName}`,
};

export default function TerminosPage() {
  return (
    <LegalPageLayout title="Terminos de uso" lastUpdated="19/07/2026">
      <LegalSection title="1. Aceptacion de estos terminos">
        <p>
          Al crear una cuenta o usar {appConfig.name} ({appConfig.shortName}) aceptas estos terminos. Si no estas
          de acuerdo, no uses la aplicacion.
        </p>
      </LegalSection>

      <LegalSection title="2. Que es Nexo">
        <p>
          {appConfig.shortName} es un organizador personal de estudios, agenda, proyectos, habitos, entrenamiento y
          gastos, pensado para uso individual. Podes probarlo en <strong>modo demo</strong> (datos de ejemplo, sin
          crear cuenta, que se reinician periodicamente) o crear una cuenta real para guardar tu propia informacion.
        </p>
      </LegalSection>

      <LegalSection title="3. Tu cuenta">
        <p>
          Sos responsable de mantener tu contraseña segura y de toda la actividad que ocurra desde tu cuenta. Si sos
          menor de edad, te recomendamos usar la aplicacion con la supervision de un adulto responsable.
        </p>
      </LegalSection>

      <LegalSection title="4. Tu contenido">
        <p>
          Todo lo que cargues (materias, tareas, examenes, archivos, gastos, mensajes con el asistente, etc.) es tuyo.
          Lo guardamos unicamente para poder mostrartelo y darte la funcionalidad de la app. Podes descargar una copia
          completa o eliminar todo para siempre en cualquier momento desde <em>Configuracion</em>.
        </p>
      </LegalSection>

      <LegalSection title="5. El asistente de IA no reemplaza tu criterio">
        <p>
          Por defecto, el asistente, el generador de preguntas y la correccion de respuestas funcionan con reglas
          determinísticas propias, sin enviar tu informacion a ningun proveedor externo. Si en algun momento se activa
          un proveedor de inteligencia artificial real, tu contenido solo se envia si diste tu consentimiento explicito
          en Configuracion. En cualquiera de los dos casos, las respuestas pueden tener errores o quedarse cortas —
          no reemplazan el estudio real ni el criterio de un docente.
        </p>
      </LegalSection>

      <LegalSection title="6. Uso aceptable">
        <p>
          No uses {appConfig.shortName} para actividades ilegales, para intentar acceder a cuentas o datos de otras
          personas, ni para sobrecargar o intentar vulnerar la seguridad del servicio.
        </p>
      </LegalSection>

      <LegalSection title="7. Disponibilidad del servicio">
        <p>
          Este es un proyecto personal en crecimiento, no un servicio comercial con garantia de disponibilidad. Puede
          haber interrupciones, mantenimiento o cambios de funcionalidad sin aviso previo. El modo demo en particular
          se reinicia por diseño y no es un lugar seguro para guardar informacion real.
        </p>
      </LegalSection>

      <LegalSection title="8. Cambios en estos terminos">
        <p>
          Podemos actualizar estos terminos a medida que la aplicacion cambia. Si el cambio es importante, lo vamos a
          reflejar en esta misma pagina con una nueva fecha de actualizacion.
        </p>
      </LegalSection>

      <LegalSection title="9. Ley aplicable">
        <p>Estos terminos se rigen por las leyes de la Republica Argentina.</p>
      </LegalSection>

      <LegalSection title="10. Contacto">
        <p>
          Para consultas sobre estos terminos, escribinos a{" "}
          <a className="underline" href={`mailto:${appConfig.contactEmail}`}>
            {appConfig.contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
