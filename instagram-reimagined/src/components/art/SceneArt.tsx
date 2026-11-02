import { memo, useId, type ReactNode } from "react";
import type { Palette, SceneKind } from "@/types";
import { hash, seeded } from "@/lib/format";

/**
 * Ilustraciones vectoriales que reemplazan las fotos reales.
 * Son determinísticas (misma semilla = misma imagen) y no requieren internet.
 */
interface Props {
  scene: SceneKind;
  palette: Palette;
  seed?: string;
  className?: string;
  /** "slice" recorta para llenar (reels, grillas). */
  fit?: "slice" | "meet";
}

type Draw = (p: Palette, r: () => number, id: string) => ReactNode;

const W = 400;
const H = 500;

const sky = (p: Palette, id: string) => (
  <>
    <defs>
      <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.a} />
        <stop offset="1" stopColor={p.b} />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill={`url(#${id}s)`} />
  </>
);

const SCENES: Record<SceneKind, Draw> = {
  mountains: (p, r, id) => (
    <>
      {sky(p, id)}
      <circle cx={280} cy={150} r={46} fill={p.e} opacity={0.9} />
      <path d="M0 330 L90 200 L160 280 L240 160 L330 260 L400 210 L400 500 L0 500Z" fill={p.c} opacity={0.55} />
      <path d="M240 160 L262 190 L250 188 L240 200 L228 186 L218 190Z" fill="#fff" opacity={0.85} />
      <path d="M0 380 L70 300 L150 360 L230 280 L320 350 L400 300 L400 500 L0 500Z" fill={p.c} />
      <path d="M0 430 Q100 380 200 420 T400 410 L400 500 L0 500Z" fill={p.d} />
      {Array.from({ length: 9 }, (_, i) => {
        const x = 20 + i * 45 + r() * 10;
        const h = 22 + r() * 14;
        return <path key={i} d={`M${x} ${440 - h} L${x + 9} 440 L${x - 9} 440Z`} fill={p.d} opacity={0.9} />;
      })}
    </>
  ),
  ocean: (p, _r, id) => (
    <>
      {sky(p, id)}
      <circle cx={200} cy={270} r={70} fill={p.e} opacity={0.95} />
      <rect y={280} width={W} height={220} fill={p.c} />
      {Array.from({ length: 7 }, (_, i) => (
        <path
          key={i}
          d={`M0 ${300 + i * 28} Q50 ${292 + i * 28} 100 ${300 + i * 28} T200 ${300 + i * 28} T300 ${300 + i * 28} T400 ${300 + i * 28}`}
          stroke={i % 2 ? p.d : "#fff"}
          strokeOpacity={i % 2 ? 0.4 : 0.35}
          strokeWidth={3}
          fill="none"
        />
      ))}
      <path d="M150 360 Q175 340 205 356 Q215 352 222 344 Q220 360 210 366 Q180 378 150 360Z" fill={p.d} opacity={0.85} />
    </>
  ),
  city: (p, r, id) => (
    <>
      {sky(p, id)}
      <circle cx={110} cy={130} r={34} fill={p.e} opacity={0.8} />
      {Array.from({ length: 11 }, (_, i) => {
        const w = 30 + r() * 26;
        const x = i * 37 - 10;
        const h = 140 + r() * 190;
        return (
          <g key={i}>
            <rect x={x} y={H - h} width={w} height={h} fill={i % 2 ? p.c : p.d} />
            {Array.from({ length: Math.floor(h / 26) }, (_, j) =>
              r() > 0.45 ? (
                <rect key={j} x={x + 7} y={H - h + 12 + j * 26} width={w - 14} height={8} rx={2} fill={p.e} opacity={0.5 + r() * 0.4} />
              ) : null,
            )}
          </g>
        );
      })}
    </>
  ),
  dunes: (p, _r, id) => (
    <>
      {sky(p, id)}
      <circle cx={300} cy={120} r={40} fill={p.e} />
      <path d="M0 300 Q120 230 240 300 T400 280 L400 500 L0 500Z" fill={p.c} opacity={0.7} />
      <path d="M0 360 Q160 290 280 370 T400 350 L400 500 L0 500Z" fill={p.c} />
      <path d="M0 430 Q140 380 260 440 T400 420 L400 500 L0 500Z" fill={p.d} />
      <path d="M90 380 l0 -50 m0 18 l-12 -8 m12 22 l12 -10" stroke={p.d} strokeWidth={6} strokeLinecap="round" fill="none" />
    </>
  ),
  forest: (p, r, id) => (
    <>
      {sky(p, id)}
      <circle cx={90} cy={110} r={30} fill={p.e} opacity={0.85} />
      {[0, 1, 2].map((row) =>
        Array.from({ length: 9 }, (_, i) => {
          const x = i * 50 + (row % 2) * 25 - 10 + r() * 8;
          const base = 300 + row * 70;
          const h = 90 + r() * 50;
          return (
            <path key={`${row}-${i}`} d={`M${x} ${base - h} L${x + 30} ${base} L${x - 30} ${base}Z`} fill={row === 2 ? p.d : p.c} opacity={0.55 + row * 0.2} />
          );
        }),
      )}
      <rect y={440} width={W} height={60} fill={p.d} />
    </>
  ),
  orbit: (p, r, id) => (
    <>
      {sky(p, id)}
      {Array.from({ length: 5 }, (_, i) => (
        <circle key={i} cx={200} cy={250} r={60 + i * 42} fill="none" stroke={p.d} strokeOpacity={0.18} strokeWidth={2} />
      ))}
      <circle cx={200} cy={250} r={70} fill={p.c} />
      <circle cx={200 + 100 * Math.cos(r() * 6)} cy={250 + 100 * Math.sin(r() * 6)} r={20} fill={p.e} />
      <circle cx={200 + 170 * Math.cos(r() * 6)} cy={250 + 170 * Math.sin(r() * 6)} r={12} fill={p.d} />
      <ellipse cx={130} cy={420} rx={90} ry={50} fill={p.d} opacity={0.18} />
      <ellipse cx={320} cy={90} rx={70} ry={40} fill={p.c} opacity={0.3} />
    </>
  ),
  mate: (p, _r, id) => (
    <>
      {sky(p, id)}
      <rect y={340} width={W} height={160} fill={p.c} />
      <rect y={340} width={W} height={10} fill={p.d} opacity={0.25} />
      <ellipse cx={200} cy={420} rx={110} ry={18} fill={p.d} opacity={0.2} />
      <path d="M140 250 Q130 360 170 410 L230 410 Q270 360 260 250Z" fill={p.d} />
      <ellipse cx={200} cy={250} rx={60} ry={14} fill={p.c} />
      <ellipse cx={200} cy={250} rx={48} ry={9} fill="#6E8B3D" />
      <path d="M215 248 L250 140" stroke="#C9CCD1" strokeWidth={7} strokeLinecap="round" />
      <rect x={300} y={260} width={50} height={150} rx={14} fill={p.e} opacity={0.9} />
      <rect x={312} y={240} width={26} height={24} rx={6} fill={p.d} opacity={0.6} />
      <path d="M190 220 q-10 -20 0 -40 q10 -20 0 -40" stroke="#fff" strokeOpacity={0.5} strokeWidth={4} fill="none" strokeLinecap="round" />
    </>
  ),
  books: (p, r, id) => (
    <>
      {sky(p, id)}
      <rect y={420} width={W} height={80} fill={p.d} opacity={0.3} />
      {Array.from({ length: 6 }, (_, i) => {
        const h = 34 + r() * 10;
        const w = 220 + r() * 60;
        const y = 420 - (i + 1) * 40;
        const colors = [p.c, p.d, p.e, p.c, p.d, p.e];
        return (
          <g key={i} transform={`rotate(${(r() - 0.5) * 6} 200 ${y})`}>
            <rect x={200 - w / 2} y={y} width={w} height={h} rx={5} fill={colors[i]} />
            <rect x={200 - w / 2 + 14} y={y + 8} width={8} height={h - 16} rx={2} fill="#fff" opacity={0.5} />
          </g>
        );
      })}
      <circle cx={320} cy={100} r={26} fill={p.e} opacity={0.8} />
    </>
  ),
  stage: (p, r, id) => (
    <>
      {sky(p, id)}
      {Array.from({ length: 5 }, (_, i) => {
        const x = 40 + i * 80;
        return <path key={i} d={`M${x} 0 L${x - 70 + r() * 40} 400 L${x + 70 + r() * 40} 400Z`} fill={i % 2 ? p.c : p.e} opacity={0.22} />;
      })}
      <rect y={330} width={W} height={20} fill={p.d} />
      <circle cx={200} cy={250} r={20} fill={p.d} />
      <rect x={185} y={270} width={30} height={60} rx={10} fill={p.d} />
      {Array.from({ length: 16 }, (_, i) => (
        <circle key={i} cx={i * 27 + 5} cy={430 + (i % 3) * 14} r={22 + r() * 6} fill={p.d} opacity={0.95} />
      ))}
      <rect y={460} width={W} height={40} fill={p.d} />
    </>
  ),
  field: (p) => (
    <>
      <rect width={W} height={H} fill={p.b} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} y={i * 63} width={W} height={32} fill={p.a} />
      ))}
      <g stroke={p.e} strokeOpacity={0.85} strokeWidth={4} fill="none">
        <rect x={30} y={30} width={340} height={440} />
        <line x1={30} y1={250} x2={370} y2={250} />
        <circle cx={200} cy={250} r={50} />
        <rect x={120} y={30} width={160} height={70} />
        <rect x={120} y={400} width={160} height={70} />
      </g>
      <circle cx={240} cy={300} r={12} fill="#fff" />
      <circle cx={240} cy={300} r={12} fill="none" stroke={p.d} strokeWidth={2} />
      <circle cx={236} cy={312} r={14} fill={p.d} opacity={0.2} />
    </>
  ),
  empanadas: (p, r, id) => (
    <>
      {sky(p, id)}
      <circle cx={200} cy={270} r={160} fill="#fff" opacity={0.92} />
      <circle cx={200} cy={270} r={140} fill="none" stroke={p.c} strokeOpacity={0.3} strokeWidth={3} />
      {[
        [150, 220, -20],
        [255, 225, 25],
        [200, 320, 0],
      ].map(([x, y, rot], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${(rot ?? 0) + r() * 6})`}>
          <path d="M-62 10 A62 62 0 0 1 62 10 Z" fill={p.c} />
          <path d="M-62 10 A62 62 0 0 1 62 10" fill="none" stroke={p.d} strokeWidth={8} strokeDasharray="6 7" strokeLinecap="round" />
          <ellipse cx={-10} cy={-14} rx={20} ry={6} fill="#fff" opacity={0.25} />
        </g>
      ))}
    </>
  ),
  night: (p, r, id) => (
    <>
      {sky(p, id)}
      {Array.from({ length: 70 }, (_, i) => (
        <circle key={i} cx={r() * W} cy={r() * 330} r={r() * 1.8 + 0.4} fill="#fff" opacity={0.4 + r() * 0.6} />
      ))}
      <path d="M0 160 Q200 80 400 190" stroke="#fff" strokeOpacity={0.08} strokeWidth={60} fill="none" />
      <circle cx={300} cy={110} r={30} fill={p.e} />
      <circle cx={314} cy={102} r={28} fill={p.a} />
      <path d="M0 400 Q100 340 200 380 T400 360 L400 500 L0 500Z" fill={p.c} />
      <path d="M0 450 Q120 410 240 450 T400 440 L400 500 L0 500Z" fill={p.d} />
    </>
  ),
};

function SceneArtImpl({ scene, palette, seed = scene, className, fit = "slice" }: Props) {
  const id = useId().replace(/:/g, "");
  const r = seeded(hash(seed));
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio={`xMidYMid ${fit}`}
      className={className}
      role="img"
      aria-hidden="true"
    >
      {SCENES[scene](palette, r, id)}
    </svg>
  );
}

export const SceneArt = memo(SceneArtImpl);
