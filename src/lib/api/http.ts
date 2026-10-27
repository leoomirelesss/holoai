import "server-only";
import { randomUUID } from "node:crypto";
import { trustedOrigin } from "@/lib/auth/config";
import { ApiError, unavailable } from "./errors";
import { apiSession, type ApiSession } from "./session";

export const MAX_BODY_BYTES = 70 * 1024;
export async function jsonBody(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json" || ![null, "identity"].includes(request.headers.get("content-encoding"))) {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Envía JSON sin compresión.");
  }
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "El contenido supera el límite permitido.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "INVALID_JSON", "Envía un documento JSON válido.");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel().catch(() => {}); throw new ApiError(413, "PAYLOAD_TOO_LARGE", "El contenido supera el límite permitido."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try {
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch { throw new ApiError(400, "INVALID_JSON", "Envía un documento JSON válido."); }
}
type Result = { data: unknown; status?: number; headers?: Record<string, string> };
export function apiRoute(operation: (request: Request, session: ApiSession) => Promise<Result>) {
  return async (request: Request): Promise<Response> => {
    const correlation_id = randomUUID();
    const headers = new Headers({ "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", Vary: "Cookie", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Request-Id": correlation_id });
    try {
      if (!["GET", "HEAD"].includes(request.method)) {
        let allowed;
        try { allowed = trustedOrigin(request.headers.get("origin")); } catch { throw unavailable(); }
        if (!allowed || request.headers.get("sec-fetch-site") === "cross-site") throw new ApiError(403, "CSRF_REJECTED", "El origen de la solicitud no está permitido.");
      }
      const session = await apiSession();
      const result = await operation(request, session);
      for (const [name, value] of Object.entries(result.headers ?? {})) headers.set(name, value);
      return Response.json({ data: result.data, meta: { correlation_id } }, { status: result.status ?? 200, headers });
    } catch (error) {
      const failure = error instanceof ApiError ? error : new ApiError(500, "INTERNAL_ERROR", "No se pudo completar la solicitud.");
      return Response.json({ error: { code: failure.code, message: failure.message, retryable: failure.status === 503 && ["GET", "HEAD"].includes(request.method) }, meta: { correlation_id } }, { status: failure.status, headers });
    }
  };
}
