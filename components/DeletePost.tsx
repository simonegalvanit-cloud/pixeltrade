"use client";

import { useRouter } from "next/navigation";
import { authFetch, useSession } from "./Session";
import { useToast } from "./Toast";

// Only the author sees this.
export function DeletePost({ id, author, handle }: { id: string; author: string; handle: string }) {
  const { address } = useSession();
  const router = useRouter();
  const toast = useToast();
  if (address !== author) return null;
  return (
    <button type="button" className="btn hot sm" onClick={async () => {
      if (!confirm("Delete this post? This can't be undone.")) return;
      const r = await authFetch(`/api/posts?id=${id}`, { method: "DELETE" });
      if (r.ok) { toast("Post deleted"); router.push(`/u/${handle}`); router.refresh(); }
      else toast("Couldn't delete");
    }}>Delete post</button>
  );
}
