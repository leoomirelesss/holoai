import { Agent, request } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";

export async function apiChecks(stack, origin, connection, record) {
  if (origin !== "http://127.0.0.1:3100" || connection.url !== "http://127.0.0.1:55321") throw new Error("Local endpoints required");
  const agent = new Agent({ keepAlive: true, proxyEnv: {} });
  const check = (label, condition, response) => record(label, Boolean(condition), response?.status);
  async function call(client, path, { method = "GET", body, headers = {}, raw } = {}) {
    const target = new URL(path, origin);
    if (target.origin !== origin || !target.pathname.startsWith("/api/v1/")) throw new Error("Local API only");
    return new Promise((resolve, reject) => {
      const data = raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body);
      const outgoing = { origin, "content-type": "application/json", ...headers };
      if (client?.jar.size) outgoing.cookie = [...client.jar].map(([name, value]) => `${name}=${value}`).join("; ");
      const req = request(target, { method, headers: outgoing, agent, timeout: 35000 }, (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { if (text.length < 2e6) text += chunk; });
        res.on("end", () => {
          for (const line of res.headers["set-cookie"] ?? []) {
            const pair = line.split(";")[0]; const split = pair.indexOf("=");
            if (client) { if (/max-age=0/i.test(line)) client.jar.delete(pair.slice(0, split)); else client.jar.set(pair.slice(0, split), pair.slice(split + 1)); }
          }
          let value;
          try { value = JSON.parse(text); } catch { value = null; }
          resolve({ status: res.statusCode, value, headers: res.headers });
        });
      });
      req.on("error", () => reject(new Error("Local HTTP request failed")));
      req.on("timeout", () => req.destroy()); req.end(data);
    });
  }
  function status(label, response, expected) {
    check(label, response.status === expected && response.headers["content-type"]?.includes("application/json") && response.headers["cache-control"]?.includes("no-store") && Boolean(response.value?.meta?.correlation_id) && (expected < 400 ? Boolean(response.value?.data) : Boolean(response.value?.error?.code)), response);
  }
  const users = [];
  for (let index = 0; index < 2; index++) {
    const jar = new Map();
    const sdk = createServerClient(connection.url, connection.key, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (values) => values.forEach(({ name, value, options }) => { if (options.maxAge === 0) jar.delete(name); else jar.set(name, value); }) } });
    const credentials = { email: `linde-api-${randomUUID()}@example.invalid`, password: `Local!9a${randomBytes(24).toString("base64url")}` };
    const created = await sdk.auth.signUp(credentials);
    check(`api-local-auth-created-${index}`, !created.error && Boolean(created.data.user?.id));
    const logged = await sdk.auth.signInWithPassword(credentials);
    check(`api-local-ssr-session-${index}`, !logged.error && Boolean(logged.data.session?.access_token) && jar.size > 0);
    users.push({ sdk, jar, id: logged.data.user.id, credentials });
  }
  const [a, b] = users;
  const getCurrent = () => call(a, "/api/v1/workspaces/current");
  status("api-unauthenticated-json", await call(null, "/api/v1/workspaces/current"), 401);
  const invalidSession = { jar: new Map([...a.jar].map(([key]) => [key, "base64-e30"])) };
  status("api-invalid-session-json", await call(invalidSession, "/api/v1/workspaces/current"), 401);
  const before = await getCurrent(); status("api-empty-current", before, 200);
  check("api-no-workspace-is-null", before.value.data.workspace === null);
  status("api-missing-origin", await call(a, "/api/v1/workspaces", { method: "POST", headers: { origin: "" }, body: { name: "A" } }), 403);
  status("api-cross-origin", await call(a, "/api/v1/workspaces", { method: "POST", headers: { origin: "https://untrusted.example.invalid" }, body: { name: "A" } }), 403);
  status("api-opaque-origin", await call(a, "/api/v1/workspaces", { method: "POST", headers: { origin: "null" }, body: { name: "A" } }), 403);
  status("api-cross-site-fetch", await call(a, "/api/v1/workspaces", { method: "POST", headers: { "sec-fetch-site": "cross-site" }, body: { name: "A" } }), 403);
  status("api-idempotency-required", await call(a, "/api/v1/workspaces", { method: "POST", body: { name: "A" } }), 422);
  const key = randomUUID();
  const create = { method: "POST", headers: { "idempotency-key": key }, body: { name: "API workspace A" } };
  status("api-invalid-json", await call(a, "/api/v1/workspaces", { ...create, raw: "{" }), 400);
  status("api-content-type", await call(a, "/api/v1/workspaces", { ...create, headers: { ...create.headers, "content-type": "text/plain" } }), 415);
  status("api-array-body", await call(a, "/api/v1/workspaces", { ...create, body: [] }), 422);
  status("api-unknown-privileged-field", await call(a, "/api/v1/workspaces", { ...create, body: { name: "A", owner_user_id: b.id } }), 422);
  status("api-bounded-chunked-payload", await call(a, "/api/v1/workspaces", { ...create, headers: { ...create.headers, "transfer-encoding": "chunked" }, raw: JSON.stringify({ name: "x".repeat(72000) }) }), 413);
  const bootstrap = await Promise.all([call(a, "/api/v1/workspaces", create), call(a, "/api/v1/workspaces", create)]);
  bootstrap.forEach((res, index) => status(`api-bootstrap-${index}`, res, 200));
  const wa = bootstrap[0].value.data.workspace.id;
  check("api-bootstrap-idempotent", wa === bootstrap[1].value.data.workspace.id);
  const retry = await call(a, "/api/v1/workspaces", create); status("api-bootstrap-retry", retry, 200);
  check("api-bootstrap-retry-same-id", retry.value.data.workspace.id === wa);
  status("api-bootstrap-conflicting-payload", await call(a, "/api/v1/workspaces", { ...create, body: { name: "Different" } }), 409);
  const cb = await call(b, "/api/v1/workspaces", { ...create, body: { name: "API workspace B" } }); status("api-bootstrap-second-user", cb, 200);
  const wb = cb.value.data.workspace.id;
  check("api-two-isolated-workspaces", wa !== wb);
  const currentA = await getCurrent(); status("api-current-authorized", currentA, 200);
  check("api-current-is-own", currentA.value.data.workspace.id === wa && currentA.value.data.workspace.role === "owner");
  check("api-workspace-dto-minimal", !("bootstrap_key" in currentA.value.data.workspace) && !("request_hash" in currentA.value.data.workspace) && !("owner_user_id" in currentA.value.data.workspace));
  status("api-client-workspace-selection-rejected", await call(a, `/api/v1/workspaces/current?workspace_id=${wb}`), 422);
  const metadata = await b.sdk.auth.updateUser({ data: { role: "owner", workspace_id: wa } });
  check("api-metadata-escalation-prepared", !metadata.error);
  check("api-fresh-metadata-session", !(await b.sdk.auth.signInWithPassword(b.credentials)).error);
  const currentB = await call(b, "/api/v1/workspaces/current"); status("api-current-after-forged-metadata", currentB, 200);
  check("api-metadata-not-authority", currentB.value.data.workspace.id === wb);
  const makeA = await call(a, `/api/v1/workspaces/${wa}/brands`, { method: "POST", body: { name: "API Brand A", website_url: "https://example.com" } }); status("api-create-brand", makeA, 201);
  const makeB = await call(b, `/api/v1/workspaces/${wb}/brands`, { method: "POST", body: { name: "API Brand B" } }); status("api-create-brand-b", makeB, 201);
  const ba = makeA.value.data.brand_id, bb = makeB.value.data.brand_id;
  check("api-brand-identities-distinct", ba !== bb);
  check("api-real-initial-draft", makeA.value.data.initial_revision.approval_status === "draft" && makeA.value.data.initial_revision.revision_number === 1);
  check("api-relative-resource-location", makeA.headers.location === `/api/v1/brands/${ba}`);
  status("api-no-cross-tenant-create", await call(b, `/api/v1/workspaces/${wa}/brands`, { method: "POST", body: { name: "No" } }), 404);
  status("api-invalid-website", await call(a, `/api/v1/workspaces/${wa}/brands`, { method: "POST", body: { name: "No", website_url: "javascript:alert(1)" } }), 422);
  const path = `/api/v1/brands/${ba}`;
  const initial = await call(a, path); status("api-get-brand", initial, 200);
  const tag1 = initial.headers.etag;
  check("api-version-etag", typeof tag1 === "string" && initial.value.data.brand.revision === 1);
  const foreign = await call(b, path); status("api-no-cross-tenant-read", foreign, 404);
  const missing = await call(b, `/api/v1/brands/${randomUUID()}`); status("api-unknown-brand", missing, 404);
  check("api-no-resource-existence-disclosure", JSON.stringify(foreign.value.error) === JSON.stringify(missing.value.error));
  const patch = (who, tag, profile) => call(who, `${path}/profile`, { method: "PATCH", headers: tag ? { "if-match": tag } : {}, body: { profile_document: profile } });
  const approve = (who, tag, id) => call(who, `${path}/profile/approve`, { method: "POST", headers: { "if-match": tag }, body: { revision_id: id } });
  status("api-if-match-required", await patch(a, null, { identity: { description: "D" } }), 428);
  status("api-if-match-weak-rejected", await patch(a, 'W/"1"', { identity: {} }), 422);
  status("api-incomplete-approval", await approve(a, tag1, initial.value.data.current_revision.id), 422);
  status("api-unknown-profile-field", await patch(a, tag1, { created_by: b.id }), 422);
  const full = { identity: { description: "Description", language: "es" }, voice: { tone: "Clear", audience: "Local businesses" }, visual: { colors: ["#123456"], font_family: "Inter" } };
  const saved = await patch(a, tag1, full); status("api-save-profile", saved, 200);
  check("api-save-version-advanced", saved.value.data.revision === 2 && saved.headers.etag !== tag1);
  status("api-stale-save-conflict-409", await patch(a, tag1, full), 409);
  const afterSave = await call(a, path); status("api-get-saved", afterSave, 200);
  check("api-patch-retains-unmodified-fields", afterSave.value.data.current_revision.profile_document.identity.name === "API Brand A" && afterSave.value.data.current_revision.profile_document.identity.website_url === "https://example.com");
  const approved = await approve(a, saved.headers.etag, saved.value.data.revision_id); status("api-approve", approved, 200);
  check("api-approve-counter", approved.value.data.revision === 3);
  const stateApproved = await call(a, path); status("api-read-approved", stateApproved, 200);
  const approvedSnapshot = stateApproved.value.data.approved_revision;
  check("api-server-approval-time", approvedSnapshot.approval_status === "approved" && Number.isFinite(Date.parse(approvedSnapshot.approved_at)));
  const edited = await patch(a, approved.headers.etag, { identity: { description: "New draft" } }); status("api-edit-approved-creates-draft", edited, 200);
  const stateDraft = await call(a, `${path}?history=1&limit=1`); status("api-history-page", stateDraft, 200);
  check("api-current-draft-and-approved-history", stateDraft.value.data.current_revision.approval_status === "draft" && JSON.stringify(stateDraft.value.data.approved_revision) === JSON.stringify(approvedSnapshot));
  check("api-history-bounded-with-cursor", stateDraft.value.data.history.items.length === 1 && typeof stateDraft.value.data.history.next_cursor === "string");
  const page2 = await call(a, `${path}?history=1&limit=1&cursor=${stateDraft.value.data.history.next_cursor}`); status("api-history-next-page", page2, 200);
  check("api-history-no-duplicates", page2.value.data.history.items[0].id !== stateDraft.value.data.history.items[0].id);
  const selected = await call(a, `${path}?revision_id=${approvedSnapshot.id}`); status("api-selected-history", selected, 200);
  check("api-selected-history-immutable", JSON.stringify(selected.value.data.selected_revision) === JSON.stringify(approvedSnapshot));
  status("api-foreign-revision-hidden", await call(a, `${path}?revision_id=${makeB.value.data.initial_revision.id}`), 404);
  status("api-history-foreign-user-hidden", await call(b, `${path}?history=1`), 404);
  status("api-profile-foreign-user-hidden", await patch(b, edited.headers.etag, full), 404);
  status("api-approval-foreign-user-hidden", await approve(b, edited.headers.etag, edited.value.data.revision_id), 404);
  const another = await call(a, `/api/v1/workspaces/${wa}/brands`, { method: "POST", body: { name: "Other A" } }); status("api-second-brand-for-revision-check", another, 201);
  status("api-revision-must-belong-to-brand", await approve(a, edited.headers.etag, another.value.data.initial_revision.id), 404);
  const parallel = await Promise.all([patch(a, edited.headers.etag, { voice: { tone: "One" } }), patch(a, edited.headers.etag, { voice: { tone: "Two" } })]);
  check("api-concurrent-one-success-one-409", parallel.filter((r) => r.status === 200).length === 1 && parallel.filter((r) => r.status === 409).length === 1);
  const final = await call(a, `${path}?history=1`); status("api-after-concurrent-save", final, 200);
  check("api-no-lost-update-or-duplicate-revision", final.value.data.brand.revision === 5 && final.value.data.history.items.length === 4);
  check("api-approved-snapshot-survives-concurrency", JSON.stringify(final.value.data.approved_revision) === JSON.stringify(approvedSnapshot));
  await stack.sql(`insert into public.memberships(workspace_id,user_id,role) values('${wa}','${b.id}','member');`);
  status("api-explicit-member-reads", await call(b, path), 200);
  status("api-member-cannot-create-brand", await call(b, `/api/v1/workspaces/${wa}/brands`, { method: "POST", body: { name: "No" } }), 403);
  status("api-member-can-save", await patch(b, final.headers.etag, { voice: { tone: "Member edit" } }), 200);
  const memberState = await call(b, path); status("api-member-read-latest", memberState, 200);
  status("api-member-cannot-approve", await approve(b, memberState.headers.etag, memberState.value.data.current_revision.id), 403);
  await stack.sql(`update public.memberships set status='revoked' where workspace_id='${wa}' and user_id='${b.id}';`);
  status("api-revoked-same-jwt-read", await call(b, path), 404);
  status("api-revoked-same-jwt-write", await patch(b, memberState.headers.etag, full), 404);
  const denied = await b.sdk.from("brands").select("id").eq("workspace_id", wa);
  check("api-session-rls-denies-foreign-direct-read", !denied.error && denied.data.length === 0);
  const forbidden = await b.sdk.from("brands").insert({ workspace_id: wa, name: "No" });
  check("api-session-no-direct-table-write", forbidden.error?.code === "42501");
  await stack.sql(`update auth.users set email_confirmed_at=null where id='${a.id}';`);
  try { status("api-user-reverified-not-stale-claims", await getCurrent(), 403); }
  finally { await stack.sql(`update auth.users set email_confirmed_at=statement_timestamp() where id='${a.id}';`); }
  await stack.rest("pause");
  try {
    const outage = await call(a, path); status("api-dependency-outage-503", outage, 503);
    check("api-no-provider-error-leak", outage.value.error.code === "SERVICE_UNAVAILABLE" && !/PGRST|SQLSTATE|supabase|postgres/i.test(JSON.stringify(outage.value)));
  } finally { await stack.rest("unpause"); }
  status("api-recovery-after-outage", await call(a, path), 200);
  check("api-exactly-two-local-auth-users", await stack.sql("select count(*) from auth.users;") === "2");
  agent.destroy();
}
