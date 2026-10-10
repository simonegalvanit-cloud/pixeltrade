import WalletPanel from "@/components/WalletPanel";

export const metadata = { title: "Wallet · perpy" };

export default function Wallet() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="learn-h">
        <small className="kick">INSERT COIN</small>
        <h1>YOUR <em>WALLET</em></h1>
        <p>Your perpy wallet was created when you signed up. Only you control it: perpy never sees your keys.</p>
      </div>
      <WalletPanel />
    </div>
  );
}
