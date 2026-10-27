export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}
export const unavailable = () => new ApiError(503, "SERVICE_UNAVAILABLE", "El servicio no está disponible. Inténtalo más tarde.");
export const notFound = () => new ApiError(404, "NOT_FOUND", "No se encontró el recurso.");
export const conflict = () => new ApiError(409, "REVISION_CONFLICT", "El recurso cambió. Vuelve a consultarlo antes de guardar.");
export const invalid = () => new ApiError(422, "VALIDATION_FAILED", "Revisa los campos enviados.");
export function databaseError(error: { code?: string }): ApiError {
  if (["40001", "23505"].includes(error.code ?? "")) return conflict();
  if (["22023", "23514", "23502", "22P02"].includes(error.code ?? "")) return invalid();
  if (["PGRST301", "PGRST302", "PGRST303"].includes(error.code ?? "")) return new ApiError(401, "AUTH_REQUIRED", "Inicia sesión para continuar.");
  if (error.code === "42501") return notFound();
  return unavailable();
}
/** SDK errors are classified by code, never exposed or logged. */
export async function query<T>(operation: PromiseLike<{ data: T; error: { code?: string } | null }>): Promise<T> {
  let result;
  try { result = await operation; } catch { throw unavailable(); }
  if (result.error) throw databaseError(result.error);
  return result.data;
}

export async function requiredQuery<T>(operation: PromiseLike<{ data: T; error: { code?: string } | null }>): Promise<NonNullable<T>> {
  const data = await query(operation);
  if (data === null || data === undefined) throw unavailable();
  return data;
}
