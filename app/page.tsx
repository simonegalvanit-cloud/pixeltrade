import Avatar from "@/components/Avatar";
import { Tabs } from "@/components/Buttons";
import Pit from "@/components/Pit";
import Side from "@/components/Side";
import Slip from "@/components/Slip";
import { ToastButton } from "@/components/Toast";
import { ME, POSTS } from "@/lib/mock";

// Home: The Pit (who is in a trade right now) and the receipts feed.
export default function Home() {
  return (
    <div className="home">
      <div>
        <div className="sec-h">
          <h2><span className="live-dot" />The <em>Pit</em></h2>
          <small>Open positions · tile size = position size</small>
        </div>
        <Pit />

        <div className="sec-h" style={{ flexWrap: "wrap" }}>
          <h2>Receipts</h2>
          <Tabs options={["Everyone", "Following", "Opens", "Closes"]} label="Filter receipts" />
        </div>

        <div className="compose">
          <Avatar handle={ME} size={34} />
          <input placeholder="What's your thesis? Attach a trade and post the receipt." aria-label="Write a post" />
          <span className="att">₿ BTC long 5x attached</span>
          <ToastButton className="btn solid sm" message="Posting comes in a later step">Post</ToastButton>
        </div>

        <div className="board">
          {POSTS.map((p) => <Slip key={p.id} post={p} />)}
        </div>
      </div>
      <Side />
    </div>
  );
}
