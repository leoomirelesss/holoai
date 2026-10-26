import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

test("D02: real page, approved tokens, no overflow and accessible empty state", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { level: 1, name: "Tu marca empieza aquí." })).toBeVisible();
  await expect(page.getByText("Análisis del sitio: todavía no disponible")).toBeVisible();
  const measurements = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
    font: document.fonts.check('16px "Inter"'),
    background: getComputedStyle(document.body).backgroundColor,
    fieldHeight: document.querySelector("input")!.getBoundingClientRect().height,
  }));
  expect(measurements.width).toBeLessThanOrEqual(measurements.viewport);
  expect(measurements.font).toBe(true);
  expect(measurements.background).toBe("rgb(247, 246, 242)");
  expect(measurements.fieldHeight).toBeGreaterThanOrEqual(44);
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(audit.violations).toEqual([]);
  await mkdir("replica/clone-screens", { recursive: true });
  await page.screenshot({ path: `replica/clone-screens/D02-${info.project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("validates URL and saves a local draft without contacting the company", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => { if (!request.url().startsWith("http://127.0.0.1:3000")) external.push(request.url()); });
  await page.goto("/");
  await page.getByRole("button", { name: "Guardar dirección" }).click();
  await expect(page.getByLabel("Dirección de tu empresa")).toBeFocused();
  await expect(page.getByText("Introduce la dirección HTTPS de tu empresa.", { exact: true })).toBeVisible();
  await page.getByLabel("Dirección de tu empresa").fill("http://example.com");
  await page.getByRole("button", { name: "Guardar dirección" }).click();
  await expect(page.getByLabel("Dirección de tu empresa")).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Dirección de tu empresa").fill("https://example.com/mi-marca");
  await page.getByRole("button", { name: "Guardar dirección" }).click();
  await expect(page.getByRole("status")).toContainText("No se ha analizado ninguna web");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Borrador en esta pestaña" })).toBeVisible();
  await page.getByRole("button", { name: "Recuperar borrador" }).click();
  await expect(page.getByLabel("Dirección de tu empresa")).toHaveValue("https://example.com/mi-marca");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar JSON" }).click();
  expect((await downloaded).suggestedFilename()).toBe("linde-borrador-marca.json");
  expect(external).toEqual([]);
});

test("manual entry, validation, recover and remove all have real local behavior", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Comenzar manualmente" }).click();
  await expect(page.getByLabel("Nombre de tu marca")).toBeFocused();
  await page.getByRole("button", { name: "Guardar datos iniciales" }).click();
  await expect(page.getByText("Escribe el nombre de tu marca.", { exact: true })).toBeVisible();
  await page.getByLabel("Nombre de tu marca").fill("Mi marca de prueba con un nombre suficientemente largo para revisar el diseño");
  await page.getByLabel("¿Qué ofrece tu empresa?").fill("Productos propios y servicios para personas que quieren crear con criterio.");
  await page.getByRole("button", { name: "Guardar datos iniciales" }).click();
  await expect(page.getByRole("status")).toContainText("solo en esta pestaña");
  await page.evaluate(() => document.fonts.ready);
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(audit.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `replica/clone-screens/D02-manual-${info.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Eliminar borrador" }).click();
  await expect(page.getByRole("heading", { name: "Borrador en esta pestaña" })).toHaveCount(0);
  await expect(page.getByLabel("Nombre de tu marca")).toHaveValue(/Mi marca de prueba/);
});

test("navigation dialog traps focus and Escape restores the trigger", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Navegación" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Tu espacio Linde" });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  }
  await expect(dialog.getByText("No disponible", { exact: true })).toHaveCount(4);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("keyboard-only URL flow and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Dirección de tu empresa")).toBeFocused();
  await page.keyboard.type("https://example.com");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Guardar dirección" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Borrador guardado");
});

test("blocked browser storage reports failure and preserves user input", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("Storage blocked for test"); } });
  });
  await page.goto("/");
  await page.getByLabel("Dirección de tu empresa").fill("https://example.com");
  await page.getByRole("button", { name: "Guardar dirección" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No pudimos guardar" })).toBeVisible();
  await expect(page.getByLabel("Dirección de tu empresa")).toHaveValue("https://example.com");
  await expect(page.getByRole("heading", { name: "Borrador en esta pestaña" })).toHaveCount(0);
});

test("320px layout and enlarged text remain usable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await expect(page.getByRole("button", { name: "Comenzar manualmente" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
