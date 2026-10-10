import type { Ring } from "@/lib/types";

// Pixel-art avatar: an 8x8 "space invader" sprite generated from a wallet
// address, mirrored so it looks like a character. Same wallet = same sprite.
const PALETTE: [string, string][] = [
  ["#39FF88", "#0E9F5C"], ["#2DE2FF", "#1479A8"], ["#FF3D7F", "#B4205A"], ["#FFE14D", "#C99A12"],
  ["#9B5CFF", "#5B2DB8"], ["#FF8A3D", "#C2541A"], ["#8BD3F0", "#2B7A9E"], ["#F2A1C1", "#B4436C"],
];

function hash(s: string) {
  let h = 2166136261;
  for (const ch of s.toLowerCase()) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function sprite(seed: string) {
  let h = hash(seed);
  const cells: [number, number][] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 4; x++) {
      h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
      if (h % 100 < (y === 0 || y === 7 ? 30 : 58)) { cells.push([x, y]); cells.push([7 - x, y]); }
    }
  }
  return cells;
}

export default function Avatar({ seed, size = 40, ring, live, label }: { seed: string; size?: number; ring?: Ring; live?: string; label?: string }) {
  const [hi, lo] = PALETTE[hash(seed + "c") % PALETTE.length];
  const cells = sprite(seed);
  return (
    <span className={`av${ring ? ` ring ${ring}` : ""}`} role="img" aria-label={label ?? "player"} style={{ width: size, height: size }}>
      <svg viewBox="-1 -1 10 10" shapeRendering="crispEdges" style={{ background: `linear-gradient(135deg, ${lo}33, #0b0916)` }}>
        {cells.map(([x, y], i) => <rect key={i} x={x} y={y} width="1.02" height="1.02" fill={y < 4 ? hi : lo} />)}
      </svg>
      {live && <span className="live">{live}</span>}
    </span>
  );
}
