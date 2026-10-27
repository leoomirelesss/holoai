import { test, expect } from "@playwright/test";
import { newOperation, OnboardingFailure, parseOperation, persistManual, type ApiCall, type ManualOperation } from "../src/features/onboarding/manual-operation";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const brandId = "22222222-2222-4222-8222-222222222222";
const tag = `"brand-${brandId}-v1"`;
function fixture() {
  let op = newOperation("Marca propia", "Descripción aportada por la persona.");
  let description: string | null = null;
  const calls: { path: string; method?: string; headers?: Record<string, string> }[] = [];
  const api: ApiCall = async (path, method, body, headers) => {
    calls.push({ path, method, headers });
    if (path === "/workspaces/current") return { data: { workspace: null }, etag: null };
    if (path === "/workspaces") return { data: { workspace: { id: workspaceId, role: "owner", status: "active" } }, etag: null };
    if (method === "POST") return { data: { brand_id: brandId }, etag: null };
    if (method === "PATCH") { description = op.description; return { data: { revision: 2 }, etag: null }; }
    return { data: { brand: { id: brandId, workspace_id: workspaceId }, current_revision: { profile_document: { identity: { name: op.name, description } } } }, etag: tag };
  };
  return { get op() { return op; }, save: (next: ManualOperation) => { op = next; }, calls, api };
}
test("manual persistence uses the actual workspace envelope and ETag, then confirms a read", async () => {
  const f = fixture(); await persistManual(f.op, f.api, f.save, () => {});
  expect(f.op.stage).toBe("complete");
  expect(f.calls.find(c => c.path === "/workspaces")?.headers?.["Idempotency-Key"]).toBe(f.op.bootstrapKey);
  expect(f.calls.find(c => c.method === "PATCH")?.headers?.["If-Match"]).toBe(tag);
  expect(f.calls.at(-1)?.method).toBeUndefined();
});
test("an existing workspace is used without bootstrap", async () => {
  const f = fixture();
  await persistManual(f.op, async (...args) => args[0] === "/workspaces/current" ? { data: { workspace: { id: workspaceId, role: "owner", status: "active" } }, etag: null } : f.api(...args), f.save, () => {});
  expect(f.calls.some(c => c.path === "/workspaces")).toBe(false);
});
for (const kind of ["network", "unavailable"] as const) {
  test(`unknown brand creation after ${kind} is durable and never repeated`, async () => {
    const f = fixture();
    await expect(persistManual(f.op, async (...args) => { if (args[0].endsWith("/brands")) throw new OnboardingFailure(kind); return f.api(...args); }, f.save, () => {})).rejects.toMatchObject({ kind: "uncertain" });
    expect(f.op.stage).toBe("creating");
    const restored = parseOperation(JSON.stringify(f.op))!;
    const before = f.calls.length;
    await expect(persistManual(restored, f.api, f.save, () => {})).rejects.toMatchObject({ kind: "uncertain" });
    expect(f.calls.length).toBe(before);
  });
}
test("unconfirmed creation cannot be repeated even after an authorization error", async () => {
  const f = fixture(); const key = f.op.bootstrapKey;
  await expect(persistManual(f.op, async (...args) => { if (args[0].endsWith("/brands")) throw new OnboardingFailure("session"); return f.api(...args); }, f.save, () => {})).rejects.toMatchObject({ kind: "uncertain" });
  expect(f.op.stage).toBe("creating"); expect(f.op.bootstrapKey).toBe(key);
});
test("lost workspace response keeps the same idempotency key", async () => {
  const f = fixture(); const key = f.op.bootstrapKey;
  await expect(persistManual(f.op, async (...args) => { if (args[0] === "/workspaces") throw new OnboardingFailure("network"); return f.api(...args); }, f.save, () => {})).rejects.toMatchObject({ kind: "network" });
  await persistManual(f.op, f.api, f.save, () => {});
  expect(f.calls.find(c => c.path === "/workspaces")?.headers?.["Idempotency-Key"]).toBe(key);
});
test("lost PATCH response is reconciled by reading without a second creation or write", async () => {
  const f = fixture();
  await expect(persistManual(f.op, async (...args) => { const result = await f.api(...args); if (args[1] === "PATCH") throw new OnboardingFailure("network"); return result; }, f.save, () => {})).rejects.toMatchObject({ kind: "network" });
  expect(f.op.stage).toBe("saving");
  const before = f.calls.length;
  await persistManual(parseOperation(JSON.stringify(f.op))!, f.api, f.save, () => {});
  expect(f.op.stage).toBe("complete"); expect(f.calls.slice(before).every(c => !c.method)).toBe(true);
});
test("another revision is never silently overwritten after a failed PATCH", async () => {
  const f = fixture();
  await expect(persistManual(f.op, async (...args) => { if (args[1] === "PATCH") throw new OnboardingFailure("conflict"); return f.api(...args); }, f.save, () => {})).rejects.toMatchObject({ kind: "conflict" });
  const before = f.calls.length;
  await expect(persistManual(f.op, async (...args) => ({ ...await f.api(...args), etag: `"brand-${brandId}-v2"` }), f.save, () => {})).rejects.toMatchObject({ kind: "conflict" });
  expect(f.calls.slice(before).every(c => !c.method)).toBe(true);
});
test("no request is sent after the durable stage cannot be saved", async () => {
  const f = fixture();
  await expect(persistManual(f.op, f.api, () => { throw new OnboardingFailure("storage"); }, () => {})).rejects.toMatchObject({ kind: "storage" });
  expect(f.calls.filter(c => c.path.endsWith("/brands"))).toHaveLength(0);
});
test("corrupted recovery records are rejected rather than reset", () => {
  expect(() => parseOperation("{}" )).toThrow(); expect(parseOperation(null)).toBeNull();
});
