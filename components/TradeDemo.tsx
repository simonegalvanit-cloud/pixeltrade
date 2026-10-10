"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { fmtLevel, fmtPx, money, usd } from "@/lib/format";
import { useMarket } from "./Market";

// An animated walkthrough of opening a perp position, step by step.
// Everything on screen is worked out from (step, t): which step we're on and how
// many milliseconds into it we are. Prices come from the live BTC market.

const LEV = 5;
const MARGIN = 1000;
const TP = 0.04; // take profit at +4%
const SL = -0.02; // stop loss at −2%
const MAINT = 0.0125; // maintenance margin, roughly what Hyperliquid uses for BTC

const STEPS = [
  { title: "Connect your wallet", ms: 2600 },
  { title: "Pick a market", ms: 2600 },
  { title: "Long or short", ms: 2600 },
  { title: "Choose leverage", ms: 3200 },
  { title: "Put in your margin", ms: 3600 },
  { title: "Set take profit and stop loss", ms: 3400 },
  { title: "Open the trade", ms: 4400 },
  { title: "You enter the Pit", ms: 4200 },
];

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

export default function TradeDemo() {
  const { snap } = useMarket();
  const btc = snap?.markets.BTC;
  const live = btc?.px ?? 0;

  const [step, setStep] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const startRef = useRef(0);
  const entryRef = useRef(0);

  // Respect "reduce motion": no autoplay, every step shown finished.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(false);
      setT(STEPS[0].ms);
    }
  }, []);

  // The clock. Moves t forward and goes to the next step when one is done.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    startRef.current = performance.now() - t;
    const tick = (now: number) => {
      const el = now - startRef.current;
      if (el >= STEPS[step].ms) {
        setStep((s) => (s + 1) % STEPS.length);
        setT(0);
        return;
      }
      setT(el);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, step]);

  function jump(i: number) {
    setStep(i);
    setT(playing ? 0 : STEPS[i].ms);
  }

  // ---- what the ticket looks like at this moment ----
  const at = (s: number, ms: number) => step > s || (step === s && t >= ms);
  const connected = at(0, 1000);
  const picked = at(1, 1000);
  const isLong = at(2, 1000);
  const lev = step > 3 ? LEV : step === 3 ? 1 + (LEV - 1) * ease((t - 900) / 1500) : 1;
  const typed = step > 4 ? 6 : step === 4 ? Math.floor(clamp((t - 1100) / 900) * 6) : 0;
  const sizeInfo = at(4, 2200);
  const tpSet = at(5, 1100);
  const slSet = at(5, 1800);
  const pressing = step === 6 && t > 900 && t < 1150;
  const opened = at(6, 1000);
  const printP = step > 6 ? 1 : step === 6 ? ease((t - 1100) / 1700) : 0;
  const stampP = step > 6 ? 1 : step === 6 ? clamp((t - 3000) / 260) : 0;
  const posted = at(7, 700);

  // Entry is the live price until the trade opens, then it's frozen.
  if (!opened || !entryRef.current) entryRef.current = live;
  const entry = opened ? entryRef.current : live;
  const size = MARGIN * LEV;
  const liq = entry * (1 - 1 / LEV + MAINT);
  const tpPx = entry * (1 + TP);
  const slPx = entry * (1 + SL);
  const pnl = entry ? ((live - entry) / entry) * size : 0;

  // ---- the fake cursor: glides to whatever the current step is about ----
  const stage = useRef<HTMLDivElement>(null); // the whole demo; the cursor moves inside it
  const cursor = useRef<HTMLDivElement>(null);
  const targets = useRef<(HTMLElement | null)[]>([]);
  const clickMs = [900, 900, 900, 900, 900, 900, 900, 400][step];
  const clicking = t > clickMs && t < clickMs + (step === 3 ? 1500 : 260);
  useLayoutEffect(() => {
    const el = targets.current[step];
    const box = stage.current?.getBoundingClientRect();
    const c = cursor.current;
    if (!el || !box || !c) return;
    const r = el.getBoundingClientRect();
    c.style.transform = `translate(${r.left - box.left + r.width / 2}px, ${r.top - box.top + r.height / 2}px)`;
  });
  const ref = (i: number) => (el: HTMLElement | null) => { targets.current[i] = el; };
  const focus = (i: number) => (step === i ? " focus" : "");

  const typedText = "$1,000".slice(0, typed);
  const spark = btc ? btc.c.slice(-36) : [];
  if (spark.length) spark[spark.length - 1] = live;

  const stepsList = (
    <div className="steps">
      <ol>
        {STEPS.map((s, i) => (
          <li key={s.title} className={i === step ? "on" : i < step ? "done" : ""}>
            <button type="button" onClick={() => jump(i)}>
              <span className="n">{i + 1}</span>
              <span className="tx">
                <b>{s.title}</b>
                {i === step && <span className="ex">{explain(i, { live, liq, tpPx, slPx, entry })}</span>}
              </span>
            </button>
            {i === step && <span className="bar" style={{ width: `${(t / s.ms) * 100}%` }} />}
          </li>
        ))}
      </ol>
      <div className="ctrl">
        <button type="button" className="btn go sm" onClick={() => { if (!playing) setT(0); setPlaying(!playing); }}>{playing ? "❚❚ Pause" : "▶ Play"}</button>
        <button type="button" className="btn sm" onClick={() => jump(Math.max(0, step - 1))}>← Back</button>
        <button type="button" className="btn sm" onClick={() => jump((step + 1) % STEPS.length)}>Next →</button>
      </div>
    </div>
  );

  return (
    <div className="demo" ref={stage}>
      {stepsList}
      <div className="stage">
        <div className="ticket">
          <div className={`trow${focus(0)}`}>
            <span className="lbl">Wallet</span>
            <button type="button" tabIndex={-1} ref={ref(0)} className={`wbtn${connected ? " ok" : ""}`}>
              {connected ? <><i />0x7a3f…c91e</> : "Connect wallet"}
            </button>
          </div>

          <div className={`trow${focus(1)}`}>
            <span className="lbl">Market</span>
            <span ref={ref(1)} className={`mkt${picked ? " on" : ""}`}>
              <span className="coin BTC">₿</span>BTC-PERP
              <b className="mono">{live ? fmtPx(live) : "…"}</b>
            </span>
          </div>

          <div className={`side2${focus(2)}`}>
            <span ref={ref(2)} className={`sbtn long${isLong ? " on" : ""}`}>Long ↑</span>
            <span className="sbtn short">Short ↓</span>
          </div>

          <div className={`trow col${focus(3)}`}>
            <div className="lrow"><span className="lbl">Leverage</span><b className="mono">{Math.round(lev)}x</b></div>
            <div className="slider">
              <span className="fill" style={{ width: `${((lev - 1) / 9) * 100}%` }} />
              {[1, 2, 3, 5, 10].map((v) => <span key={v} className="tick" style={{ left: `${((v - 1) / 9) * 100}%` }}>{v}x</span>)}
              <span ref={ref(3)} className="thumb" style={{ left: `${((lev - 1) / 9) * 100}%` }} />
            </div>
          </div>

          <div className={`trow col${focus(4)}`}>
            <div className="lrow"><span className="lbl">Margin (your money)</span></div>
            <div ref={ref(4)} className="field mono">{typedText}<span className={`caret${step === 4 && typed < 6 ? "" : " off"}`} />{!typed && <span className="ph">$0</span>}</div>
            <div className={`facts${sizeInfo ? " show" : ""}`}>
              <span>Position <b>{money(size)}</b></span>
              <span>Liq. ≈ <b className="down">{entry ? fmtLevel(liq) : "…"}</b></span>
            </div>
          </div>

          <div className={`trow tpsl${focus(5)}`}>
            <div ref={ref(5)} className={`field2${tpSet ? " set" : ""}`}><span>TP</span><b className="up mono">{tpSet && entry ? fmtLevel(tpPx) : "—"}</b></div>
            <div className={`field2${slSet ? " set" : ""}`}><span>SL</span><b className="down mono">{slSet && entry ? fmtLevel(slPx) : "—"}</b></div>
          </div>
          {spark.length > 1 && (
            <div className={`minibox${tpSet ? " show" : ""}`}>
            <span className="mt up">TP {entry ? fmtLevel(tpPx) : ""} ↑</span>
            <span className="mb down">SL {entry ? fmtLevel(slPx) : ""} ↓</span>
            <svg className="mini" viewBox="0 0 300 54" preserveAspectRatio="none" aria-hidden="true">
              {(() => {
                const mn = Math.min(...spark), mx = Math.max(...spark), pad = (mx - mn) * 0.25 || 1;
                const yy = (v: number) => 50 - ((v - (mn - pad)) / (mx + pad - (mn - pad))) * 46;
                const pin = (v: number) => Math.min(51, Math.max(3, yy(v)));
                return (
                  <>
                    <line x1="0" x2="300" y1={pin(tpPx)} y2={pin(tpPx)} stroke="var(--up)" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                    <line x1="0" x2="300" y1={pin(slPx)} y2={pin(slPx)} stroke="var(--down)" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                    <path d={spark.map((v, i) => `${i ? "L" : "M"}${((i / (spark.length - 1)) * 300).toFixed(1)},${yy(v).toFixed(1)}`).join("")} fill="none" stroke="var(--cyan)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
                  </>
                );
              })()}
            </svg>
            </div>
          )}

          <button type="button" tabIndex={-1} ref={ref(6)} className={`openbtn${pressing ? " press" : ""}${opened ? " done" : ""}`}>
            {opened ? "✓ FILLED" : `OPEN LONG ×${Math.round(lev)}`}
          </button>
        </div>
      </div>

      <div className="out">
        <div className={`pbar${printP > 0 && printP < 1 ? " busy" : ""}`} aria-hidden="true"><span>MATCH CARD</span><i /></div>
        {/* the match card that drops out of the slot */}
        <div className="printer" style={{ height: `${printP * 190}px` }} aria-hidden={printP === 0}>
          <div className="card">
            <div className="ttl"><span className="coin BTC">₿</span><b>BTC-PERP</b><span className="tag long">long ×{LEV}</span></div>
            <div className="row"><span>Entry</span><b>{entry ? fmtPx(entry) : "…"}</b></div>
            <div className="row"><span>Size</span><b>{money(size)}</b></div>
            <div className="row"><span>Take profit</span><b className="up">{entry ? fmtLevel(tpPx) : "…"}</b></div>
            <div className="row"><span>Stop loss</span><b className="down">{entry ? fmtLevel(slPx) : "…"}</b></div>
            <div className="row" style={{ marginTop: 6 }}><span>Score</span><b className={pnl >= 0 ? "up" : "down"}>{usd(pnl)}</b></div>
            <span className="ready" style={{ opacity: stampP, transform: `scale(${2 - stampP})` }}>READY!</span>
          </div>
        </div>

        <div ref={ref(7)} className={`pittile${posted ? " show" : ""}`}>
          <span className="who">P1 · BTC long ×{LEV}</span>
          <b className={pnl >= 0 ? "up" : "down"}>{usd(pnl)}</b>
          <small>in the Pit · 312 tailers alerted</small>
        </div>

        {printP === 0 && <p className="out-empty">Your match card drops here when the trade opens.</p>}
      </div>

      <div ref={cursor} className={`cursor${clicking ? " click" : ""}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" shapeRendering="crispEdges"><path d="M4 2l15 9-6.5 1.6L9.6 19z" fill="#fff" stroke="#000" strokeWidth="1.6" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
}

// Plain-language explanation for each step, with live numbers.
function explain(i: number, n: { live: number; liq: number; tpPx: number; slPx: number; entry: number }) {
  const p = (v: number) => (n.entry ? fmtLevel(v) : "…");
  switch (i) {
    case 0: return "Your wallet is your account. No email or password: you sign with your wallet, and your trades are read straight from the chain.";
    case 1: return `BTC-PERP is a "perpetual": it follows Bitcoin's price and never expires. Right now it's ${n.live ? fmtPx(n.live) : "…"} on Hyperliquid.`;
    case 2: return "Long means you make money if the price goes up. Short means you make money if it goes down.";
    case 3: return `Leverage multiplies the move. At ${LEV}x, every 1% BTC moves is a ${LEV}% gain or loss on your money.`;
    case 4: return `Your $1,000 controls a $${(MARGIN * LEV).toLocaleString("en-US")} position. If BTC drops to about ${p(n.liq)} (−${((1 / LEV - MAINT) * 100).toFixed(1)}%), you're liquidated and lose the $1,000.`;
    case 5: return `Take profit closes the trade automatically at ${p(n.tpPx)} (+$${(MARGIN * LEV * TP).toFixed(0)}). Stop loss gets you out at ${p(n.slPx)} (−$${(MARGIN * LEV * -SL).toFixed(0)}) so one bad trade can't wipe you out.`;
    case 6: return "One signature and the order fills at the market price. perpy reads it straight from the chain and makes your match card, so nobody can fake it.";
    case 7: return "Your match goes live, your tile lights up in the Pit, and everyone tailing you gets an alert. WIN or REKT, it's all on the record.";
    default: return "";
  }
}
