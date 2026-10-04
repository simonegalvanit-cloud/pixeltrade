import { PEOPLE, type Ring } from "@/lib/mock";

// Round avatar with initials. The colored ring shows a live position:
// green = in profit, red = in loss, grey = already seen.
export default function Avatar({ handle, size = 40, ring, live }: { handle: string; size?: number; ring?: Ring; live?: string }) {
  const p = PEOPLE[handle];
  if (!p) return null;
  const initials = p.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  return (
    <span className={`av${ring ? ` ring ${ring}` : ""}`} role="img" aria-label={p.name}>
      <span
        className="face"
        style={{
          width: size, height: size, fontSize: Math.round(size * 0.38),
          background: `linear-gradient(135deg,${p.colors[0]},${p.colors[1]})`,
        }}
      >
        {initials}
      </span>
      {live && <span className="live">{live}</span>}
    </span>
  );
}
