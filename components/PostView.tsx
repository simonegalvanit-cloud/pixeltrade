"use client";

import Link from "next/link";
import Avatar from "@/components/Avatar";
import { FollowButton, LikeButton } from "@/components/Buttons";
import { BackIcon, BellIcon, VerifiedCheck } from "@/components/Icons";
import TradeCard from "@/components/TradeCard";
import { ToastButton } from "@/components/Toast";
import { ME, PEOPLE, levelOf, type Post } from "@/lib/mock";
import { fmtLevel } from "@/lib/format";
import { fillText, livePosition } from "@/lib/positions";
import { useMarket } from "./Market";
import { Flame } from "./Slip";

// A single match: the trader's call on the left, the live card on the right,
// and the chat underneath. Every price in the text comes from the live position.
export default function PostView({ post }: { post: Post }) {
  const { snap } = useMarket();
  const u = PEOPLE[post.handle];
  const d = post.detail;
  const p = post.trade.kind === "open" ? livePosition(post.trade.pos, snap) : null;
  const ring = p ? (p.pnl >= 0 ? "up" : "down") : undefined;
  const fill = (t: string) => fillText(t, p);
  const words = (d?.title ?? "").split(" ");
  const head = words.slice(0, -2).join(" ");
  const tail = words.slice(-2).join(" ");
  const state = post.trade.kind === "open" ? "" : post.trade.move >= 0 ? " won" : " rekt";

  return (
    <>
      <Link className="back" href="/"><BackIcon /> Back to the Pit</Link>
      <div className="postpg">
        <section className="thesis">
          <div className="author">
            <Link href={`/u/${u.handle}`}><Avatar handle={u.handle} size={52} ring={ring} /></Link>
            <Link className="t" href={`/u/${u.handle}`}>
              <b>{u.name} {u.verified && <VerifiedCheck />}</b>
              <span className="sub" style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}><span className="tag lv">LV.{levelOf(u)}</span><span className="tag cl">{u.klass}</span><Flame n={u.streak} /><span className="mono muted" style={{ fontSize: 12 }}>{post.time} ago</span></span>
            </Link>
            <ToastButton className="btn icon" aria-label={`Alerts for ${u.name}`} message="Trade alerts come in a later level"><BellIcon small /></ToastButton>
            <FollowButton />
          </div>

          {d ? (
            <>
              <h1>{head} <em>{tail}</em></h1>
              {d.paragraphs.map((t) => <p key={t}>{fill(t)}</p>)}
            </>
          ) : (
            <>
              <p className="ck cyan" style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase" }}>{post.context}</p>
              {post.text ? <h1 style={{ fontSize: "clamp(16px,2.4vw,24px)" }}>{fill(post.text)}</h1> : <p className="muted">Posted automatically, no words, just the trade.</p>}
            </>
          )}

          <div className="thesis stats">
            {d && <span><b>{d.views}</b> watching</span>}
            <span><b>{post.counts.likes}</b> GGs</span>
            <span><b>{post.counts.reposts}</b> reposts</span>
            {d && <span><b>{d.alerts}</b> tailing</span>}
            {d && <span>{d.postedAt}</span>}
          </div>
        </section>

        <div className="rcol">
          <div className={`match${state}`}>
            <TradeCard id={`detail-${post.id}`} handle={post.handle} trade={post.trade} chartHeight={220}>
              {d && p && (
                <>
                  <div className="plan">
                    <div><span>Take profit</span><b className="up">{p.tpPx ? fmtLevel(p.tpPx) : "—"}</b><small>{fill("{tpNote}")}</small></div>
                    <div><span>Stop loss</span><b className="down">{p.slPx ? fmtLevel(p.slPx) : "—"}</b><small>{fill("{slNote}")}</small></div>
                  </div>
                  <ul className="log" aria-label="Trade log">
                    {d.timeline.map((t) => (
                      <li key={t.title}><time>{t.time}</time><span>{t.title}<br /><em>{fill(t.note)}</em></span></li>
                    ))}
                  </ul>
                </>
              )}
            </TradeCard>
            <div className="acts">
              <LikeButton count={post.counts.likes} />
              <span className="sp" />
              <ToastButton className="btn cy" message="Trade alerts come in a later level"><BellIcon small />Tail</ToastButton>
            </div>
          </div>
        </div>

        <section className="notes">
          <h2>CHAT {d && <span className="muted mono" style={{ fontSize: 12 }}>({d.replies.length})</span>}</h2>
          <div className="chatbox">
            {d?.replies.map((r) => {
              const ru = PEOPLE[r.handle];
              return (
                <article className="cmsg" key={r.time}>
                  <Link href={`/u/${ru.handle}`}><Avatar handle={ru.handle} size={30} /></Link>
                  <div className="c">
                    <div className="h">{ru.name.split(" ")[0]}{ru.verified && <VerifiedCheck />}<span className="tag lv">LV.{levelOf(ru)}</span><span>{r.time}</span></div>
                    <p>{r.text}</p>
                  </div>
                </article>
              );
            })}
            {!d && <p className="muted" style={{ padding: "8px 12px", margin: 0 }}>No chat yet. Say GG.</p>}
            <div className="reply">
              <Avatar handle={ME} size={28} />
              <input placeholder="type a message…" aria-label="Reply" />
              <ToastButton className="btn go sm" message="Chat comes in a later level">Send</ToastButton>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
