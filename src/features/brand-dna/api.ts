import { decodeSnapshot, type Snapshot } from "./model";
export class DnaFailure extends Error {
  constructor(public readonly kind: "session" | "denied" | "conflict" | "validation" | "network" | "unavailable" | "storage" | "busy") { super(kind); }
}
export async function requestDna(path: string, method = "GET", body?: unknown, etag?: string) {
  let res;
  try { res = await fetch(`/api/v1${path}`, { method, credentials: "same-origin", cache: "no-store", redirect: "error", headers: { "Content-Type": "application/json", ...(etag ? { "If-Match": etag } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000) }); }
  catch { throw new DnaFailure("network"); }
  if (!res.ok) throw new DnaFailure(res.status === 401 ? "session" : [403, 404].includes(res.status) ? "denied" : res.status === 409 ? "conflict" : [400, 413, 415, 422, 428].includes(res.status) ? "validation" : "unavailable");
  try { const value = await res.json(); return { data: value.data as unknown, etag: res.headers.get("etag") }; }
  catch { throw new DnaFailure("unavailable"); }
}
export async function loadDna(id: string): Promise<Snapshot> {
  const res = await requestDna(`/brands/${id}?history=1&limit=20`);
  try { return decodeSnapshot(res.data, res.etag, id); } catch { throw new DnaFailure("unavailable"); }
}
