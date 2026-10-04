"use client";

import { useState } from "react";
import { LikeIcon } from "./Icons";

// These only change what you see on screen for now. Nothing is saved yet.

export function LikeButton({ count }: { count: number }) {
  const [liked, setLiked] = useState(false);
  return (
    <button className={`act${liked ? " liked" : ""}`} type="button" aria-label="Like" aria-pressed={liked}
      onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}>
      <LikeIcon /><span>{count + (liked ? 1 : 0)}</span>
    </button>
  );
}

export function FollowButton({ small }: { small?: boolean }) {
  const [following, setFollowing] = useState(false);
  return (
    <button className={`btn${following ? "" : " primary"}${small ? " sm" : ""}`} type="button" aria-pressed={following}
      onClick={(e) => { e.stopPropagation(); setFollowing(!following); }}>
      {following ? "Following" : "Follow"}
    </button>
  );
}

// Row of options where one is selected: tabs ("For you" / "Following") or a
// segmented control ("7D" / "30D" / "All").
export function Tabs({ options, initial = 0, variant = "tabs", label }: { options: string[]; initial?: number; variant?: "tabs" | "seg"; label?: string }) {
  const [on, setOn] = useState(initial);
  if (variant === "seg") {
    return (
      <div className="seg" role="group" aria-label={label}>
        {options.map((o, i) => (
          <button key={o} type="button" className={i === on ? "on" : ""} aria-pressed={i === on} onClick={() => setOn(i)}>{o}</button>
        ))}
      </div>
    );
  }
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {options.map((o, i) => (
        <button key={o} type="button" role="tab" aria-selected={i === on} className={i === on ? "on" : ""} onClick={() => setOn(i)}>{o}</button>
      ))}
    </div>
  );
}
