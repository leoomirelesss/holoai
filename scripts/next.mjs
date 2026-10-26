import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// Node's native proxy support uses the deployment's existing trusted proxy and CA.
// A separate child process is necessary: Node reads this option during startup.
const cli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const child = spawn(process.execPath, [cli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, NODE_USE_ENV_PROXY: process.env.NODE_USE_ENV_PROXY ?? "1" },
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => { process.exitCode = code ?? 0; });
child.on("error", () => { console.error("No se pudo iniciar Next.js."); process.exitCode = 1; });
