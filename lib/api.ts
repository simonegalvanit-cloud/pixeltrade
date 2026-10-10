import "server-only";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function host() {
  const h = await headers();
  return h.get("x-forwarded-host") ?? h.get("host") ?? "perpy";
}

export async function body<T>(req: Request): Promise<Partial<T>> {
  try { return (await req.json()) as Partial<T>; } catch { return {}; }
}
