import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty">
      <h1>GAME OVER</h1>
      <p>This page doesn&apos;t exist.</p>
      <Link className="btn go" href="/">Continue? Back to the Pit</Link>
    </div>
  );
}
