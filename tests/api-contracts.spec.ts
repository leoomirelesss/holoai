import { test, expect } from "@playwright/test";
import { ApiError, databaseError, query, requiredQuery } from "../src/lib/api/errors";
import { etag, expectedRevision, historyOptions, idempotency, mergeProfile, name, object, only, profilePatch, uuid, website } from "../src/lib/api/validation";
const id = "11111111-1111-4111-8111-111111111111";
function fails(run: () => unknown, status: number) {
  try { run(); } catch (error) { expect(error).toBeInstanceOf(ApiError); expect((error as ApiError).status).toBe(status); return; }
  throw new Error("Expected contract rejection");
}
test("ETags bind a positive safe version to one brand", () => {
  expect(expectedRevision(etag(id, 3), id)).toBe(3);
  fails(() => expectedRevision(null, id), 428);
  for (const tag of ["*", 'W/"1"', '"1"', etag(id, 0), etag(id, Number.MAX_SAFE_INTEGER + 1)]) fails(() => expectedRevision(tag, id), 422);
  fails(() => expectedRevision(etag("22222222-2222-4222-8222-222222222222", 3), id), 409);
});
test("bootstrap accepts bounded opaque keys and canonical nonempty names", () => {
  expect(idempotency("request-001:retry")).toBe("request-001:retry");
  for (const key of [null, "", "x".repeat(129), "contains spaces"]) fails(() => idempotency(key), 422);
  expect(name("  Empresa  ")).toBe("Empresa");
  expect(name("😀".repeat(160))).toHaveLength(320);
  for (const value of [null, " ", "x".repeat(161)]) fails(() => name(value), 422);
});
test("UUID and HTTPS validation does not accept context or credentials", () => {
  expect(uuid(id.toUpperCase())).toBe(id);
  expect(website(null)).toBeNull(); expect(website("https://example.com/item")).toBe("https://example.com/item");
  for (const value of ["bad", "http://example.com", "https://user:password@example.com", "https://example.com/has space", 12]) fails(() => website(value), 422);
  fails(() => uuid("not-a-uuid"), 422);
  fails(() => only(object({ name: "A", owner_user_id: id }), ["name"]), 422);
});
test("PATCH merges nested editable fields and retains previous snapshot", () => {
  const base = { schema_version: 1, identity: { name: "A", description: "D", language: "es" }, voice: { tone: "T", audience: "A" }, competitors: [{ name: "C" }] };
  const before = JSON.stringify(base);
  const merged = mergeProfile(base, profilePatch({ identity: { description: "Changed" }, voice: { tone: null }, competitors: [] }));
  expect(merged.identity).toEqual({ name: "A", description: "Changed", language: "es" });
  expect(merged.voice).toEqual({ tone: null, audience: "A" }); expect(merged.competitors).toEqual([]);
  expect(JSON.stringify(base)).toBe(before);
});
for (const [label, value] of [
  ["empty", {}], ["unknown", { actor: id }], ["schema", { schema_version: 2, identity: {} }],
  ["section", { voice: null }], ["actor", { identity: { created_by: id } }],
  ["color", { visual: { colors: ["red"] } }], ["null colors", { visual: { colors: null } }],
  ["description", { identity: { description: "x".repeat(8001) } }],
  ["audience type", { voice: { audience: 42 } }],
  ["competitor", { competitors: [{ name: "" }] }],
  ["prototype", JSON.parse('{"identity":{"__proto__":{}}}') as unknown],
] as const) test(`profile rejects ${label}`, () => fails(() => profilePatch(value), 422));
test("history is bounded, opaque and rejects unexpected tenant selection", () => {
  expect(historyOptions(new URL("http://localhost/?history=1&limit=2"))).toMatchObject({ include: true, limit: 2 });
  const cursor = Buffer.from('{"before":3}').toString("base64url");
  expect(historyOptions(new URL(`http://localhost/?history=1&cursor=${cursor}`)).before).toBe(3);
  for (const query of ["workspace_id=x", "limit=1", "history=1&limit=51", "history=1&limit=1&limit=2", "history=1&cursor=bad", "history=yes"]) fails(() => historyOptions(new URL(`http://localhost/?${query}`)), 422);
});
for (const [code, status] of [["40001", 409], ["23505", 409], ["22023", 422], ["23514", 422], ["42501", 404], ["PGRST301", 401], ["PGRST202", 503], ["08006", 503], ["unrecognized", 503]] as const) {
  test(`safe database translation ${code} to ${status}`, () => {
    const error = databaseError({ code }); expect(error.status).toBe(status);
    expect(error.message).not.toContain(code);
  });
}
test("dependency failure becomes 503 and nullable resources remain distinguishable", async () => {
  await expect(query(Promise.reject(new Error("private provider detail")))).rejects.toMatchObject({ status: 503 });
  expect(await query(Promise.resolve({ data: null, error: null }))).toBeNull();
  await expect(requiredQuery(Promise.resolve({ data: null, error: null }))).rejects.toMatchObject({ status: 503 });
});
