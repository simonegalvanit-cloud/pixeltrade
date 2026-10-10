import Avatar from "@/components/Avatar";
import { Tabs } from "@/components/Buttons";
import Pit from "@/components/Pit";
import Side from "@/components/Side";
import Slip from "@/components/Slip";
import { ToastButton } from "@/components/Toast";
import { ME, POSTS } from "@/lib/mock";

// Home: The Pit (who is in a trade right now) and the live matches feed.
export default function Home() {
  return (
    <div className="home">
      <div>
        <div className="sec-h">
          <h2><span className="bl" />THE PIT</h2>
          <small>Live positions · bigger tile = bigger bet · brighter = bigger move</small>
        </div>
        <div className="arena"><Pit /></div>

        <div className="sec-h">
          <h2>MATCHES</h2>
          <Tabs options={["All", "Following", "Live", "Finished"]} label="Filter matches" />
        </div>

        <div className="compose">
          <Avatar handle={ME} size={34} />
          <input placeholder="Call your shot. What's the trade and why?" aria-label="Write a post" />
          <span className="att">₿ BTC ×5 attached</span>
          <ToastButton className="btn go sm" message="Posting comes in a later level">Post</ToastButton>
        </div>

        <div className="board">
          {POSTS.map((p) => <Slip key={p.id} post={p} />)}
        </div>
      </div>
      <Side />
    </div>
  );
}
