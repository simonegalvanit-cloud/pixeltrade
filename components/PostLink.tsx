"use client";

import { useRouter } from "next/navigation";

// Makes a whole post clickable without breaking the buttons and links inside it.
export default function PostLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <article
      className={className}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a,button,input")) return;
        router.push(href);
      }}
    >
      {children}
    </article>
  );
}
