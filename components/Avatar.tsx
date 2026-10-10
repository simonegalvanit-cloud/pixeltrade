import { PEOPLE, type Ring } from "@/lib/mock";

// Pixel-art avatar: an 8x8 "space invader" sprite generated from the handle,
// mirrored left-right so it looks like a character. Same handle = same sprite.
function sprite(handle: string) {
  let h = 2166136261;
  for (const ch of handle) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const cells: [number, number][] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 4; x++) {
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      const on = (h >>> 0) % 100 < (y === 0 || y === 7 ? 30 : 58);
      if (on) { cells.push([x, y]); cells.push([7 - x, y]); }
    }
  }
  return cells;
}

export default function Avatar({ handle, size = 40, ring, live }: { handle: string; size?: number; ring?: Ring; live?: string }) {
  const p = PEOPLE[handle];
  if (!p) return null;
  const cells = sprite(handle);
  return (
    <span className={`av${ring ? ` ring ${ring}` : ""}`} role="img" aria-label={p.name} style={{ width: size, height: size }}>
      <svg viewBox="-1 -1 10 10" shapeRendering="crispEdges" style={{ background: `linear-gradient(135deg, ${p.colors[0]}33, #0b0916)` }}>
        {cells.map(([x, y], i) => <rect key={i} x={x} y={y} width="1.02" height="1.02" fill={y < 4 ? p.colors[1] : p.colors[0]} />)}
      </svg>
      {live && <span className="live">{live}</span>}
    </span>
  );
}
