import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { localStack, cliVersion } from "./supabase-integration/stack.mjs";
import { localApp } from "./brand-api/app.mjs";
import { dnaChecks } from "./brand-dna/checks.mjs";
process.umask(0o077);
const migration = "supabase/migrations/20261026000100_brand_data_foundation.sql";
const results = { cli: cliVersion, scope: "brand-dna", migration, migrationSha256: createHash("sha256").update(await readFile(migration)).digest("hex"), status: "failed", stage: "local-stack-start", checks: [] };
const stage = (name) => { results.stage = name; };
let stack, app;
try {
  console.log("Brand DNA: isolated Supabase and production Next.js only; private outputs withheld.");
  stack = await localStack(stage);
  const connection = await stack.start();
  app = await localApp(connection, stage);
  stage("brand-dna-checks");
  await dnaChecks(stack, app.origin, connection, (name, passed, httpStatus) => {
    results.checks.push({ name, passed: Boolean(passed) });
    if (!passed) {
      stage(name);
      if (Number.isInteger(httpStatus)) results.observedHttpStatus = httpStatus;
      throw new Error("API assertion failed");
    }
  });
  results.status = "passed"; stage("done");
} catch (error) {
  const categories = ["disk-space", "container-health", "image-download", "network-timeout", "configuration", "permission", "local-cli-operation"];
  if (categories.includes(error?.category)) results.failureCategory = error.category;
} finally {
  let appClean = true, stackClean = true;
  try { if (app) appClean = await app.stop(); } catch { appClean = false; }
  try { if (stack) stackClean = await stack.stop(); } catch { stackClean = false; }
  results.cleanup = appClean && stackClean;
  if (!results.cleanup) { results.status = "failed"; stage("local-cleanup"); }
  await writeFile("replica/dna-results.json", `${JSON.stringify(results, null, 2)}\n`);
}
console.log(`Brand DNA: ${results.status}; ${results.checks.filter(({ passed }) => passed).length} checks passed; stage=${results.stage}; cleanup=${results.cleanup}.`);
if (results.status !== "passed") process.exitCode = 1;
