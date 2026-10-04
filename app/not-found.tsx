import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty">
      <p>This page doesn&apos;t exist.</p>
      <Link className="btn brand" href="/">Back to the feed</Link>
    </div>
  );
}
