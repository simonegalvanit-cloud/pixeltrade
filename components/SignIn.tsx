"use client";

import Link from "next/link";
import { useState } from "react";
import { shortAddr } from "@/lib/hyperliquid";
import Avatar from "./Avatar";
import { signIn, signOut, useSession } from "./Session";
import { ConnectButton, disconnectWallet, useWallet } from "./Wallet";
import { useToast } from "./Toast";

// Top-right of the header: sign in, or your P1 badge once signed in.
// If accounts aren't set up on the server yet, it falls back to "connect only".
export default function SignInBadge() {
  const { address: signed, enabled, loaded } = useSession();
  const { address: wallet } = useWallet();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const who = signed ?? wallet;
  if (!who) {
    if (loaded && !enabled) return <ConnectButton />;
    return (
      <button type="button" className="btn go sm" disabled={busy} onClick={async () => {
        setBusy(true);
        try { await signIn(); toast("Signed in. Welcome, P1"); } catch (e) { toast((e as Error).message.slice(0, 60)); } finally { setBusy(false); }
      }}>{busy ? "Check your wallet…" : "Sign in"}</button>
    );
  }
  return (
    <span className="p1">
      <Link href={`/u/${who}`} style={{ display: "flex", alignItems: "center", gap: 10 }} aria-label="Your player card">
        <Avatar seed={who} size={34} label="You" />
        <span className="t"><small>{signed ? "P1 · SIGNED IN" : "P1 · CONNECTED"}</small><b>{shortAddr(who)}</b></span>
      </Link>
      {!signed && enabled && (
        <button type="button" className="btn go sm" disabled={busy} onClick={async () => {
          setBusy(true);
          try { await signIn(); toast("Signed in"); } catch (e) { toast((e as Error).message.slice(0, 60)); } finally { setBusy(false); }
        }}>{busy ? "…" : "Sign in"}</button>
      )}
      <button type="button" className="ibtn hide-m" onClick={() => { if (signed) signOut(); disconnectWallet(); }} title="Sign out" aria-label="Sign out">✕</button>
    </span>
  );
}
