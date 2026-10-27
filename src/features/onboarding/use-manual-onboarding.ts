"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { callOnboardingApi, newOperation, OnboardingFailure, parseOperation, persistManual, type FailureKind, type ManualOperation } from "./manual-operation";

const changed = "linde-manual-operation";
const keyFor = (scope: string) => `linde.manual-onboarding.v1.${scope}`;
function subscribe(callback: () => void) {
  window.addEventListener(changed, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(changed, callback); window.removeEventListener("storage", callback); };
}
export function useManualOnboarding(scope?: string) {
  const snapshot = useCallback(() => {
    if (!scope) return null;
    try { return localStorage.getItem(keyFor(scope)); } catch { return "unavailable"; }
  }, [scope]);
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  let stored: ManualOperation | null = null;
  let broken = false;
  try { stored = parseOperation(raw); } catch { broken = true; }
  const [volatile, setVolatile] = useState<ManualOperation | null>(null);
  const [failure, setFailure] = useState<FailureKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const running = useRef(false);
  const operation = volatile ?? stored;
  async function start(name: string, description: string) {
    if (!scope || running.current) return;
    running.current = true; setBusy(true); setFailure(null);
    try {
      if (!navigator.locks) throw new OnboardingFailure("storage");
      await navigator.locks.request(keyFor(scope), { ifAvailable: true }, async (lock) => {
        if (!lock) throw new OnboardingFailure("busy");
        let op: ManualOperation | null;
        try { op = volatile ?? parseOperation(localStorage.getItem(keyFor(scope))); }
        catch { throw new OnboardingFailure("storage"); }
        op ??= newOperation(name, description);
        const save = (value: ManualOperation) => {
          try { localStorage.setItem(keyFor(scope), JSON.stringify(value)); }
          catch { setVolatile(value); throw new OnboardingFailure("storage"); }
          setVolatile(null);
          window.dispatchEvent(new Event(changed));
        };
        save(op); // No request without a durable recovery record.
        await persistManual(op, callOnboardingApi, save, setProgress);
      });
    } catch (error) { setFailure(error instanceof OnboardingFailure ? error.kind : "unavailable"); }
    finally { setBusy(false); setProgress(""); running.current = false; }
  }
  return { operation, failure: broken ? "storage" as const : failure, busy, progress, start };
}
