import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./tests", testMatch: "manual-operation.spec.ts", workers: 1, retries: 0, reporter: "list", use: { trace: "off", screenshot: "off", video: "off" } });
