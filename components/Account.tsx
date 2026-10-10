"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { authFetch, refreshMe, signIn, signOut, useSession } from "./Session";
import { useToast } from "./Toast";

// Header, top right: "Sign up / Log in", or your P1 badge.
export function AccountBadge() {
  const { ready, authenticated, member, needsProfile, enabled } = useSession();
  if (!ready) return <span className="skel" style={{ width: 120, height: 30 }} />;
  if (member) {
    return (
      <span className="p1">
        <Link href={`/u/${member.handle}`} style={{ display: "flex", alignItems: "center", gap: 10 }} aria-label="Your player card">
          <Avatar seed={member.wallet} size={34} label="You" />
          <span className="t"><small>P1</small><b>@{member.handle}</b></span>
        </Link>
        <Link href="/wallet" className="btn go sm hide-m">Deposit</Link>
        <button type="button" className="ibtn hide-m" onClick={() => signOut()} title="Log out" aria-label="Log out">⏻</button>
      </span>
    );
  }
  if (authenticated && needsProfile) return <Link className="btn go sm" href="/welcome">Finish sign-up</Link>;
  return (
    <button type="button" className="btn go sm" onClick={() => signIn()} disabled={!enabled}>
      Sign up / Log in
    </button>
  );
}

// "Edit profile" on your own player card.
export function EditProfile({ handle }: { handle: string }) {
  const { member } = useSession();
  if (member?.handle !== handle) return null;
  return <Link className="btn" href="/welcome?edit=1">Edit profile</Link>;
}

// Pick your @handle and name (new members), or edit them.
export function WelcomeForm({ edit }: { edit: boolean }) {
  const { ready, authenticated, member } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [check, setCheck] = useState<{ ok: boolean; reason?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (member) { setHandle(member.handle); setName(member.name); setBio(member.bio); }
  }, [member]);

  // Is the handle free? (checked half a second after you stop typing)
  useEffect(() => {
    const h = handle.toLowerCase();
    if (!h || h === member?.handle) { setCheck(null); return; }
    const t = setTimeout(async () => {
      try { setCheck(await (await fetch(`/api/members?check=${encodeURIComponent(h)}`)).json()); } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [handle, member?.handle]);

  if (!ready) return null;
  if (!authenticated) {
    return (
      <div className="welcome">
        <p>Sign up first: email, Google or Apple.</p>
        <button type="button" className="btn go" onClick={() => signIn()}>Sign up / Log in</button>
      </div>
    );
  }
  if (member && !edit) {
    return (
      <div className="welcome">
        <p>You&apos;re all set, @{member.handle}.</p>
        <Link className="btn go" href="/wallet">Fund your account →</Link>
      </div>
    );
  }

  async function save() {
    setBusy(true);
    try {
      const r = await authFetch("/api/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle, name, bio }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Couldn't save.");
      await refreshMe();
      toast(edit ? "Profile saved" : `Welcome to the Pit, @${d.member.handle}`);
      router.push(edit ? `/u/${d.member.handle}` : "/wallet");
    } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  }

  const h = handle.toLowerCase();
  const valid = /^[a-z0-9_]{3,15}$/.test(h) && name.trim().length > 0;
  return (
    <form className="welcome" onSubmit={(e) => { e.preventDefault(); if (valid) save(); }}>
      <label className="fld">
        <span>Your @handle</span>
        <div className="at"><b>@</b><input value={handle} onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 15))} placeholder="maya" autoFocus spellCheck={false} autoCapitalize="none" /></div>
        <small className={check ? (check.ok ? "up" : "down") : "muted"}>
          {check ? (check.ok ? `✓ @${h} is free` : check.reason === "taken" ? `@${h} is taken` : check.reason) : "3–15 letters, numbers or _. You can change it later."}
        </small>
      </label>
      <label className="fld">
        <span>Display name</span>
        <input value={name} onChange={(e) => setName(e.target.value.slice(0, 30))} placeholder="Maya Chen" />
      </label>
      <label className="fld">
        <span>Bio <em>(optional)</em></span>
        <textarea value={bio} rows={2} onChange={(e) => setBio(e.target.value.slice(0, 160))} placeholder="BTC swing trader. Max 5x, always a stop." />
      </label>
      <button type="submit" className="btn go" disabled={!valid || busy || (check !== null && !check.ok)}>{busy ? "Saving…" : edit ? "Save" : "Enter the Pit →"}</button>
    </form>
  );
}
