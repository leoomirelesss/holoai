import { apiRoute, jsonBody } from "@/lib/api/http";
import { expectedRevision, object, only, uuid } from "@/lib/api/validation";
import { approveProfile } from "@/features/brands/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ brandId: string }> }) {
  return apiRoute(async (incoming, session) => {
    const id = uuid((await context.params).brandId);
    const expected = expectedRevision(incoming.headers.get("if-match"), id);
    const body = object(await jsonBody(incoming)); only(body, ["revision_id"]);
    return approveProfile(session, id, uuid(body.revision_id), expected);
  })(request);
}
