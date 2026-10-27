import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { localStack, cliVersion } from "./supabase-integration/stack.mjs";
import { integrationChecks } from "./supabase-integration/checks.mjs";

process.umask(0o077);
const migration = "supabase/migrations/20261026000100_brand_data_foundation.sql";
const migrationSha256 = createHash("sha256").update(await readFile(migration)).digest("hex");
const results = { cli: cliVersion, migration, migrationSha256, status: "failed", stage: "local-stack-start", checks: [] };
let stack;
try {
  console.log("Supabase integration: starting isolated local stack; CLI output withheld.");
  stack = await localStack((stage) => { results.stage = stage; });
  const connection = await stack.start();
  results.images = await stack.images();
  results.stage = "postgrest-auth-checks";
  console.log("Supabase integration: local migrations ready; real Auth/PostgREST checks running.");
  const summary = await integrationChecks(stack, connection, (name, passed) => {
    results.checks.push({ name, passed });
    if (!passed) { results.stage = name; throw new Error("Integration assertion failed"); }
  });
  Object.assign(results, summary);
  results.status = "passed";
  results.stage = "done";
} catch (error) {
  const categories = ["disk-space", "container-health", "image-download", "network-timeout", "configuration", "permission", "local-cli-operation"];
  if (categories.includes(error?.category)) results.failureCategory = error.category;
  // No stack traces, HTTP bodies, headers, CLI logs or SDK errors: they can carry credentials.
} finally {
  results.cleanup = stack ? await stack.stop() : true;
  if (!results.cleanup) { results.status = "failed"; results.stage = "local-cleanup"; }
  await writeFile("replica/supabase-integration-results.json", `${JSON.stringify(results, null, 2)}\n`);
}
console.log(`Supabase integration: ${results.status}; ${results.checks.filter(({ passed }) => passed).length} checks passed; stage=${results.stage}; cleanup=${results.cleanup}.`);
if (results.status !== "passed") process.exitCode = 1;
