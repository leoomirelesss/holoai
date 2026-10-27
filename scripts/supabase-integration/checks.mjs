import { Agent, request } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";

// Deliberately no assertions that serialize HTTP bodies, headers or Auth errors.
export async function integrationChecks(stack, connection, record) {
  const endpoint = new URL(connection.url);
  if (endpoint.origin !== "http://127.0.0.1:55321") throw new Error("Local endpoint required");
  const localAgent = new Agent({ keepAlive: true, proxyEnv: {} });
  async function api(path, { token, method = "GET", body, key = true, headers = {} } = {}) {
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) throw new Error("Invalid local path");
    return new Promise((resolve, reject) => {
      const data = body === undefined ? undefined : JSON.stringify(body);
      const outgoing = { "content-type": "application/json", ...headers };
      if (key) outgoing.apikey = connection.key;
      if (token) outgoing.authorization = `Bearer ${token}`;
      const target = new URL(path, endpoint);
      if (target.origin !== endpoint.origin) throw new Error("Non-local request refused");
      const req = request(target, { method, agent: localAgent, headers: outgoing, timeout: 20000 }, (res) => {
        let buffer = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { if (buffer.length < 1e6) buffer += chunk; });
        res.on("end", () => {
          let value = null;
          try { value = buffer ? JSON.parse(buffer) : null; } catch { /* no raw response in errors */ }
          resolve({ status: res.statusCode, value });
        });
      });
      req.on("timeout", () => req.destroy());
      req.on("error", () => reject(new Error("Local API request failed")));
      req.end(data);
    });
  }
  const ok = (label, result) => { record(label, Boolean(result)); };
  const success = (res) => res.status >= 200 && res.status < 300;
  const denied = (res) => [401, 403].includes(res.status) && res.value?.code === "42501";
  const uuid = (value) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
  const rpc = (token, name, body) => api(`/rest/v1/rpc/${name}`, { token, method: "POST", body });
  const read = (token, table, query = "") => api(`/rest/v1/${table}?select=*${query}`, { token });
  const one = async (token, table, id) => {
    const res = await read(token, table, `&id=eq.${id}`);
    if (!success(res) || res.value?.length !== 1) throw new Error("Local row read failed");
    return res.value[0];
  };
  const password = `Local!9a${randomBytes(24).toString("base64url")}`;
  const accounts = [0, 1].map((index) => ({ email: `linde-local-${randomUUID()}-${index}@example.invalid`, password }));
  const users = [];
  for (const [index, account] of accounts.entries()) {
    const signup = await api("/auth/v1/signup", { method: "POST", body: account });
    ok(`local-auth-signup-${index + 1}`, success(signup) && uuid(signup.value?.user?.id));
    const login = await api("/auth/v1/token?grant_type=password", { method: "POST", body: account });
    ok(`local-password-login-${index + 1}`, success(login) && Boolean(login.value?.access_token) && Boolean(login.value?.refresh_token));
    const token = login.value.access_token;
    const verified = await api("/auth/v1/user", { token });
    ok(`auth-verified-session-${index + 1}`, success(verified) && verified.value?.id === signup.value.user.id && Boolean(verified.value.email_confirmed_at));
    users.push({ token, id: verified.value.id });
  }
  ok("two-real-local-auth-users", await stack.sql("select count(*) from auth.users;") === "2");
  const [a, b] = users;
  const bootstrapInput = { p_name: "Local workspace A", p_bootstrap_key: randomUUID() };
  const bootstrap = await Promise.all([rpc(a.token, "bootstrap_workspace", bootstrapInput), rpc(a.token, "bootstrap_workspace", bootstrapInput)]);
  ok("concurrent-bootstrap-idempotent", bootstrap.every(success) && uuid(bootstrap[0].value) && bootstrap[0].value === bootstrap[1].value);
  const workspaceA = bootstrap[0].value;
  const memberships = await read(a.token, "memberships");
  const workspaces = await read(a.token, "workspaces");
  ok("atomic-owner-and-workspace", success(memberships) && success(workspaces) && memberships.value.length === 1 && workspaces.value.length === 1 && memberships.value[0].workspace_id === workspaceA && memberships.value[0].user_id === a.id && memberships.value[0].role === "owner" && workspaces.value[0].owner_user_id === a.id);
  ok("server-generated-id-and-times", uuid(workspaces.value[0].id) && Number.isFinite(Date.parse(workspaces.value[0].created_at)) && Number.isFinite(Date.parse(workspaces.value[0].updated_at)));
  const conflicting = await rpc(a.token, "bootstrap_workspace", { ...bootstrapInput, p_name: "Changed" });
  ok("bootstrap-payload-conflict", !success(conflicting) && conflicting.value?.code === "40001");

  // Inject a local-only failure through the isolated DB admin connection. All
  // user operations around it still use real Auth JWTs through PostgREST.
  await stack.sql(`create function linde_private.test_fail_owner() returns trigger language plpgsql as $$ begin raise exception using errcode='23514',message='Local atomicity test'; end; $$; create trigger test_fail_owner before insert on public.memberships for each row when (new.user_id='${b.id}'::uuid) execute function linde_private.test_fail_owner();`);
  try {
    const failed = await rpc(b.token, "bootstrap_workspace", { p_name: "Local workspace B", p_bootstrap_key: "failure" });
    ok("bootstrap-failure-injected", !success(failed) && failed.value?.code === "23514");
    ok("bootstrap-failure-rolls-back-both-rows", await stack.sql(`select (select count(*) from public.workspaces where owner_user_id='${b.id}')::text || ',' || (select count(*) from public.memberships where user_id='${b.id}')::text;`) === "0,0");
  } finally {
    await stack.sql("drop trigger test_fail_owner on public.memberships; drop function linde_private.test_fail_owner();");
  }
  const bootB = await rpc(b.token, "bootstrap_workspace", { p_name: "Local workspace B", p_bootstrap_key: randomUUID() });
  ok("second-user-own-workspace", success(bootB) && uuid(bootB.value) && bootB.value !== workspaceA);
  const workspaceB = bootB.value;
  // User-editable metadata must never become authorization data. Obtain a fresh
  // signed JWT after updating it, so the test is not using a stale token.
  const metadata = await api("/auth/v1/user", { token: b.token, method: "PUT", body: { data: { role: "owner", workspace_id: workspaceA } } });
  ok("editable-metadata-test-prepared", success(metadata) && metadata.value?.user_metadata?.workspace_id === workspaceA);
  const relogin = await api("/auth/v1/token?grant_type=password", { method: "POST", body: accounts[1] });
  ok("fresh-jwt-with-forged-metadata", success(relogin) && Boolean(relogin.value?.access_token));
  b.token = relogin.value.access_token;

  const brandAResult = await rpc(a.token, "create_brand", { p_workspace_id: workspaceA, p_name: "Local Brand A", p_website_url: "https://example.com" });
  const brandBResult = await rpc(b.token, "create_brand", { p_workspace_id: workspaceB, p_name: "Local Brand B" });
  ok("create-brands-via-rpc", success(brandAResult) && success(brandBResult) && uuid(brandAResult.value) && uuid(brandBResult.value));
  const brandA = brandAResult.value, brandB = brandBResult.value;
  let brand = await one(a.token, "brands", brandA);
  const initial = await one(a.token, "brand_revisions", brand.current_revision_id);
  ok("brand-and-initial-draft-atomic", initial.brand_id === brandA && initial.workspace_id === workspaceA && initial.approval_status === "draft" && initial.created_by === a.id && initial.revision_number === 1 && initial.created_at === initial.updated_at);
  const incomplete = await rpc(a.token, "approve_brand_profile", { p_brand_id: brandA, p_revision_id: initial.id, p_expected_revision: 1 });
  ok("incomplete-dna-approval-rejected", !success(incomplete) && incomplete.value?.code === "22023");
  const document = { schema_version: 1, identity: { name: "Local Brand A edited", description: "Synthetic local brand description", language: "es" }, voice: { tone: "Clear", audience: "Local businesses" }, visual: { colors: ["#123456"], font_family: "Inter" } };
  const saved = await rpc(a.token, "save_brand_profile", { p_brand_id: brandA, p_expected_revision: 1, p_profile_document: document });
  ok("save-dna-via-rpc", success(saved) && uuid(saved.value));
  brand = await one(a.token, "brands", brandA);
  ok("save-updates-version-and-pointer", brand.revision === 2 && brand.current_revision_id === saved.value);
  const approved = await rpc(a.token, "approve_brand_profile", { p_brand_id: brandA, p_revision_id: saved.value, p_expected_revision: 2 });
  ok("approve-dna-via-rpc", success(approved) && approved.value === saved.value);
  const snapshot = await one(a.token, "brand_revisions", saved.value);
  ok("approval-attributed-to-authenticated-owner", snapshot.approval_status === "approved" && snapshot.approved_by === a.id && Boolean(snapshot.approved_at) && snapshot.created_at === snapshot.updated_at);
  const newDraft = await rpc(a.token, "save_brand_profile", { p_brand_id: brandA, p_expected_revision: 3, p_profile_document: { ...document, identity: { ...document.identity, description: "New draft" } } });
  ok("approved-edit-creates-new-draft", success(newDraft) && uuid(newDraft.value) && newDraft.value !== saved.value);
  const current = await one(a.token, "brand_revisions", newDraft.value);
  ok("new-draft-not-implicitly-approved", current.approval_status === "draft" && current.approved_by === null && current.approved_at === null);
  ok("approved-revision-preserved-exactly", JSON.stringify(await one(a.token, "brand_revisions", saved.value)) === JSON.stringify(snapshot));
  const history = await read(a.token, "brand_revisions", `&brand_id=eq.${brandA}&order=revision_number`);
  ok("three-revisions-retained", success(history) && JSON.stringify(history.value.map((row) => row.revision_number)) === "[1,2,3]");

  for (const [who, own, foreign] of [[a, workspaceA, workspaceB], [b, workspaceB, workspaceA]]) {
    for (const table of ["workspaces", "memberships", "brands", "brand_revisions"]) {
      const field = table === "workspaces" ? "id" : "workspace_id";
      const invisible = await read(who.token, table, `&${field}=eq.${foreign}`);
      ok(`rls-${who === a ? "a" : "b"}-cannot-read-foreign-${table}`, success(invisible) && Array.isArray(invisible.value) && invisible.value.length === 0);
      const visible = await read(who.token, table, `&${field}=eq.${own}`);
      ok(`rls-${who === a ? "a" : "b"}-reads-own-${table}`, success(visible) && visible.value.length >= 1);
    }
  }
  const foreignCalls = [
    ["create_brand", { p_workspace_id: workspaceA, p_name: "Unauthorized" }],
    ["save_brand_profile", { p_brand_id: brandA, p_expected_revision: 4, p_profile_document: document }],
    ["approve_brand_profile", { p_brand_id: brandA, p_revision_id: newDraft.value, p_expected_revision: 4 }],
  ];
  for (const [name, body] of foreignCalls) ok(`foreign-rpc-denied-${name}`, denied(await rpc(b.token, name, body)));
  for (const table of ["workspaces", "memberships", "brands", "brand_revisions"]) {
    const anonymous = await read(connection.key, table);
    ok(`anonymous-denied-${table}`, denied(anonymous));
  }
  ok("missing-api-key-denied", (await api("/rest/v1/workspaces", { key: false })).status === 401);
  for (const [name, body] of [["bootstrap_workspace", { p_name: "No", p_bootstrap_key: "anon" }], ...foreignCalls]) ok(`anonymous-rpc-denied-${name}`, denied(await rpc(connection.key, name, body)));

  const directInserts = {
    workspaces: { owner_user_id: b.id, name: "No", bootstrap_key: "direct", request_hash: "a".repeat(64) },
    memberships: { workspace_id: workspaceA, user_id: b.id, role: "owner" },
    brands: { workspace_id: workspaceA, name: "No" },
    brand_revisions: { workspace_id: workspaceA, brand_id: brandA, revision_number: 999, profile_document: document, created_by: b.id },
  };
  for (const [table, body] of Object.entries(directInserts)) {
    ok(`direct-insert-denied-${table}`, denied(await api(`/rest/v1/${table}`, { token: b.token, method: "POST", body })));
    const field = table === "workspaces" ? "id" : "workspace_id";
    const patch = table === "memberships" ? { role: "owner", user_id: b.id } : table === "brand_revisions" ? { profile_document: document } : { name: "Unauthorized edit" };
    ok(`direct-update-denied-${table}`, denied(await api(`/rest/v1/${table}?${field}=eq.${workspaceA}`, { token: b.token, method: "PATCH", body: patch })));
    ok(`direct-delete-denied-${table}`, denied(await api(`/rest/v1/${table}?${field}=eq.${workspaceA}`, { token: b.token, method: "DELETE" })));
  }
  const privateRPC = await rpc(a.token, "lock_workspace", { target: workspaceA, owner_only: true });
  ok("internal-function-not-exposed", privateRPC.status === 404);
  const privateSchema = await api("/rest/v1/rpc/lock_workspace", { token: a.token, method: "POST", headers: { "content-profile": "linde_private" }, body: { target: workspaceA, owner_only: true } });
  ok("internal-schema-not-exposed", privateSchema.status === 406);
  const pieces = a.token.split(".");
  pieces[2] = (pieces[2][0] === "A" ? "B" : "A") + pieces[2].slice(1);
  ok("forged-jwt-signature-rejected", (await read(pieces.join("."), "workspaces")).status === 401);

  // Explicit local admin fixture: test Architect's member-vs-owner behavior,
  // then revoke it while keeping the same real JWT on the client.
  await stack.sql(`insert into public.memberships(workspace_id,user_id,role) values('${workspaceB}','${a.id}','member');`);
  ok("explicit-member-can-read", (await read(a.token, "brands", `&id=eq.${brandB}`)).value?.length === 1);
  ok("member-cannot-create-brand", denied(await rpc(a.token, "create_brand", { p_workspace_id: workspaceB, p_name: "No" })));
  const memberDraft = await rpc(a.token, "save_brand_profile", { p_brand_id: brandB, p_expected_revision: 1, p_profile_document: document });
  ok("member-can-save-draft", success(memberDraft) && uuid(memberDraft.value));
  ok("member-cannot-approve", denied(await rpc(a.token, "approve_brand_profile", { p_brand_id: brandB, p_revision_id: memberDraft.value, p_expected_revision: 2 })));
  ok("actual-owner-can-approve-member-draft", success(await rpc(b.token, "approve_brand_profile", { p_brand_id: brandB, p_revision_id: memberDraft.value, p_expected_revision: 2 })));
  await stack.sql(`update public.memberships set status='revoked' where workspace_id='${workspaceB}' and user_id='${a.id}';`);
  ok("revocation-blocks-read-with-same-jwt", (await read(a.token, "brands", `&id=eq.${brandB}`)).value?.length === 0);
  ok("revocation-blocks-write-with-same-jwt", denied(await rpc(a.token, "save_brand_profile", { p_brand_id: brandB, p_expected_revision: 3, p_profile_document: document })));

  const parallel = await Promise.all([0, 1].map(() => rpc(a.token, "save_brand_profile", { p_brand_id: brandA, p_expected_revision: 4, p_profile_document: document })));
  ok("concurrent-save-exactly-one-success", parallel.filter(success).length === 1);
  ok("concurrent-save-stale-write-rejected", parallel.filter((res) => !success(res) && res.value?.code === "40001").length === 1);
  const final = await one(a.token, "brands", brandA);
  const finalHistory = await read(a.token, "brand_revisions", `&brand_id=eq.${brandA}`);
  ok("concurrent-save-no-duplicates-or-lost-update", final.revision === 5 && finalHistory.value?.length === 4 && final.current_revision_id === parallel.find(success).value);
  ok("approved-history-survives-concurrency", JSON.stringify(await one(a.token, "brand_revisions", saved.value)) === JSON.stringify(snapshot));
  ok("rls-and-grants-on-real-supabase", await stack.sql("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('workspaces','memberships','brands','brand_revisions') and c.relrowsecurity and not has_table_privilege('authenticated',c.oid,'INSERT,UPDATE,DELETE');") === "4");
  return { conflictHttpStatus: parallel.find((res) => !success(res)).status };
}
