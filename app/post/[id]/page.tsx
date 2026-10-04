import { notFound } from "next/navigation";
import PostView from "@/components/PostView";
import { POSTS } from "@/lib/mock";

// Build one page per post when the site is built.
export function generateStaticParams() {
  return POSTS.map((p) => ({ id: p.id }));
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = POSTS.find((p) => p.id === id);
  if (!post) notFound();
  return <PostView post={post} />;
}
