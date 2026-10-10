"use client";

import { useState } from "react";

// These only change what you see on screen for now. Nothing is saved yet.

// "GG" = good game, the arcade version of a like.
export function LikeButton({ count, className = "btn gg" }: { count: number; className?: string }) {
  const [liked, setLiked] = useState(false);
  return (
    <button className={`${className}${liked ? " on" : ""}`} type="button" aria-label="GG (like)" aria-pressed={liked}
      onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}>
      GG <span className="mono">{count + (liked ? 1 : 0)}</span>
    </button>
  );
}

export function FollowButton({ small, className = "" }: { small?: boolean; className?: string }) {
  const [following, setFollowing] = useState(false);
  return (
    <button className={`btn${following ? " on" : " cy"}${small ? " sm" : ""} ${className}`.trim()} type="button" aria-pressed={following}
      onClick={(e) => { e.stopPropagation(); setFollowing(!following); }}>
      {following ? "✓ Following" : "+ Follow"}
    </button>
  );
}

// A row of options where one is selected: filter chips or a small segmented control.
export function Tabs({ options, initial = 0, variant = "chips", label }: { options: string[]; initial?: number; variant?: "chips" | "seg"; label?: string }) {
  const [on, setOn] = useState(initial);
  return (
    <div className={variant} role="group" aria-label={label}>
      {options.map((o, i) => (
        <button key={o} type="button" className={i === on ? "on" : ""} aria-pressed={i === on} onClick={() => setOn(i)}>{o}</button>
      ))}
    </div>
  );
}
