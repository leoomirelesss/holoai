import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./tests", testMatch: "dna-model.spec.ts", outputDir: "test-results/dna-contracts", workers: 1, retries: 0, reporter: "list", use: { trace: "off", screenshot: "off", video: "off" } });
