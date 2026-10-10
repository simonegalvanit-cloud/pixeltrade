import Composer from "@/components/Composer";
import Feed, { type FeedItem } from "@/components/Feed";
import { SeedMarkets } from "@/components/Market";
import Pit from "@/components/Pit";
import Side from "@/components/Side";
import { getCandles, getHome, getPositions, playersByWallets, type HomeData } from "@/lib/data";
import { latestPosts } from "@/lib/db";

// Rebuilt at most once a minute (and right after someone posts); prices stream live.
export const revalidate = 60;

// Home: The Pit (perpy members' live positions), your composer, and the feed:
// members' calls, open positions and finished trades. Members only.
export default async function Home() {
  let data: HomeData | null = null;
  try { data = await getHome(); } catch { data = null; }

  // Latest posts, with each author's live position on the attached coin.
  const posts = await latestPosts(10);
  const authors = await playersByWallets(posts.map((p) => p.author));
  const postItems: FeedItem[] = (await Promise.all(posts.map(async (post) => {
    const player = authors.get(post.author);
    if (!player) return null;
    const book = post.coin ? await getPositions(post.author).catch(() => null) : null;
    return { kind: "post" as const, post, player, pos: book?.positions.find((x) => x.coin === post.coin) ?? null };
  }))).filter((x): x is Extract<FeedItem, { kind: "post" }> => !!x);
  const markets = { ...(data?.markets ?? {}) };
  const extra = [...new Set(postItems.flatMap((i) => (i.kind === "post" && i.pos && !markets[i.pos.coin] ? [i.pos.coin] : [])))];
  (await Promise.all(extra.map(getCandles))).forEach((m, i) => { if (m) markets[extra[i]] = m; });

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
      <SeedMarkets markets={markets} />
      <div>
        <div className="sec-h">
          <h2><span className="bl" />THE PIT</h2>
          <small>{data.members} player{data.members === 1 ? "" : "s"} · live positions · bigger tile = bigger bet</small>
        </div>
        <div className="arena"><Pit items={data.pit} /></div>
        <Composer />
        <Feed items={[...postItems, ...data.feed]} markets={markets} />
      </div>
      <Side ranked={data.ranked} />
    </div>
  );
}
