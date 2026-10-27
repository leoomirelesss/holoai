/** Browser ledger, never an authorization source. The API rechecks every resource. */
export type ManualOperation = {
  version: 1;
  attempt: string;
  bootstrapKey: string;
  name: string;
  description: string;
  stage: "workspace" | "create" | "creating" | "profile" | "saving" | "complete";
  workspaceId?: string;
  brandId?: string;
  baseETag?: string;
};
export type FailureKind = "network" | "session" | "validation" | "permission" | "conflict" | "unavailable" | "uncertain" | "storage" | "busy";
export class OnboardingFailure extends Error {
  constructor(public readonly kind: FailureKind) { super(kind); }
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function parseOperation(raw: string | null): ManualOperation | null {
  if (raw === null) return null;
  try {
    if (raw.length > 10000) throw new Error();
    const v = object(JSON.parse(raw));
    if (v.version !== 1 || typeof v.attempt !== "string" || !uuid.test(v.attempt) || typeof v.bootstrapKey !== "string" || !uuid.test(v.bootstrapKey) || typeof v.name !== "string" || !v.name.trim() || v.name.length > 120 || typeof v.description !== "string" || !v.description.trim() || v.description.length > 600 || !["workspace", "create", "creating", "profile", "saving", "complete"].includes(String(v.stage))) throw new Error();
    if ([v.workspaceId, v.brandId].some(x => x !== undefined && (typeof x !== "string" || !uuid.test(x)))) throw new Error();
    if (v.stage !== "workspace" && !v.workspaceId) throw new Error();
    if (["profile", "saving", "complete"].includes(String(v.stage)) && !v.brandId) throw new Error();
    if (v.baseETag !== undefined && (typeof v.baseETag !== "string" || !/^"brand-[0-9a-f-]{36}-v[1-9][0-9]*"$/i.test(v.baseETag))) throw new Error();
    if (v.stage === "saving" && !v.baseETag) throw new Error();
    return v as ManualOperation;
  } catch { throw new OnboardingFailure("storage"); }
}
export function newOperation(name: string, description: string): ManualOperation {
  return { version: 1, attempt: crypto.randomUUID(), bootstrapKey: crypto.randomUUID(), name, description, stage: "workspace" };
}
export type ApiResult = { data: Record<string, unknown>; etag: string | null };
export type ApiCall = (path: string, method?: "GET" | "POST" | "PATCH", body?: unknown, headers?: Record<string, string>) => Promise<ApiResult>;
export const callOnboardingApi: ApiCall = async (path, method = "GET", body, headers) => {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, { method, credentials: "same-origin", cache: "no-store", redirect: "error", headers: { "Content-Type": "application/json", ...headers }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  } catch { throw new OnboardingFailure("network"); }
  if (!response.ok) {
    const kind = response.status === 401 ? "session" : response.status === 409 ? "conflict" : [403, 404].includes(response.status) ? "permission" : [400, 413, 415, 422, 428].includes(response.status) ? "validation" : "unavailable";
    throw new OnboardingFailure(kind);
  }
  try {
    const value = object(await response.json());
    if (!value.data || typeof value.data !== "object") throw new Error();
    return { data: object(value.data), etag: response.headers.get("etag") };
  } catch { throw new OnboardingFailure("unavailable"); }
};
function id(value: unknown): string {
  if (typeof value !== "string" || !uuid.test(value)) throw new OnboardingFailure("unavailable");
  return value;
}
/** No automatic retries. The caller serializes tabs and writes each stage BEFORE its effect. */
export async function persistManual(operation: ManualOperation, api: ApiCall, save: (value: ManualOperation) => void, progress: (label: string) => void) {
  let op = operation;
  const commit = (patch: Partial<ManualOperation>) => { op = { ...op, ...patch }; save(op); };
  if (op.stage === "creating") throw new OnboardingFailure("uncertain");
  if (op.stage === "complete") {
    progress("Comprobando los datos guardados…");
  } else if (!op.brandId) {
    progress("Comprobando tu espacio de trabajo…");
    const current = await api("/workspaces/current");
    let workspace = object(current.data.workspace);
    if (current.data.workspace === null) {
      if (op.workspaceId) throw new OnboardingFailure("permission");
      progress("Creando tu espacio de trabajo…");
      workspace = object((await api("/workspaces", "POST", { name: `Espacio de ${op.name}` }, { "Idempotency-Key": op.bootstrapKey })).data.workspace);
    }
    const workspaceId = id(workspace.id);
    if (workspace.role !== "owner" || workspace.status !== "active" || (op.workspaceId && op.workspaceId !== workspaceId)) throw new OnboardingFailure("permission");
    commit({ workspaceId, stage: "create" });
    progress("Creando tu marca…");
    commit({ stage: "creating" });
    let created: ApiResult;
    try { created = await api(`/workspaces/${workspaceId}/brands`, "POST", { name: op.name }); }
    catch {
      // Even a 4xx can follow a committed RPC if its subsequent read lost authorization.
      // Without a replay/query contract, no unconfirmed POST is safe to repeat here.
      throw new OnboardingFailure("uncertain");
    }
    let brandId;
    try { brandId = id(created.data.brand_id); } catch { throw new OnboardingFailure("uncertain"); }
    commit({ brandId, stage: "profile" });
  }
  if (!op.brandId) throw new OnboardingFailure("uncertain");
  progress("Comprobando la revisión de tu marca…");
  const read = await api(`/brands/${op.brandId}`);
  const brand = object(read.data.brand);
  const profile = object(object(read.data.current_revision).profile_document);
  const identity = object(profile.identity);
  if (brand.id !== op.brandId || brand.workspace_id !== op.workspaceId) throw new OnboardingFailure("permission");
  if (identity.description === op.description && identity.name === op.name) { commit({ stage: "complete" }); return; }
  if (op.stage === "complete" || (op.baseETag && read.etag !== op.baseETag)) throw new OnboardingFailure("conflict");
  if (!read.etag || !new RegExp(`^"brand-${op.brandId}-v[1-9][0-9]*"$`).test(read.etag)) throw new OnboardingFailure("unavailable");
  progress("Guardando la descripción…");
  commit({ stage: "saving", baseETag: read.etag });
  await api(`/brands/${op.brandId}/profile`, "PATCH", { profile_document: { identity: { description: op.description } } }, { "If-Match": read.etag });
  // Confirm through a read, including after a response lost on a previous attempt.
  const confirmed = await api(`/brands/${op.brandId}`);
  const finalBrand = object(confirmed.data.brand);
  const finalIdentity = object(object(object(confirmed.data.current_revision).profile_document).identity);
  if (finalBrand.id !== op.brandId || finalBrand.workspace_id !== op.workspaceId || finalIdentity.description !== op.description || finalIdentity.name !== op.name) throw new OnboardingFailure("conflict");
  commit({ stage: "complete" });
}
