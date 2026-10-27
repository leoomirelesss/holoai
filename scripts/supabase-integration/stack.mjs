import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const cliVersion = "2.122.0";
export async function localStack(onStage = () => {}) {
  const directory = await mkdtemp(join(tmpdir(), "linde-supabase-integration-"));
  const project = `linde-integration-${randomUUID().slice(0, 8)}`;
  const cli = process.env.SUPABASE_CLI || "supabase";
  // Never forward remote keys, access tokens, project references or test credentials.
  const env = Object.fromEntries(["PATH", "TMPDIR", "SYSTEMROOT", "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "SSL_CERT_FILE", "SSL_CERT_DIR", "NODE_EXTRA_CA_CERTS"].filter((key) => process.env[key]).map((key) => [key, process.env[key]]));
  Object.assign(env, { SUPABASE_HOME: join(directory, "cli-home"), SUPABASE_TELEMETRY_DISABLED: "true", SUPABASE_NO_KEYRING: "true", SUPABASE_NO_UPDATE_NOTIFIER: "true", SUPABASE_USE_SLIM_IMAGES: "false" });
  function command(binary, args, input, timeout = 120000) {
    return new Promise((resolve, reject) => {
      const child = spawn(binary, args, { cwd: directory, env, stdio: ["pipe", "pipe", "pipe"], timeout });
      let stdout = "", stderr = "";
      child.stdout.on("data", (chunk) => { if (stdout.length < 4e6) stdout += chunk; });
      child.stderr.on("data", (chunk) => { if (stderr.length < 4e6) stderr += chunk; });
      child.on("error", () => reject(new Error("Local tool unavailable")));
      child.on("close", (code) => resolve({ code, stdout, stderr }));
      child.stdin.on("error", () => {});
      child.stdin.end(input);
    });
  }
  async function supabase(args, timeout) {
    const result = await command(cli, [...args, "--workdir", directory], undefined, timeout);
    if (result.code !== 0) {
      const text = result.stderr + result.stdout;
      const categories = [
        ["disk-space", /no space left|ENOSPC/i],
        ["container-health", /unhealthy|health check/i],
        ["image-download", /failed to pull|pull access denied|manifest unknown|failed to extract/i],
        ["network-timeout", /i\/o timeout|context deadline|timed out|timeout/i],
        ["configuration", /invalid config|failed to parse|unknown flag|unknown field/i],
        ["permission", /permission denied|operation not permitted/i],
      ];
      const error = new Error("Local CLI operation failed");
      error.category = categories.find(([, pattern]) => pattern.test(text))?.[0] ?? "local-cli-operation";
      throw error;
    }
    return result.stdout;
  }
  let started = false;
  let networkCreated = false;
  const network = `supabase_network_${project}`;
  return {
    project,
    async start() {
      onStage("cli-version");
      const version = await command(cli, ["--version"]);
      if (version.code !== 0 || version.stdout.trim() !== cliVersion) throw new Error("CLI version mismatch");
      onStage("cli-init");
      await supabase(["init"]);
      const configPath = join(directory, "supabase/config.toml");
      let config = await readFile(configPath, "utf8");
      config = config.replace(/^project_id = .*$/m, `project_id = "${project}"`).replaceAll("543", "553")
        .replace(/(\[db.seed\][\s\S]*?enabled = )true/, "$1false")
        .replace('openai_api_key = "env(OPENAI_API_KEY)"', 'openai_api_key = ""');
      await writeFile(configPath, config, { mode: 0o600 });
      // Start without app migrations; apply them explicitly with migration up --local.
      onStage("docker-network");
      const created = await command("docker", ["network", "create", "--driver", "bridge", "--label", `com.supabase.cli.project=${project}`, "--opt", "com.docker.network.bridge.host_binding_ipv4=127.0.0.1", network]);
      if (created.code !== 0) throw new Error("Local network creation failed");
      networkCreated = true;
      started = true;
      onStage("local-stack-start");
      await supabase(["start", "--exclude", "studio,postgres-meta,edge-runtime,logflare,vector"], 900000);
      await mkdir(join(directory, "supabase/migrations"), { recursive: true });
      await cp(join(process.cwd(), "supabase/migrations"), join(directory, "supabase/migrations"), { recursive: true });
      onStage("migration-up-local");
      await supabase(["migration", "up", "--local"]);
      onStage("local-status");
      const status = JSON.parse(await supabase(["status", "--output", "json"]));
      const url = new URL(status.API_URL);
      if (url.hostname !== "127.0.0.1" || url.port !== "55321" || url.protocol !== "http:") throw new Error("Non-local API refused");
      if (!status.ANON_KEY) throw new Error("Local anonymous API key missing");
      return { url: url.origin, key: status.ANON_KEY };
    },
    async sql(statement) {
      const result = await command("docker", ["exec", "-i", `supabase_db_${project}`, "psql", "-X", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-Atq"], statement);
      if (result.code !== 0) throw new Error("Local SQL assertion failed");
      return result.stdout.trim();
    },
    async rest(action) {
      if (!["pause", "unpause"].includes(action)) throw new Error("Invalid local service action");
      const result = await command("docker", [action, `supabase_rest_${project}`]);
      if (result.code !== 0) throw new Error("Local service action failed");
    },
    async images() {
      const result = await command("docker", ["ps", "--filter", `label=com.supabase.cli.project=${project}`, "--format", "{{.Image}}"]);
      return result.stdout.trim().split("\n").filter(Boolean).sort();
    },
    async stop() {
      let clean = true;
      if (started) {
        try { await supabase(["stop", "--no-backup", "--project-id", project], 120000); } catch { clean = false; }
      }
      // Includes CLI-generated local credentials: never retain as test artifacts.
      if (networkCreated) {
        const existing = await command("docker", ["network", "ls", "--filter", `name=^${network}$`, "--format", "{{.Name}}"]);
        if (existing.stdout.trim()) {
          const removed = await command("docker", ["network", "rm", network]);
          if (removed.code !== 0) clean = false;
        }
      }
      await rm(directory, { recursive: true, force: true });
      return clean;
    },
  };
}
