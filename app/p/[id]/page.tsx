import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import { BackIcon } from "@/components/Icons";
import { SeedMarkets } from "@/components/Market";
import { DeletePost } from "@/components/DeletePost";
import { PostBody } from "@/components/PostSlip";
import { PlayerLine } from "@/components/Slip";
import { Chat, GG, Share, Tail } from "@/components/Social";
import { getCandles, getPositions, playersByWallets } from "@/lib/data";
import { getPost } from "@/lib/db";
import { ago } from "@/lib/trading";

export const dynamic = "force-dynamic";

// One post with its chat.
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  const [authors, book, market] = await Promise.all([
    playersByWallets([post.author]),
    post.coin ? getPositions(post.author).catch(() => null) : null,
    post.coin ? getCandles(post.coin) : null,
  ]);
  const player = authors.get(post.author);
  if (!player) notFound();
  const pos = book?.positions.find((x) => x.coin === post.coin) ?? null;

  return (
    <>
      {market && post.coin && <SeedMarkets markets={{ [post.coin]: market }} />}
      <Link className="back" href="/"><BackIcon /> Back to the Pit</Link>
      <div className="postpg">
        <section className="thesis">
          <div className="author">
            <Link href={`/u/${player.handle}`}><Avatar seed={post.author} size={52} label={player.name} /></Link>
            <PlayerLine player={player} sub={<span>{ago(new Date(post.created_at).getTime())} ago</span>} />
            <Tail wallet={post.author} handle={player.handle} />
          </div>
          <p style={{ fontSize: 20, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{post.body}</p>
          <div className="thesis stats">
            <span>Posted by <b>@{player.handle}</b></span>
            <span>{new Date(post.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
            <DeletePost id={post.id} author={post.author} handle={player.handle} />
          </div>
        </section>
        <div className="rcol">
          <div className="match">
            <div className="mh"><Avatar seed={post.author} size={34} label={player.name} /><div className="t"><span className="nm">{player.name}</span></div></div>
            {post.coin ? <PostBody post={{ ...post, body: "" }} pos={pos} market={market} /> : <p className="muted" style={{ padding: 12, margin: 0 }}>No position attached.</p>}
            <div className="acts">
              <GG target={`post:${post.id}`} />
              <Share path={`/p/${post.id}`} />
              <span className="sp" />
              <Tail wallet={post.author} handle={player.handle} small />
            </div>
          </div>
        </div>
        <section className="notes">
          <h2>CHAT</h2>
          <Chat target={`post:${post.id}`} />
        </section>
      </div>
    </>
  );
}
