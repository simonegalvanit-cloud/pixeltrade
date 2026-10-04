"use client";

import { useRouter } from "next/navigation";

// Makes a whole post clickable (like on X) without breaking the buttons inside it.
export default function PostLink({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <article
      className="post"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a,button,input")) return;
        router.push(href);
      }}
    >
      {children}
    </article>
  );
}
