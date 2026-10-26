import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    browserName: "chromium",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", testIgnore: "auth-live.spec.ts", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", testIgnore: "auth-live.spec.ts", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "auth-live", testMatch: "auth-live.spec.ts", dependencies: ["desktop", "mobile"], use: { trace: "off", screenshot: "off", video: "off" } },
  ],
  webServer: { command: "npm run start", url: "http://127.0.0.1:3000", reuseExistingServer: !process.env.CI },
});
