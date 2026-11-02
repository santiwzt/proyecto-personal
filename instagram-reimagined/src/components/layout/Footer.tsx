import { Logo } from "./TopBar";

export function Footer() {
  return (
    <footer className="border-t border-line/[0.06]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-[12.5px] text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <p className="max-w-xl text-pretty">
          Trabajo práctico escolar "Rediseñar una app desde la ética". Simulación con datos ficticios: no está afiliada a Meta ni a Instagram,
          no se conecta con ninguna cuenta real y no recolecta datos.
        </p>
      </div>
    </footer>
  );
}
