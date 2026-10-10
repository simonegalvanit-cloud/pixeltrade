import Pit from "@/components/Pit";
import Side from "@/components/Side";
import Slip from "@/components/Slip";
import { SeedMarkets } from "@/components/Market";
import { getHome, type HomeData } from "@/lib/data";

// Rebuilt at most once a minute with fresh positions; prices then stream live.
export const revalidate = 60;

// Home: The Pit (top traders' live positions) and real matches from Hyperliquid.
export default async function Home() {
  let data: HomeData | null = null;
  try { data = await getHome(); } catch { data = null; }

  if (!data) {
    return (
      <div className="empty">
        <h1>CONNECTION LOST</h1>
        <p>Couldn&apos;t reach Hyperliquid just now. Refresh in a few seconds.</p>
      </div>
    );
  }

  return (
    <div className="home">
      <SeedMarkets markets={data.markets} />
      <div>
        <div className="sec-h">
          <h2><span className="bl" />THE PIT</h2>
          <small>Top Hyperliquid traders · live · bigger tile = bigger bet</small>
        </div>
        <div className="arena"><Pit items={data.pit} /></div>

        <div className="sec-h">
          <h2>MATCHES</h2>
          <small>Real trades from this month&apos;s best players</small>
        </div>

        <div className="board">
          {data.feed.map((item) => (
            <Slip
              key={item.kind === "open" ? `o-${item.player.address}-${item.pos.coin}` : `c-${item.trade.id}`}
              item={item}
              market={item.kind === "open" ? data.markets[item.pos.coin] : undefined}
            />
          ))}
        </div>
      </div>
      <Side ranked={data.ranked} />
    </div>
  );
}
