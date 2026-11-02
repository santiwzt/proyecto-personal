import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AppStateProvider } from "@/state/app-state";
import { useRoute } from "@/state/router";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { HomePage } from "@/pages/Home";
import { SimulatorPage } from "@/pages/Simulator";
import { ComparePage } from "@/pages/Compare";
import { AnalysisPage } from "@/pages/Analysis";
import { PresentationPage } from "@/pages/Presentation";

export default function App() {
  const route = useRoute();
  return (
    <AppStateProvider>
      <MotionConfig reducedMotion="user">
        <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
          Saltar al contenido
        </a>
        <TopBar route={route} />
        <AnimatePresence mode="wait">
          <motion.main
            id="contenido"
            key={route}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-[calc(100dvh-4rem)]"
          >
            {route === "inicio" && <HomePage />}
            {route === "simulador" && <SimulatorPage />}
            {route === "comparar" && <ComparePage />}
            {route === "analisis" && <AnalysisPage />}
            {route === "presentacion" && <PresentationPage />}
          </motion.main>
        </AnimatePresence>
        <Footer />
      </MotionConfig>
    </AppStateProvider>
  );
}
