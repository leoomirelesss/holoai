import type { ProfileDocument } from "@/lib/api/validation";

export type DnaForm = { name: string; website: string; description: string; language: string; colors: string[]; font: string; tone: string; audience: string; competitors: { name: string; website: string }[] };
export type Errors = Record<string, string>;
export type Snapshot = { brandId: string; workspaceId: string; etag: string; version: number; revisionId: string; revisionNumber: number; status: string; form: DnaForm; approved: { number: number; form: DnaForm } | null; history: { id: string; revision_number: number; approval_status: string }[] };
export type Pending = { kind: "save" | "approve"; etag: string; revisionId: string; form: DnaForm };
export type LocalEdit = { version: 1; baseETag: string; form: DnaForm; pending: Pending | null };
export const limits = { name: 160, website: 2048, description: 8000, language: 35, font: 100, tone: 2000, audience: 4000 } as const;
const obj = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const text = (v: unknown) => typeof v === "string" ? v : "";
export const count = (v: string) => [...v].length;
export function fromDocument(value: unknown): DnaForm {
  const doc = obj(value), identity = obj(doc.identity), visual = obj(doc.visual), voice = obj(doc.voice);
  return { name: text(identity.name), website: text(identity.website_url), description: text(identity.description), language: text(identity.language), colors: Array.isArray(visual.colors) ? visual.colors.map(text) : [], font: text(visual.font_family), tone: text(voice.tone), audience: text(voice.audience), competitors: Array.isArray(doc.competitors) ? doc.competitors.map(c => ({ name: text(obj(c).name), website: text(obj(c).website_url) })) : [] };
}
export function documentFor(form: DnaForm): ProfileDocument {
  const nullable = (v: string) => v === "" ? null : v;
  return { schema_version: 1, identity: { name: nullable(form.name), website_url: nullable(form.website), description: nullable(form.description), language: nullable(form.language) }, visual: { colors: form.colors, font_family: nullable(form.font) }, voice: { tone: nullable(form.tone), audience: nullable(form.audience) }, competitors: form.competitors.map(c => ({ name: c.name, website_url: nullable(c.website) })) };
}
export const equal = (a: DnaForm, b: DnaForm) => JSON.stringify(documentFor(a)) === JSON.stringify(documentFor(b));
function validWebsite(v: string) {
  if (v === "") return true;
  try { const u = new URL(v); return v.length <= 2048 && !/\s/.test(v) && u.protocol === "https:" && Boolean(u.hostname) && !u.username && !u.password; } catch { return false; }
}
export function validate(form: DnaForm, approving = false): Errors {
  const errors: Errors = {};
  for (const [field, max] of Object.entries(limits)) {
    const value = form[field as keyof typeof limits];
    if (!value.isWellFormed() || value.includes("\0")) errors[field] = "Contiene caracteres no admitidos.";
    else if (count(value) > max) errors[field] = `Usa como máximo ${max} caracteres.`;
  }
  if (!validWebsite(form.website)) errors.website = "Usa una URL HTTPS completa sin espacios ni datos de acceso, o deja el campo vacío.";
  if (form.colors.length > 12) errors.colors = "El máximo es 12 colores.";
  form.colors.forEach((c, i) => { if (!/^#[a-f0-9]{6}$/i.test(c)) errors[`color-${i}`] = "Usa seis dígitos HEX con #. Por ejemplo: #2463A0."; });
  if (form.competitors.length > 20) errors.competitors = "El máximo es 20 competidores.";
  form.competitors.forEach((c, i) => {
    if (!c.name.trim() || count(c.name.trim()) > 160 || !c.name.isWellFormed() || c.name.includes("\0")) errors[`competitor-${i}-name`] = "Escribe un nombre válido de hasta 160 caracteres.";
    if (!validWebsite(c.website) || !c.website.isWellFormed() || c.website.includes("\0")) errors[`competitor-${i}-website`] = "Usa una URL HTTPS válida de hasta 2048 caracteres, o deja el campo vacío.";
  });
  if (approving) for (const field of ["name", "description", "language", "tone", "audience"] as const) if (!form[field].trim()) errors[field] = "Completa este campo para aprobar el perfil.";
  if (new TextEncoder().encode(JSON.stringify(documentFor(form))).length > 65536) errors.document = "El perfil supera los 64 KiB admitidos. Reduce su contenido.";
  return errors;
}
export function decodeSnapshot(data: unknown, etag: string | null, brandId: string): Snapshot {
  const d = obj(data), b = obj(d.brand), r = obj(d.current_revision), a = obj(d.approved_revision);
  if (b.id !== brandId || !Number.isSafeInteger(b.revision) || !etag || etag !== `"brand-${brandId}-v${b.revision}"` || typeof b.workspace_id !== "string" || typeof r.id !== "string" || obj(r.profile_document).schema_version !== 1 || !Number.isSafeInteger(r.revision_number) || b.archived_at !== null) throw new Error("Unavailable profile");
  return { brandId, workspaceId: b.workspace_id, etag, version: Number(b.revision), revisionId: r.id, revisionNumber: Number(r.revision_number), status: text(r.approval_status), form: fromDocument(r.profile_document), approved: a.id ? { number: Number(a.revision_number), form: fromDocument(a.profile_document) } : null, history: Array.isArray(obj(d.history).items) ? obj(d.history).items as Snapshot["history"] : [] };
}
export function parseLocal(raw: string | null): LocalEdit | null {
  if (raw === null) return null;
  if (raw.length > 200000) throw new Error("Invalid recovery data");
  const v = obj(JSON.parse(raw));
  const isForm = (f: unknown): f is DnaForm => {
    const x = obj(f);
    return Object.keys(limits).every(k => typeof x[k] === "string") && Array.isArray(x.colors) && x.colors.every(c => typeof c === "string") && Array.isArray(x.competitors) && x.competitors.every(c => typeof obj(c).name === "string" && typeof obj(c).website === "string");
  };
  if (v.version !== 1 || typeof v.baseETag !== "string" || !isForm(v.form)) throw new Error("Invalid recovery data");
  const pending = v.pending === null ? null : obj(v.pending);
  if (pending && (!["save", "approve"].includes(String(pending.kind)) || typeof pending.etag !== "string" || typeof pending.revisionId !== "string" || !isForm(pending.form))) throw new Error("Invalid recovery data");
  return v as LocalEdit;
}
export function reconcile(pending: Pending, current: Snapshot): "confirmed" | "retry" | "conflict" {
  if (pending.kind === "approve" && current.revisionId === pending.revisionId && current.status === "approved") return "confirmed";
  if (pending.kind === "save" && current.etag !== pending.etag && equal(current.form, pending.form)) return "confirmed";
  return current.etag === pending.etag ? "retry" : "conflict";
}
