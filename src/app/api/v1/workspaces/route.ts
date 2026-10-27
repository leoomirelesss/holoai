import { apiRoute, jsonBody } from "@/lib/api/http";
import { idempotency, name, object, only } from "@/lib/api/validation";
import { bootstrapWorkspace } from "@/features/workspaces/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const POST = apiRoute(async (request, session) => {
  const key = idempotency(request.headers.get("idempotency-key"));
  const body = object(await jsonBody(request)); only(body, ["name"]);
  return { data: { workspace: await bootstrapWorkspace(session, name(body.name), key) } };
});
