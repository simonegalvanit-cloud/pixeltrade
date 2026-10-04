import type { Level } from "@/lib/mock";

const UP = "#0E9F5C";
const DOWN = "#E5484D";
const LEVEL_COLOR = { t: UP, e: "var(--muted)", s: DOWN };

// Price line with a soft fill, optional dashed TP / entry / SL lines and labels.
export default function LineChart({ id, pts, height = 132, levels = [] }: { id: string; pts: number[]; height?: number; levels?: Level[] }) {
  const W = 600;
  const h = height;
  const all = [...pts, ...levels.map((l) => l.v)];
  const mn = Math.min(...all);
  const mx = Math.max(...all);
  const pad = (mx - mn) * 0.14 || 1;
  const y = (v: number) => h - ((v - (mn - pad)) / (mx + pad - (mn - pad))) * h;
  const x = (i: number) => (i / (pts.length - 1)) * W;
  const up = pts[pts.length - 1] >= pts[0];
  const col = up ? "var(--up)" : "var(--down)";
  const d = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const gid = `g-${id}`;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" aria-hidden="true" style={{ height: h }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={up ? UP : DOWN} stopOpacity=".22" />
            <stop offset="1" stopColor={up ? UP : DOWN} stopOpacity="0" />
          </linearGradient>
        </defs>
        {levels.map((l) => (
          <line key={l.kind} x1="0" x2={W} y1={y(l.v)} y2={y(l.v)} stroke={LEVEL_COLOR[l.kind]} strokeWidth="1.5" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={`${d}L${W},${h}L0,${h}Z`} fill={`url(#${gid})`} />
        <path d={d} fill="none" stroke={col} strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <circle cx={W - 3} cy={y(pts[pts.length - 1])} r="4" fill={col} vectorEffect="non-scaling-stroke" />
      </svg>
      {levels.map((l) => (
        <span key={l.kind} className={`lv ${l.kind}`} style={{ top: `${((y(l.v) / h) * 100).toFixed(2)}%` }}>{l.label}</span>
      ))}
    </>
  );
}
