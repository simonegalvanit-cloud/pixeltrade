import Link from "next/link";
import { PEOPLE, type Post } from "@/lib/mock";
import Avatar from "./Avatar";
import { BellIcon, ReplyIcon, RepostIcon, ShareIcon, VerifiedCheck } from "./Icons";
import { LikeButton } from "./Buttons";
import PostLink from "./PostLink";
import Receipt from "./Receipt";
import { ToastButton } from "./Toast";

// One post in the feed: who, their note, the receipt, and reactions.
export default function Slip({ post }: { post: Post }) {
  const u = PEOPLE[post.handle];
  const open = post.card.state === "open";
  const ring = open ? (post.card.stats.find((s) => s[0] === "PnL")?.[2] === "down" ? "down" : "up") : undefined;
  return (
    <PostLink href={`/post/${post.id}`} className="slip click">
      <div className="by">
        <Link href={`/u/${u.handle}`} aria-label={u.name}><Avatar handle={u.handle} size={34} ring={ring} /></Link>
        <Link className="nm" href={`/u/${u.handle}`}>{u.name}{u.verified && <VerifiedCheck />}</Link>
        <span className="meta">@{u.handle}</span>
        <ToastButton className="more ibtn" aria-label="More" message="Mute, report, or copy link">⋯</ToastButton>
      </div>
      <div className="ctx">{post.context}</div>
      {post.text && <p className="note">{post.text}</p>}
      <Receipt id={`feed-${post.id}`} no={140 + Number(post.id) * 7} handle={post.handle} time={post.time} card={post.card} />
      <div className="reacts">
        <LikeButton count={post.counts.likes} />
        <ToastButton className="pill" aria-label="Replies" message="Replies come in a later step"><ReplyIcon />{post.counts.replies}</ToastButton>
        <ToastButton className="pill" aria-label="Reposts" message="Reposts come in a later step"><RepostIcon />{post.counts.reposts}</ToastButton>
        <ToastButton className="pill" aria-label="Share" message="Link copied"><ShareIcon /></ToastButton>
        <ToastButton className="pill tail" aria-label={`Get alerts when ${u.name} trades`} message="Trade alerts come in a later step"><BellIcon small />Tail</ToastButton>
      </div>
    </PostLink>
  );
}
