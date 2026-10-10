import ScoreTable from "@/components/ScoreTable";
import { MemberSearch } from "@/components/Search";
import { getScores } from "@/lib/data";
import type { Player, Win } from "@/lib/trading";

export const metadata = { title: "Hi-scores · perpy" };
export const revalidate = 120;

// Arcade high-score table of perpy players, ranked by real PnL.
export default async function Scores() {
  let boards: Record<Win, Player[]> | null = null;
  try {
    const [day, week, month, allTime] = await Promise.all((["day", "week", "month", "allTime"] as Win[]).map((w) => getScores(w, 50)));
    boards = { day, week, month, allTime };
  } catch { boards = null; }
  return (
    <div className="hs-page">
      <p className="sub">perpy players · ranked by real PnL · verified onchain</p>
      <h1>HI-SCORES</h1>
      <p className="insert">FIND A PLAYER</p>
      <MemberSearch big />
      {!boards || boards.month.length === 0
        ? <p className="empty">No players on the board yet. Sign up, deposit, trade, and claim the #1 spot.</p>
        : <ScoreTable boards={boards} />}
    </div>
  );
}
