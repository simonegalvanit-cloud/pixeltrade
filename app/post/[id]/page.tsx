import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import { FollowButton, LikeButton } from "@/components/Buttons";
import { BackIcon, BellIcon, ReplyIcon, ShareIcon, VerifiedCheck } from "@/components/Icons";
import Receipt from "@/components/Receipt";
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
  // Highlight the last two words of the title like a marker pen.
  const words = (d?.title ?? "").split(" ");
  const head = words.slice(0, -2).join(" ");
  const tail = words.slice(-2).join(" ");

  return (
    <>
      <Link className="back" href="/"><BackIcon /> Back to the Pit</Link>
      <div className="postpg">
        <section className="thesis">
          <div className="author">
            <Link href={`/u/${u.handle}`}><Avatar handle={u.handle} size={48} ring={ringFor(u.handle)} /></Link>
            <Link className="t" href={`/u/${u.handle}`}>
              <b>{u.name} {u.verified && <VerifiedCheck />}</b>
              <span className="muted mono" style={{ fontSize: 13 }}>@{u.handle} · {post.time} ago</span>
            </Link>
            <ToastButton className="btn icon" aria-label={`Alerts for ${u.name}`} message="Trade alerts come in a later step"><BellIcon small /></ToastButton>
            <FollowButton />
          </div>

          {d ? (
            <>
              <h1>{head} <em>{tail}</em></h1>
              {d.paragraphs.map((t) => <p key={t}>{t}</p>)}
            </>
          ) : (
            <>
              <p className="mono muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em" }}>{post.context}</p>
              {post.text ? <h1 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>{post.text}</h1> : <p className="muted">Posted automatically, no note.</p>}
            </>
          )}

          <div className="thesis stats">
            {d && <span><b>{d.views}</b> views</span>}
            <span><b>{post.counts.likes}</b> likes</span>
            <span><b>{post.counts.reposts}</b> reposts</span>
            {d && <span><b>{d.alerts}</b> tailing</span>}
            {d && <span>{d.postedAt}</span>}
          </div>
        </section>

        <div className="rcol">
          <Receipt id={`detail-${post.id}`} no={140 + Number(post.id) * 7} handle={post.handle} time={post.time} card={post.card} chartHeight={200}>
            {d && (
              <>
                <hr />
                <div className="row"><span>Take profit</span><b className="up">{d.plan.tp}</b></div>
                <div className="row" style={{ fontSize: 11.5 }}><span /><em className="muted" style={{ fontStyle: "normal" }}>{d.plan.tpNote}</em></div>
                <div className="row"><span>Stop loss</span><b className="down">{d.plan.sl}</b></div>
                <div className="row" style={{ fontSize: 11.5 }}><span /><em className="muted" style={{ fontStyle: "normal" }}>{d.plan.slNote}</em></div>
                <hr />
                <div className="hd" style={{ marginBottom: 6 }}><span>Trade log</span></div>
                <ul className="lines">
                  {d.timeline.map((t) => (
                    <li key={t.title}><time>{t.time}</time><span>{t.title}<br /><em>{t.note}</em></span><span>{t.mark}</span></li>
                  ))}
                </ul>
              </>
            )}
          </Receipt>
        </div>

        <section className="notes">
          <h2>Margin notes {d && <span className="muted mono" style={{ fontSize: 14 }}>{d.replies.length}</span>}</h2>
          <div className="reply">
            <Avatar handle={ME} size={32} />
            <input placeholder="Add a note to this receipt" aria-label="Reply" />
            <ToastButton className="btn solid sm" message="Replies come in a later step">Reply</ToastButton>
          </div>
          {d?.replies.map((r) => {
            const ru = PEOPLE[r.handle];
            return (
              <article className="mnote" key={r.time}>
                <Link href={`/u/${ru.handle}`}><Avatar handle={ru.handle} size={36} /></Link>
                <div className="c">
                  <div className="h">{ru.name}{ru.verified && <VerifiedCheck />}<span>@{ru.handle} · {r.time}</span></div>
                  <p>{r.text}</p>
                  <div className="mini">
                    <LikeButton count={r.likes} />
                    <ToastButton className="pill" aria-label="Reply" message="Replies come in a later step"><ReplyIcon /></ToastButton>
                    <ToastButton className="pill" aria-label="Share" message="Link copied"><ShareIcon /></ToastButton>
                  </div>
                </div>
              </article>
            );
          })}
          {!d && <p className="muted">No notes yet.</p>}
        </section>
      </div>
    </>
  );
}
