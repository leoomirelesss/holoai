import "server-only";
import type { ApiSession } from "@/lib/api/session";
import { conflict, notFound, query, requiredQuery, unavailable } from "@/lib/api/errors";
import { etag, mergeProfile, type ProfilePatch, type historyOptions } from "@/lib/api/validation";
import type { BrandRow, BrandRevisionRow } from "@/lib/data/database.types";
import { workspaceAccess } from "@/features/workspaces/server";

function brandDTO(row: BrandRow) {
  return { id: row.id, workspace_id: row.workspace_id, name: row.name, website_url: row.website_url, revision: row.revision, archived_at: row.archived_at, created_at: row.created_at, updated_at: row.updated_at };
}
function revisionDTO(row: BrandRevisionRow) {
  return { id: row.id, revision_number: row.revision_number, profile_document: row.profile_document, approval_status: row.approval_status, approved_at: row.approved_at, created_at: row.created_at };
}
async function brandAccess(session: ApiSession, id: string, owner = false) {
  const brand = await query(session.client.from("brands").select("*").eq("id", id).maybeSingle());
  if (!brand) throw notFound();
  await workspaceAccess(session, brand.workspace_id, owner);
  return brand;
}
async function revision(session: ApiSession, brand: BrandRow, id: string) {
  const row = await query(session.client.from("brand_revisions").select("*").eq("workspace_id", brand.workspace_id).eq("brand_id", brand.id).eq("id", id).maybeSingle());
  if (!row) throw notFound();
  return row;
}
export async function createBrand(session: ApiSession, workspaceId: string, name: string, website: string | null) {
  await workspaceAccess(session, workspaceId, true);
  const id = await requiredQuery(session.client.rpc("create_brand", { p_workspace_id: workspaceId, p_name: name, p_website_url: website }));
  const initial = await query(session.client.from("brand_revisions").select("*").eq("workspace_id", workspaceId).eq("brand_id", id).eq("revision_number", 1).maybeSingle());
  if (!initial) throw unavailable();
  return { brand_id: id, initial_revision: revisionDTO(initial) };
}
export async function getBrand(session: ApiSession, id: string, options: ReturnType<typeof historyOptions>) {
  const brand = await brandAccess(session, id);
  const current = brand.current_revision_id ? await revision(session, brand, brand.current_revision_id) : null;
  const approvedRows = await requiredQuery(session.client.from("brand_revisions").select("*").eq("workspace_id", brand.workspace_id).eq("brand_id", id).eq("approval_status", "approved").order("revision_number", { ascending: false }).limit(1));
  const selected = options.selected ? await revision(session, brand, options.selected) : undefined;
  let history;
  if (options.include) {
    let request = session.client.from("brand_revisions").select("id,revision_number,approval_status,approved_at,created_at").eq("workspace_id", brand.workspace_id).eq("brand_id", id).order("revision_number", { ascending: false }).limit(options.limit + 1);
    if (options.before !== undefined) request = request.lt("revision_number", options.before);
    const rows = await requiredQuery(request);
    const items = rows.slice(0, options.limit);
    history = { items, next_cursor: rows.length > options.limit ? Buffer.from(JSON.stringify({ before: items.at(-1)!.revision_number })).toString("base64url") : null };
  }
  // Separate PostgREST reads must not present a mixed version as one snapshot.
  const fresh = await brandAccess(session, id);
  if (fresh.revision !== brand.revision || fresh.current_revision_id !== brand.current_revision_id) throw conflict();
  return { data: { brand: brandDTO(brand), current_revision: current ? revisionDTO(current) : null, approved_revision: approvedRows[0] ? revisionDTO(approvedRows[0]) : null, ...(selected ? { selected_revision: revisionDTO(selected) } : {}), ...(history ? { history } : {}) }, headers: { ETag: etag(id, brand.revision) } };
}
export async function saveProfile(session: ApiSession, id: string, expected: number, patch: ProfilePatch) {
  const brand = await brandAccess(session, id);
  if (brand.archived_at) throw notFound();
  if (brand.revision !== expected) throw conflict();
  if (!brand.current_revision_id) throw unavailable();
  const base = await revision(session, brand, brand.current_revision_id);
  const profile = mergeProfile(base.profile_document, patch);
  const snapshot = await requiredQuery(session.client.rpc("save_brand_profile", { p_brand_id: id, p_expected_revision: expected, p_profile_document: profile }));
  return { data: { brand_id: id, revision_id: snapshot, revision: expected + 1, approval_status: "draft" }, headers: { ETag: etag(id, expected + 1) } };
}
export async function approveProfile(session: ApiSession, id: string, revisionId: string, expected: number) {
  const brand = await brandAccess(session, id, true);
  if (brand.archived_at) throw notFound();
  await revision(session, brand, revisionId); // Same brand AND tenant, not just known UUID.
  if (brand.revision !== expected || brand.current_revision_id !== revisionId) throw conflict();
  const snapshot = await requiredQuery(session.client.rpc("approve_brand_profile", { p_brand_id: id, p_revision_id: revisionId, p_expected_revision: expected }));
  return { data: { brand_id: id, revision_id: snapshot, revision: expected + 1, approval_status: "approved" }, headers: { ETag: etag(id, expected + 1) } };
}
