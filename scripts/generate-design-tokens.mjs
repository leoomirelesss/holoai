import { readFileSync, writeFileSync } from "node:fs";

const source = new URL("../replica/design/tokens.json", import.meta.url);
const destination = new URL("../src/app/design-tokens.css", import.meta.url);
const tokens = JSON.parse(readFileSync(source, "utf8"));
const rem = (value) => `${value / 16}rem`;
const lines = ["/* Generated from approved replica/design/tokens.json. Run npm run tokens. */", ":root {"];
for (const [key, value] of Object.entries(tokens.color)) lines.push(`  --linde-color-${key}: ${value};`);
for (const [key, value] of Object.entries(tokens.font)) lines.push(`  --linde-font-${key}: ${value};`);
for (const [key, values] of Object.entries(tokens.type)) {
  for (const [property, value] of Object.entries(values)) lines.push(`  --linde-type-${key}-${property}: ${property === "weight" ? value : rem(value)};`);
}
for (const value of tokens.space) lines.push(`  --linde-space-${value}: ${rem(value)};`);
for (const category of ["radius", "layout", "control"]) {
  for (const [key, value] of Object.entries(tokens[category])) lines.push(`  --linde-${category}-${key}: ${rem(value)};`);
}
for (const category of ["shadow", "motion", "z"]) {
  for (const [key, value] of Object.entries(tokens[category])) lines.push(`  --linde-${category}-${key}: ${value};`);
}
lines.push("}", "", "@theme inline {");
for (const key of Object.keys(tokens.color)) lines.push(`  --color-${key}: var(--linde-color-${key});`);
for (const key of Object.keys(tokens.font)) lines.push(`  --font-${key}: var(--linde-font-${key});`);
for (const key of Object.keys(tokens.radius)) lines.push(`  --radius-${key}: var(--linde-radius-${key});`);
for (const key of Object.keys(tokens.shadow)) lines.push(`  --shadow-${key}: var(--linde-shadow-${key});`);
for (const key of Object.keys(tokens.type)) {
  lines.push(`  --text-${key}: var(--linde-type-${key}-size);`, `  --text-${key}--line-height: var(--linde-type-${key}-line);`, `  --text-${key}--font-weight: var(--linde-type-${key}-weight);`);
}
lines.push("}", "", "@theme {", "  --breakpoint-*: initial;");
for (const [key, value] of Object.entries(tokens.breakpoint)) {
  if (value > 0) lines.push(`  --breakpoint-${key}: ${rem(value)};`);
}
lines.push("}", "");
const output = lines.join("\n");
if (process.argv.includes("--check")) {
  if (readFileSync(destination, "utf8") !== output) {
    console.error("Design tokens are out of date. Run npm run tokens.");
    process.exitCode = 1;
  }
} else writeFileSync(destination, output);
