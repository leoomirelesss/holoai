import { spawn, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

// No database URL, Supabase keys, host ports or remote CLI commands are accepted.
// Pinned local test engine; this does not claim to match the remote DB version.
const image = "postgres:17.6-bookworm@sha256:f3bd19c606e442c3d7bdfa8002e03fe260a1023351e0ea4598032022b68dd6e3";
const container = `linde-brand-data-test-${randomUUID()}`;
function docker(args, input) {
  const result = spawnSync("docker", args, { input, encoding: "utf8", timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`Local Docker command failed: ${result.stderr ?? ""}`);
  return `${result.stdout}${result.stderr}`;
}
const psql = ["exec", "-i", container, "psql", "-X", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-Atq"];
function parallelSQL(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", psql, { stdio: ["pipe", "pipe", "pipe"], timeout: 30000 });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, output }));
    child.stdin.end(sql);
  });
}
let started = false;
try {
  started = true;
  docker(["run", "--detach", "--rm", "--name", container, "--network", "none", "--tmpfs", "/var/lib/postgresql/data:rw,noexec,nosuid", "-e", "POSTGRES_HOST_AUTH_METHOD=trust", image]);
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    const result = spawnSync("docker", ["exec", container, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"], { encoding: "utf8" });
    if (result.status === 0) { ready = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("Local PostgreSQL did not become ready");
  const fixture = await readFile("supabase/tests/local-auth-fixture.sql", "utf8");
  const migration = await readFile("supabase/migrations/20261026000100_brand_data_foundation.sql", "utf8");
  const tests = await readFile("supabase/tests/brand-data-foundation.sql", "utf8");
  docker(psql, fixture);
  docker(psql, migration);
  const output = docker(psql, tests);
  console.log(`PostgreSQL SQL assertions: ${(output.match(/NOTICE:  PASS:/g) ?? []).length} passed`);

  // Two independent DB connections, not Promise wrappers around one session.
  const claim = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
  const bootstrap = `begin; set local role authenticated; set local request.jwt.claims = '${claim}'; select public.bootstrap_workspace('Concurrent workspace','concurrent-key'); select pg_sleep(0.15); commit;`;
  const boot = await Promise.all([parallelSQL(bootstrap), parallelSQL(bootstrap)]);
  const ids = boot.map(({ output }) => output.match(/^[0-9a-f-]{36}$/m)?.[0]);
  if (boot.some(({ code }) => code !== 0) || !ids[0] || ids[0] !== ids[1]) throw new Error("Concurrent bootstrap did not return one workspace");
  const workspace = ids[0];
  const brand = docker(psql, `set role authenticated; set request.jwt.claims = '${claim}'; select public.create_brand('${workspace}','Concurrent brand');`).trim();
  if (!/^[0-9a-f-]{36}$/.test(brand)) throw new Error("Concurrency brand fixture failed");
  const save = `\\set VERBOSITY sqlstate\nbegin; set local role authenticated; set local request.jwt.claims = '${claim}'; select public.save_brand_profile('${brand}',1,'{"schema_version":1,"identity":{"name":"Concurrent edit"}}'); select pg_sleep(0.15); commit;`;
  const writes = await Promise.all([parallelSQL(save), parallelSQL(save)]);
  if (writes.filter(({ code }) => code === 0).length !== 1 || writes.filter(({ code, output }) => code !== 0 && output.includes("40001")).length !== 1) throw new Error("Concurrent saves did not produce exactly one success and one conflict");
  const totals = docker(psql, `select (select count(*) from public.workspaces)::text || ',' || (select count(*) from public.memberships)::text || ',' || (select count(*) from public.brand_revisions where brand_id='${brand}')::text || ',' || (select revision from public.brands where id='${brand}')::text;`).trim();
  if (totals !== "1,1,2,2") throw new Error("Concurrent operations left duplicate/orphan rows");
  console.log("Concurrency: same-key bootstrap deduplicated; stale parallel save rejected; row counts and pointers consistent");
  // Rebuild a second fresh database from exactly the same versioned migration.
  docker(psql, "create database replay;");
  docker([...psql, "-d", "replay"], fixture);
  docker([...psql, "-d", "replay"], migration);
  const replay = docker([...psql, "-d", "replay"], tests);
  console.log(`Fresh replay: ${(replay.match(/NOTICE:  PASS:/g) ?? []).length} assertions passed`);
  console.log("PASS: isolated PostgreSQL 17.6; network disabled; no host ports; remote Supabase untouched");
} finally {
  if (started) spawnSync("docker", ["rm", "--force", container], { stdio: "ignore", timeout: 15000 });
}
