import { apiRoute } from "@/lib/api/http";
import { historyOptions, uuid } from "@/lib/api/validation";
import { getBrand } from "@/features/brands/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ brandId: string }> }) {
  return apiRoute(async (incoming, session) => getBrand(session, uuid((await context.params).brandId), historyOptions(new URL(incoming.url))))(request);
}
