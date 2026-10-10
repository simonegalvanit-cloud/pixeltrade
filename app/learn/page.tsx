import Link from "next/link";
import TradeDemo from "@/components/TradeDemo";

export const metadata = { title: "How a trade works · perpy" };

// Animated walkthrough of opening a position.
export default function Learn() {
  return (
    <>
      <div className="learn-h">
        <small className="kick">INSERT COIN · NEW TO PERPS?</small>
        <h1>HOW TO <em>PLAY</em></h1>
        <p>Watch a long on Bitcoin go from wallet to live match in eight steps. The prices are live from Hyperliquid. Click any step to jump to it.</p>
      </div>
      <TradeDemo />
      <p className="learn-note">
        This is a demo: perpy doesn&apos;t place trades yet. Leverage works both ways and can lose your money fast,
        so start small and always use a stop loss. <Link href="/">Back to the Pit →</Link>
      </p>
    </>
  );
}
