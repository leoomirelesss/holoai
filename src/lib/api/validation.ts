import { ApiError, conflict, invalid } from "./errors";

export type ProfileDocument = {
  schema_version: 1;
  identity?: { name?: string | null; website_url?: string | null; description?: string | null; language?: string | null };
  visual?: { colors?: string[]; font_family?: string | null };
  voice?: { tone?: string | null; audience?: string | null };
  competitors?: { name: string; website_url?: string | null }[];
};
export type ProfilePatch = Omit<ProfileDocument, "schema_version"> & { schema_version?: 1 };
export function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw invalid();
  return value as Record<string, unknown>;
}
export function only(value: Record<string, unknown>, keys: readonly string[]) {
  if (Object.keys(value).some((key) => !keys.includes(key))) throw invalid();
}
export function name(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || [...value.trim()].length > 160) throw invalid();
  return value.trim();
}
export function uuid(value: unknown): string {
  if (typeof value !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) throw invalid();
  return value.toLowerCase();
}
export function website(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > 2048 || /\s/.test(value)) throw invalid();
  let url;
  try { url = new URL(value); } catch { throw invalid(); }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) throw invalid();
  return value;
}
export function idempotency(value: string | null): string {
  if (!value || !/^[A-Za-z0-9._:-]{1,128}$/.test(value)) throw new ApiError(422, "IDEMPOTENCY_KEY_REQUIRED", "Envía una Idempotency-Key válida de hasta 128 caracteres.");
  return value;
}
export function etag(id: string, revision: number): string { return `"brand-${id}-v${revision}"`; }
export function expectedRevision(value: string | null, brand: string): number {
  if (value === null) throw new ApiError(428, "PRECONDITION_REQUIRED", "Envía el ETag de la marca en If-Match.");
  const parsed = /^"brand-([a-f0-9-]{36})-v([1-9][0-9]*)"$/.exec(value);
  if (!parsed) throw invalid();
  if (parsed[1] !== brand) throw conflict();
  const revision = Number(parsed[2]);
  if (!Number.isSafeInteger(revision)) throw invalid();
  return revision;
}
const limits: Record<string, Record<string, number>> = {
  identity: { name: 160, website_url: 2048, description: 8000, language: 35 },
  visual: { font_family: 100 }, voice: { tone: 2000, audience: 4000 },
};
export function profilePatch(value: unknown): ProfilePatch {
  const doc = object(value);
  only(doc, ["schema_version", "identity", "visual", "voice", "competitors"]);
  if (doc.schema_version !== undefined && doc.schema_version !== 1) throw invalid();
  if (!Object.keys(doc).some((key) => key !== "schema_version")) throw invalid();
  for (const section of ["identity", "visual", "voice"] as const) {
    if (doc[section] === undefined) continue;
    const fields = object(doc[section]);
    const allowed = limits[section]!;
    only(fields, [...Object.keys(allowed), ...(section === "visual" ? ["colors"] : [])]);
    for (const [field, content] of Object.entries(fields)) {
      if (field === "colors") {
        if (!Array.isArray(content) || content.length > 12 || content.some((color) => typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color))) throw invalid();
      } else if (content !== null) {
        if (typeof content !== "string" || [...content].length > allowed[field]!) throw invalid();
        if (field === "website_url") website(content);
      }
    }
  }
  if (doc.competitors !== undefined) {
    if (!Array.isArray(doc.competitors) || doc.competitors.length > 20) throw invalid();
    for (const entry of doc.competitors) {
      const item = object(entry); only(item, ["name", "website_url"]); name(item.name);
      if (item.website_url !== undefined) website(item.website_url);
    }
  }
  if (new TextEncoder().encode(JSON.stringify(doc)).byteLength > 65536) throw invalid();
  return doc as ProfilePatch;
}
export function mergeProfile(base: unknown, patch: ProfilePatch): ProfileDocument {
  const doc = object(base);
  if (doc.schema_version !== 1) throw new ApiError(503, "PROFILE_UNAVAILABLE", "El perfil no está disponible.");
  const result = { ...doc, ...patch, schema_version: 1 } as ProfileDocument;
  for (const section of ["identity", "visual", "voice"] as const) {
    if (patch[section] !== undefined) {
      result[section] = { ...object(doc[section] ?? {}), ...patch[section] };
    }
  }
  profilePatch(result);
  return result;
}
export function historyOptions(url: URL) {
  const params = url.searchParams;
  for (const key of params.keys()) if (!["history", "limit", "cursor", "revision_id"].includes(key) || params.getAll(key).length !== 1) throw invalid();
  const history = params.get("history");
  if (history !== null && history !== "1") throw invalid();
  if (history !== "1" && (params.has("limit") || params.has("cursor"))) throw invalid();
  const limitText = params.get("limit") ?? "20";
  if (!/^[1-9][0-9]?$/.test(limitText) || Number(limitText) > 50) throw invalid();
  let before: number | undefined;
  if (params.has("cursor")) {
    const raw = params.get("cursor")!;
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(raw)) throw invalid();
    try {
      const cursor = object(JSON.parse(Buffer.from(raw, "base64url").toString("utf8")));
      only(cursor, ["before"]);
      if (!Number.isSafeInteger(cursor.before) || Number(cursor.before) <= 0) throw invalid();
      before = Number(cursor.before);
    } catch { throw invalid(); }
  }
  return { include: history === "1", limit: Number(limitText), before, selected: params.has("revision_id") ? uuid(params.get("revision_id")) : undefined };
}
