import Link from "next/link";
import Avatar from "@/components/Avatar";
import { Tabs } from "@/components/Buttons";
import { ImageIcon, TradeIcon } from "@/components/Icons";
import PostItem from "@/components/PostItem";
import { ToastButton } from "@/components/Toast";
import { ME, PEOPLE, POSTS, STORIES } from "@/lib/mock";

// Home feed: story rings, the composer, and trade posts.
export default function Home() {
  return (
    <section>
      <div className="hdr"><Tabs options={["For you", "Following"]} label="Feed" /></div>

      <div className="stories" aria-label="Traders with open positions">
        {STORIES.map((s, i) => (
          <Link className="story" href={`/u/${s.handle}`} key={s.handle}>
            <Avatar handle={s.handle} size={62} ring={s.ring} />
            <span className="n">{i === 0 ? "Your trades" : PEOPLE[s.handle].name.split(" ")[0]}</span>
            <span className={`p ${s.ring === "down" ? "down" : "up"}`}>{s.pnl}</span>
          </Link>
        ))}
      </div>

      <div className="composer">
        <Avatar handle={ME} size={40} />
        <div className="c">
          <textarea aria-label="Write a post" rows={2} defaultValue="BTC holding the 95k range low again. Adding to my long here, out below 93.5k." />
          <div className="attach">
            <span className="coin BTC">₿</span><b>BTC</b><span className="chip long">Long 5x</span>
            <span className="muted" style={{ fontSize: 13 }}>your open position</span>
            <span className="lvl">TP <input defaultValue="104,000" aria-label="Take profit" /></span>
            <span className="lvl">SL <input defaultValue="93,500" aria-label="Stop loss" /></span>
          </div>
          <div className="row">
            <div className="tools">
              <ToastButton className="ibtn" aria-label="Attach a trade" message="Pick one of your open trades"><TradeIcon small /></ToastButton>
              <ToastButton className="ibtn" aria-label="Add image" message="Images come in a later step"><ImageIcon small /></ToastButton>
              <ToastButton className="pill-select" message="Choose: show TP/SL now, when the trade closes, or never">TP/SL visible when closed ▾</ToastButton>
            </div>
            <ToastButton className="btn brand" message="Posting comes in a later step">Post</ToastButton>
          </div>
        </div>
      </div>

      {POSTS.map((p) => <PostItem key={p.id} post={p} />)}
    </section>
  );
}
