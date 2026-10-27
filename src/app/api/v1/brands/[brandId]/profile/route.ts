import { apiRoute, jsonBody } from "@/lib/api/http";
import { expectedRevision, object, only, profilePatch, uuid } from "@/lib/api/validation";
import { saveProfile } from "@/features/brands/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function PATCH(request: Request, context: { params: Promise<{ brandId: string }> }) {
  return apiRoute(async (incoming, session) => {
    const id = uuid((await context.params).brandId);
    const expected = expectedRevision(incoming.headers.get("if-match"), id);
    const body = object(await jsonBody(incoming)); only(body, ["profile_document"]);
    return saveProfile(session, id, expected, profilePatch(body.profile_document));
  })(request);
}
