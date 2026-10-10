"use client";

import { useRouter } from "next/navigation";
import { useSession } from "./Session";
import { useToast } from "./Toast";

// Only the author sees this.
export function DeletePost({ id, author }: { id: string; author: string }) {
  const { address } = useSession();
  const router = useRouter();
  const toast = useToast();
  if (address !== author) return null;
  return (
    <button type="button" className="btn hot sm" onClick={async () => {
      if (!confirm("Delete this post? This can't be undone.")) return;
      const r = await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
      if (r.ok) { toast("Post deleted"); router.push(`/u/${author}`); router.refresh(); }
      else toast("Couldn't delete");
    }}>Delete post</button>
  );
}
