import { apiRoute } from "@/lib/api/http";
import { invalid } from "@/lib/api/errors";
import { currentWorkspace } from "@/features/workspaces/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const GET = apiRoute(async (request, session) => {
  if (new URL(request.url).search) throw invalid();
  return { data: { workspace: await currentWorkspace(session) } };
});
