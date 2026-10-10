// Arbitrum: the network where members hold USDC before it goes into Hyperliquid.

export const ARB_CHAIN_ID = 42161;
export const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // native USDC on Arbitrum (6 decimals)
// Hyperliquid's bridge: USDC sent here from your wallet is credited to the SAME
// address on Hyperliquid in about a minute. Anything under 5 USDC is lost forever.
// Docs call this route "legacy" (CCTP is newer) but it was verified in active use
// on 2026-10-10. TODO: move deposits to CCTP.
export const HL_BRIDGE = "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7";
export const MIN_DEPOSIT = 5;
export const ARB_RPC = "https://arb1.arbitrum.io/rpc";
// ETH needed in the wallet to pay for one deposit (~$0.03, actual cost is usually ~$0.01).
export const MIN_GAS_WEI = BigInt("10000000000000"); // 0.00001 ETH
