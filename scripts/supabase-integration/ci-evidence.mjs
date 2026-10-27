import { appendFile, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

// Reconstruct a closed schema; never upload CLI logs, responses, headers or workdir.
const path = "replica/supabase-integration-results.json";
const migration = "supabase/migrations/20261026000100_brand_data_foundation.sql";
const source = JSON.parse(await readFile(path, "utf8"));
const categories = ["disk-space", "container-health", "image-download", "network-timeout", "configuration", "permission", "local-cli-operation"];
const safeName = (value) => typeof value === "string" && /^[a-z][a-z0-9_-]{0,99}$/.test(value);
const checks = Array.isArray(source.checks) ? source.checks : [];
if (checks.some((check) => !safeName(check.name) || typeof check.passed !== "boolean") || !safeName(source.stage)) {
  // Refuse to publish malformed evidence instead of passing arbitrary data through.
  await writeFile(path, '{"status":"failed","stage":"evidence-rejected","checks":[]}\n');
  process.exitCode = 1;
} else {
  const result = {
    cli: "2.122.0",
    migration,
    migrationSha256: createHash("sha256").update(await readFile(migration)).digest("hex"),
    status: source.status === "passed" && source.cleanup === true && source.stage === "done" && checks.length > 0 && checks.every(({ passed }) => passed) ? "passed" : "failed",
    stage: source.stage,
    checks: checks.map(({ name, passed }) => ({ name, passed })),
    cleanup: source.cleanup === true,
  };
  if (categories.includes(source.failureCategory)) result.failureCategory = source.failureCategory;
  if (Number.isInteger(source.conflictHttpStatus)) result.conflictHttpStatus = source.conflictHttpStatus;
  const url = process.env.EXECUTION_URL;
  if (url && /^https:\/\/github\.com\/leoomirelesss\/holoai\/actions\/runs\/\d+$/.test(url)) result.executionUrl = url;
  if (/^[a-f0-9]{40}$/.test(process.env.EXECUTION_SHA ?? "")) result.executionSha = process.env.EXECUTION_SHA;
  await writeFile(path, `${JSON.stringify(result, null, 2)}\n`);
}

// Publish only after a closed-schema file has actually been written.
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, "safe=true\n");
