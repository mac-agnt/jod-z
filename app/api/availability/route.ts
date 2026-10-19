import { NextResponse, type NextRequest } from "next/server";
import { getAvailability } from "@/lib/commerce";
import { getProduct } from "@/lib/products";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("product") ?? "";
  if (!getProduct(slug)) return NextResponse.json({ error: "Unknown product" }, { status: 404 });
  const availability = await getAvailability(slug);
  return NextResponse.json(availability, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
