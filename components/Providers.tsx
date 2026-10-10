"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { arbitrum } from "viem/chains";
import { PRIVY_APP_ID } from "@/lib/privy";
import { MeSync } from "./Session";

// Privy handles sign-up/login (email, Google, Apple) and creates each member's
// wallet. Only the member controls it: perpy never sees the private key.
// Wallets live on Arbitrum, where USDC is deposited into Hyperliquid.
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "google", "apple"],
        appearance: {
          theme: "dark",
          accentColor: "#39FF88",
          landingHeader: "Enter the Pit",
          loginMessage: "Trade perps in public. Real money, real trades.",
          walletChainType: "ethereum-only",
        },
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
        defaultChain: arbitrum,
        supportedChains: [arbitrum],
      }}
    >
      <MeSync />
      {children}
    </PrivyProvider>
  );
}
