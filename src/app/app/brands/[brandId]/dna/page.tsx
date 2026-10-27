import { createHash, randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { apiSession } from "@/lib/api/session";
import { ApiError } from "@/lib/api/errors";
import { getBrand } from "@/features/brands/server";
import { workspaceAccess } from "@/features/workspaces/server";
import { DnaEditor } from "@/features/brand-dna/editor";

export const dynamic = "force-dynamic";
export default async function BrandDnaPage({ params }: { params: Promise<{ brandId: string }> }) {
  const user = await requireUser();
  const { brandId: raw } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) notFound();
  const brandId = raw.toLowerCase();
  let owner = false, authorized = false;
  try {
    const session = await apiSession();
    if (session.user.id !== user.id) throw new ApiError(404, "NOT_FOUND", "Resource unavailable");
    const brand = await getBrand(session, brandId, { include: false, limit: 20, before: undefined, selected: undefined });
    const access = await workspaceAccess(session, brand.data.brand.workspace_id);
    owner = access.membership.role === "owner" && access.workspace.owner_user_id === session.user.id;
    authorized = true;
  } catch (error) {
    if (error instanceof ApiError && [401, 403, 404].includes(error.status)) notFound();
    // Temporary outages render a retryable state, never an authorized nav link.
  }
  const scope = createHash("sha256").update(user.id).digest("hex");
  return <DnaEditor key={`${scope}:${brandId}`} brandId={brandId} scope={scope} owner={owner} authorized={authorized} validationNonce={randomUUID()} />;
}
