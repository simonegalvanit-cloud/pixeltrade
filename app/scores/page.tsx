import ScoreTable from "@/components/ScoreTable";
import { WalletSearch } from "@/components/Wallet";
import { getRanked } from "@/lib/data";
import type { Player, Win } from "@/lib/trading";

export const metadata = { title: "Hi-scores · perpy" };
export const revalidate = 300;

// Arcade high-score table built from Hyperliquid's public leaderboard.
// Market-making bots (that trade 100s of times their account) are left out.
export default async function Scores() {
  let boards: Record<Win, Player[]> | null = null;
  try {
    const [day, week, month, allTime] = await Promise.all((["day", "week", "month", "allTime"] as Win[]).map((w) => getRanked(w, 50)));
    boards = { day, week, month, allTime };
  } catch { boards = null; }
  return (
    <div className="hs-page">
      <p className="sub">Real Hyperliquid traders · ranked by PnL · bots filtered out</p>
      <h1>HI-SCORES</h1>
      <p className="insert">PASTE ANY WALLET TO LOOK IT UP</p>
      <WalletSearch big />
      {boards ? <ScoreTable boards={boards} /> : <p className="empty">Couldn&apos;t load the leaderboard. Refresh in a moment.</p>}
    </div>
  );
}
