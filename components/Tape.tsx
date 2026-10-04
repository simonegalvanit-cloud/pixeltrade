import { TAPE } from "@/lib/mock";

// Scrolling ticker at the very top. The list is printed twice so the loop is seamless.
export default function Tape() {
  const items = [...TAPE, ...TAPE];
  return (
    <div className="tape" aria-label="Market and trader ticker">
      <div className="track">
        {items.map((t, i) => (
          <span className="it" key={i} aria-hidden={i >= TAPE.length}>
            <b>{t.label}</b><span className={t.dir === "up" ? "u" : t.dir === "down" ? "d" : ""}>{t.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
