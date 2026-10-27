import "server-only";
import type { ApiSession } from "@/lib/api/session";
import { ApiError, notFound, query, requiredQuery, unavailable } from "@/lib/api/errors";
import type { WorkspaceRow, MembershipRow } from "@/lib/data/database.types";

export function workspaceDTO(workspace: WorkspaceRow, membership: MembershipRow) {
  return { id: workspace.id, name: workspace.name, status: workspace.status, revision: workspace.revision, role: membership.role, created_at: workspace.created_at, updated_at: workspace.updated_at };
}
export async function workspaceAccess(session: ApiSession, id: string, owner = false) {
  const { client, user } = session;
  const workspace = await query(client.from("workspaces").select("*").eq("id", id).eq("status", "active").maybeSingle());
  if (!workspace) throw notFound();
  const membership = await query(client.from("memberships").select("*").eq("workspace_id", id).eq("user_id", user.id).eq("status", "active").maybeSingle());
  if (!membership) throw notFound();
  if (owner && (membership.role !== "owner" || workspace.owner_user_id !== user.id)) throw new ApiError(403, "OWNER_REQUIRED", "Solo el propietario puede realizar esta acción.");
  return { workspace, membership };
}
export async function bootstrapWorkspace(session: ApiSession, name: string, key: string) {
  let id: string;
  try { id = await requiredQuery(session.client.rpc("bootstrap_workspace", { p_name: name, p_bootstrap_key: key })); }
  catch (error) {
    if (error instanceof ApiError && error.status === 409) throw new ApiError(409, "BOOTSTRAP_CONFLICT", "El alta entra en conflicto. Reutiliza la misma clave y datos o consulta tu workspace actual.");
    throw error;
  }
  if (typeof id !== "string") throw unavailable();
  const { workspace, membership } = await workspaceAccess(session, id);
  return workspaceDTO(workspace, membership);
}
export async function currentWorkspace(session: ApiSession) {
  // V1's canonical context is the caller's active owned workspace, never metadata.
  const owned = await query(session.client.from("workspaces").select("*").eq("owner_user_id", session.user.id).eq("status", "active").maybeSingle());
  if (owned) {
    const access = await workspaceAccess(session, owned.id);
    return workspaceDTO(access.workspace, access.membership);
  }
  const memberships = await requiredQuery(session.client.from("memberships").select("*").eq("user_id", session.user.id).eq("status", "active").limit(51));
  if (memberships.length === 0) return null;
  if (memberships.length > 50) throw new ApiError(409, "WORKSPACE_CONTEXT_REQUIRED", "No se puede resolver un único workspace activo.");
  const workspaces = await requiredQuery(session.client.from("workspaces").select("*").in("id", memberships.map((row) => row.workspace_id)).eq("status", "active").limit(2));
  if (workspaces.length === 0) return null;
  if (workspaces.length !== 1) throw new ApiError(409, "WORKSPACE_CONTEXT_REQUIRED", "No se puede resolver un único workspace activo.");
  const access = await workspaceAccess(session, workspaces[0]!.id);
  return workspaceDTO(access.workspace, access.membership);
}
