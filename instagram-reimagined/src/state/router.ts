import { useEffect, useState } from "react";

export type Route = "inicio" | "simulador" | "comparar" | "analisis" | "presentacion";

export const ROUTES: { id: Route; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "simulador", label: "Simulador" },
  { id: "comparar", label: "Comparar" },
  { id: "analisis", label: "Análisis ético" },
  { id: "presentacion", label: "Presentación" },
];

const parse = (): Route => {
  const h = window.location.hash.replace(/^#\/?/, "").split("?")[0] as Route;
  return ROUTES.some((r) => r.id === h) ? h : "inicio";
};

/** Router mínimo por hash: funciona en cualquier hosting estático. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export const go = (r: Route) => {
  window.location.hash = `/${r}`;
};
