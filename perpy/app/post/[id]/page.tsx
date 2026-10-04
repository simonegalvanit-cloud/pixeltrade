import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import { FollowButton, LikeButton } from "@/components/Buttons";
import { BackIcon, BellIcon, ReplyIcon, RepostIcon, ShareIcon, VerifiedCheck } from "@/components/Icons";
import TradeCard from "@/components/TradeCard";
import { ToastButton } from "@/components/Toast";
import { ME, PEOPLE, POSTS, ringFor } from "@/lib/mock";

// Build one page per post when the site is built.
export function generateStaticParams() {
  return POSTS.map((p) => ({ id: p.id }));
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = POSTS.find((p) => p.id === id);
  if (!post) notFound();
  const u = PEOPLE[post.handle];
  const d = post.detail;

  return (
    <section>
      <div className="hdr"><div className="hdr-t"><Link className="ibtn" href="/" aria-label="Back"><BackIcon /></Link>Post</div></div>

      <article className="detail">
        <div className="h">
          <Link href={`/u/${u.handle}`}><Avatar handle={u.handle} size={44} ring={ringFor(u.handle)} /></Link>
          <Link className="who" href={`/u/${u.handle}`}>
            <b>{u.name} {u.verified && <VerifiedCheck />}</b>
            <span className="muted">@{u.handle}</span>
          </Link>
          <ToastButton className="ibtn" aria-label={`Alerts for ${u.name}`} message="Trade alerts come in a later step"><BellIcon /></ToastButton>
          <FollowButton small />
        </div>

        {d ? (
          <>
            <h1>{d.title}</h1>
            {d.paragraphs.map((t) => <p key={t}>{t}</p>)}
          </>
        ) : (
          <>
            <p className="muted" style={{ fontSize: 14, margin: "12px 0 4px" }}>{post.context}</p>
            {post.text && <p>{post.text}</p>}
          </>
        )}

        <TradeCard id={`detail-${post.id}`} card={post.card} chartHeight={260} />

        {d && (
          <div className="plan">
            <div><span>Entry</span><b>{d.plan.entry}</b><small>{d.plan.entryNote}</small></div>
            <div className="tp"><span>Take profit</span><b className="up">{d.plan.tp}</b><small>{d.plan.tpNote}</small></div>
            <div className="sl"><span>Stop loss</span><b className="down">{d.plan.sl}</b><small>{d.plan.slNote}</small></div>
          </div>
        )}

        {d && <div className="meta-line">{d.postedAt} · <b style={{ color: "var(--text)" }}>{d.views}</b> views</div>}
        <div className="counts">
          <span><b>{post.counts.reposts}</b> reposts</span>
          <span><b>{post.counts.likes}</b> likes</span>
          {d && <span><b>{d.alerts}</b> set alerts</span>}
        </div>

        {d && (
          <div className="timeline" aria-label="Trade timeline">
            {d.timeline.map((t) => (
              <div className="tl" key={t.title}>
                <i className={t.icon}>{t.mark}</i>
                <div><b>{t.title}</b><p>{t.note}</p></div>
                <time>{t.time}</time>
              </div>
            ))}
          </div>
        )}
      </article>

      <div className="reply-box" style={{ borderTop: "1px solid var(--line)" }}>
        <Avatar handle={ME} size={40} />
        <input placeholder="Post your reply" aria-label="Reply" />
        <ToastButton className="btn brand sm" message="Replies come in a later step">Reply</ToastButton>
      </div>

      {d?.replies.map((r) => {
        const ru = PEOPLE[r.handle];
        return (
          <article className="post" key={r.time}>
            <Link href={`/u/${ru.handle}`}><Avatar handle={ru.handle} size={40} /></Link>
            <div className="c">
              <div className="h"><b>{ru.name}</b>{ru.verified && <VerifiedCheck />}<span className="hd">@{ru.handle} · {r.time}</span></div>
              <div className="txt" style={{ marginTop: 2 }}>{r.text}</div>
              <div className="acts">
                <ToastButton className="act" aria-label="Reply" message="Replies come in a later step"><ReplyIcon /></ToastButton>
                <ToastButton className="act" aria-label="Repost" message="Reposts come in a later step"><RepostIcon /></ToastButton>
                <LikeButton count={r.likes} />
                <span />
                <ToastButton className="act" aria-label="Share" message="Link copied"><ShareIcon /></ToastButton>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
