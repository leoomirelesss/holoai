"use client";

import { useSyncExternalStore } from "react";

export type BrandDraft = {
  version: 1;
  mode: "url" | "manual";
  website: string;
  name: string;
  description: string;
  savedAt: string;
};

const key = "linde.brand-start.v1";
const event = "linde-draft-updated";

function subscribe(callback: () => void) {
  window.addEventListener(event, callback);
  return () => window.removeEventListener(event, callback);
}

function snapshot() {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

export function parseDraft(raw: string | null): BrandDraft | null {
  if (!raw || raw.length > 5000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const v = value as Record<string, unknown>;
    if (v.version !== 1 || (v.mode !== "url" && v.mode !== "manual")) return null;
    if (typeof v.website !== "string" || typeof v.name !== "string" || typeof v.description !== "string" || typeof v.savedAt !== "string") return null;
    if (v.website.length > 2048 || v.name.length > 120 || v.description.length > 600 || !Number.isFinite(Date.parse(v.savedAt))) return null;
    return { version: 1, mode: v.mode, website: v.website, name: v.name, description: v.description, savedAt: v.savedAt };
  } catch { return null; }
}

export function useBrandDraft() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  return parseDraft(raw);
}

export function saveDraft(draft: BrandDraft) {
  sessionStorage.setItem(key, JSON.stringify(draft));
  window.dispatchEvent(new Event(event));
}

export function removeDraft() {
  sessionStorage.removeItem(key);
  window.dispatchEvent(new Event(event));
}

export function validateWebsite(value: string): string | undefined {
  if (!value.trim()) return "Introduce la dirección HTTPS de tu empresa.";
  if (value.trim().length > 2048) return "La dirección no puede superar los 2048 caracteres.";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || !url.hostname.includes(".") || url.username || url.password) return "Usa una dirección HTTPS completa, sin datos de acceso. Por ejemplo, https://tuempresa.com.";
  } catch { return "Introduce una dirección válida. Por ejemplo, https://tuempresa.com."; }
}
