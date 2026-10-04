import Link from "next/link";
import { PEOPLE, type Post } from "@/lib/mock";
import Avatar from "./Avatar";
import { BellIcon, ReplyIcon, RepostIcon, ShareIcon, VerifiedCheck } from "./Icons";
import { LikeButton } from "./Buttons";
import PostLink from "./PostLink";
import TradeCard from "./TradeCard";
import { ToastButton } from "./Toast";

// One post in the feed: who, when, what they said, and the attached trade.
export default function PostItem({ post }: { post: Post }) {
  const u = PEOPLE[post.handle];
  const pnlDir = post.card.state === "open" ? post.card.stats[3]?.[2] : undefined;
  return (
    <PostLink href={`/post/${post.id}`}>
      <Link href={`/u/${u.handle}`} aria-label={u.name}>
        <Avatar handle={u.handle} size={40} ring={post.card.state === "open" ? (pnlDir === "up" ? "up" : "down") : undefined} />
      </Link>
      <div className="c">
        <div className="h">
          <Link href={`/u/${u.handle}`} style={{ display: "contents" }}><b>{u.name}</b>{u.verified && <VerifiedCheck />}</Link>
          <span className="hd">@{u.handle} · {post.time}</span>
          <ToastButton className="more ibtn" style={{ width: 32, height: 32 }} aria-label="More" message="Mute, report, or copy link">⋯</ToastButton>
        </div>
        <div className="ctx">{post.context}</div>
        {post.text && <div className="txt">{post.text}</div>}
        <TradeCard id={`feed-${post.id}`} card={post.card} />
        <div className="acts">
          <ToastButton className="act" aria-label="Reply" message="Replies come in a later step"><ReplyIcon />{post.counts.replies}</ToastButton>
          <ToastButton className="act" aria-label="Repost" message="Reposts come in a later step"><RepostIcon />{post.counts.reposts}</ToastButton>
          <LikeButton count={post.counts.likes} />
          <ToastButton className="act" aria-label={`Alerts for ${u.name}`} message="Trade alerts come in a later step"><BellIcon small /></ToastButton>
          <ToastButton className="act" aria-label="Share" message="Link copied"><ShareIcon /></ToastButton>
        </div>
      </div>
    </PostLink>
  );
}
