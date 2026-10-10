"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";

type Hit = { handle: string; name: string; wallet: string };

// Find perpy players by @handle.
export function MemberSearch({ big }: { big?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const s = q.trim().replace(/^@/, "");
    if (!s) { setHits([]); return; }
    const t = setTimeout(async () => {
      try { setHits((await (await fetch(`/api/members?q=${encodeURIComponent(s)}`)).json()).members ?? []); } catch {}
    }, 200);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <form className={`wsearch${big ? " big" : ""}`} onSubmit={(e) => { e.preventDefault(); if (hits[0]) router.push(`/u/${hits[0].handle}`); }}
      onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a player @…" aria-label="Find a player" spellCheck={false} autoCapitalize="none" />
      {open && q && (
        <div className="hits">
          {hits.length === 0 && <span className="muted mono">No player called @{q.replace(/^@/, "")}</span>}
          {hits.map((h) => (
            <Link key={h.handle} href={`/u/${h.handle}`} onClick={() => setQ("")}>
              <Avatar seed={h.wallet} size={26} label={h.name} /><b>{h.name}</b><span>@{h.handle}</span>
            </Link>
          ))}
        </div>
      )}
    </form>
  );
}
