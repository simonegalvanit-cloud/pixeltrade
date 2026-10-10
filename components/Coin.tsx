// A small square badge for any coin. Known coins get their brand color,
// the rest get a color picked from their name.
const KNOWN: Record<string, [string, string]> = {
  BTC: ["#F7931A", "₿"], ETH: ["#627EEA", "Ξ"], SOL: ["#9945FF", "S"], HYPE: ["#0F5E46", "H"],
  DOGE: ["#C2A633", "Ð"], XRP: ["#23292F", "X"], SUI: ["#4DA2FF", "S"], BNB: ["#F3BA2F", "B"],
};

export default function Coin({ coin, size = 26 }: { coin: string; size?: number }) {
  const k = KNOWN[coin];
  let h = 0;
  for (const ch of coin) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const bg = k ? k[0] : `hsl(${h} 70% 42%)`;
  const label = k ? k[1] : coin.replace(/^k(?=[A-Z])/, "").slice(0, 2);
  return (
    <span className="coin" style={{ background: bg, width: size, height: size, fontSize: label.length > 1 ? size * 0.38 : size * 0.5 }} title={coin}>
      {label}
    </span>
  );
}
