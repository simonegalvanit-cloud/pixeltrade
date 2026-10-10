import { createPublicClient, http, parseAbi } from "viem";
import { arbitrum } from "viem/chains";
import { fail, json } from "@/lib/api";
import { ARB_RPC, USDC } from "@/lib/arbitrum";
import { fetchState } from "@/lib/hyperliquid";

export const dynamic = "force-dynamic";

const client = createPublicClient({ chain: arbitrum, transport: http(ARB_RPC) });

// Balances for a wallet: USDC and ETH on Arbitrum, and the Hyperliquid account.
export async function GET(req: Request) {
  const a = new URL(req.url).searchParams.get("address")?.toLowerCase() ?? "";
  if (!/^0x[0-9a-f]{40}$/.test(a)) return fail("Bad address");
  const addr = a as `0x${string}`;
  const [usdc, eth, hl] = await Promise.all([
    client.readContract({ address: USDC, abi: parseAbi(["function balanceOf(address) view returns (uint256)"]), functionName: "balanceOf", args: [addr] }).catch(() => null),
    client.getBalance({ address: addr }).catch(() => null),
    fetchState(a, { cache: "no-store" }).catch(() => null),
  ]);
  return json({
    usdc: usdc === null ? null : Number(usdc) / 1e6,
    eth: eth === null ? null : Number(eth) / 1e18,
    usdcRaw: usdc === null ? null : usdc.toString(), // exact amount, 6 decimals
    ethRaw: eth === null ? null : eth.toString(), // exact amount in wei
    hl: hl ? { accountValue: +hl.marginSummary.accountValue, withdrawable: +(hl as unknown as { withdrawable: string }).withdrawable } : null,
  });
}
