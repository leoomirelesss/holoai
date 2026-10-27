import { apiRoute, jsonBody } from "@/lib/api/http";
import { name, object, only, uuid, website } from "@/lib/api/validation";
import { createBrand } from "@/features/brands/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  return apiRoute(async (incoming, session) => {
    const id = uuid((await context.params).workspaceId);
    const body = object(await jsonBody(incoming)); only(body, ["name", "website_url"]);
    const data = await createBrand(session, id, name(body.name), body.website_url === undefined ? null : website(body.website_url));
    return { data, status: 201, headers: { Location: `/api/v1/brands/${data.brand_id}` } };
  })(request);
}
