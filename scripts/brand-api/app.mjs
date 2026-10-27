import { spawn } from "node:child_process";
import { Agent, request } from "node:http";
export const appOrigin = "http://127.0.0.1:3100";
export async function localApp(connection, stage) {
  if (connection.url !== "http://127.0.0.1:55321") throw new Error("Local stack required");
  const env = Object.fromEntries(["PATH", "TMPDIR", "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "SSL_CERT_FILE", "SSL_CERT_DIR", "NODE_EXTRA_CA_CERTS"].filter((key) => process.env[key]).map((key) => [key, process.env[key]]));
  Object.assign(env, { NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_SUPABASE_URL: connection.url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: connection.key, SITE_URL: appOrigin, NO_PROXY: `${env.NO_PROXY ?? ""},localhost,127.0.0.1,::1` });
  let server;
  async function stop() {
    if (!server || server.exitCode !== null) return true;
    try { process.kill(-server.pid, "SIGTERM"); } catch { /* already closed */ }
    await Promise.race([new Promise((resolve) => server.once("close", resolve)), new Promise((resolve) => setTimeout(resolve, 5000))]);
    if (server.exitCode === null) { try { process.kill(-server.pid, "SIGKILL"); } catch { /* already closed */ } }
    return true;
  }
  try {
    stage("app-build");
    const built = await new Promise((resolve) => {
      const child = spawn("npm", ["run", "build"], { env, stdio: ["ignore", "ignore", "ignore"], timeout: 180000 });
      child.on("error", () => resolve(false)); child.on("close", (code) => resolve(code === 0));
    });
    if (!built) throw new Error("Local production build failed");
    stage("app-start");
    server = spawn("npm", ["run", "start", "--", "--port", "3100"], { env, detached: true, stdio: ["ignore", "ignore", "ignore"] });
    server.on("error", () => {});
    const agent = new Agent({ proxyEnv: {} });
    let ready = false;
    for (let i = 0; i < 80; i++) {
      ready = await new Promise((resolve) => {
        const req = request(`${appOrigin}/`, { agent, timeout: 1000 }, (res) => { res.resume(); resolve(res.statusCode === 200); });
        req.on("error", () => resolve(false)); req.on("timeout", () => req.destroy()); req.end();
      });
      if (ready) break;
      if (server.exitCode !== null) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    agent.destroy();
    if (!ready) throw new Error("Local production server unavailable");
    return { origin: appOrigin, stop };
  } catch { await stop(); throw new Error("Local application could not start"); }
}
