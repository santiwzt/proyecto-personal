export type AppErrorCode =
  | "VALIDATION"
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "LIMIT_EXCEEDED"
  | "INVALID_FILE"
  | "PROCESSING_FAILED"
  | "AI_PROVIDER_UNAVAILABLE"
  | "INTERNAL";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  VALIDATION: 400,
  AUTHENTICATION: 401,
  AUTHORIZATION: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  LIMIT_EXCEEDED: 429,
  INVALID_FILE: 422,
  PROCESSING_FAILED: 422,
  AI_PROVIDER_UNAVAILABLE: 503,
  INTERNAL: 500,
};

const DEFAULT_USER_MESSAGE: Record<AppErrorCode, string> = {
  VALIDATION: "Los datos ingresados no son validos.",
  AUTHENTICATION: "Necesitas iniciar sesion para continuar.",
  AUTHORIZATION: "No tenes permiso para realizar esta accion.",
  NOT_FOUND: "No encontramos lo que buscabas.",
  CONFLICT: "Esta accion entra en conflicto con datos existentes.",
  LIMIT_EXCEEDED: "Alcanzaste el limite disponible. Intenta mas tarde.",
  INVALID_FILE: "El archivo no es valido o no esta permitido.",
  PROCESSING_FAILED: "No pudimos procesar este archivo.",
  AI_PROVIDER_UNAVAILABLE: "El asistente de IA no esta disponible en este momento.",
  INTERNAL: "Ocurrio un error inesperado. Intenta nuevamente.",
};

/**
 * Typed application error. `message` is safe to show to the end user;
 * put internal/debug detail in `debugContext` (never rendered, only logged).
 */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly httpStatus: number;
  readonly debugContext?: Record<string, unknown>;

  constructor(code: AppErrorCode, message?: string, debugContext?: Record<string, unknown>) {
    super(message ?? DEFAULT_USER_MESSAGE[code]);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = STATUS_BY_CODE[code];
    this.debugContext = debugContext;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Converts any thrown value into a safe, typed shape for API responses. */
export function toErrorResponse(error: unknown): { code: AppErrorCode; message: string } {
  if (isAppError(error)) {
    return { code: error.code, message: error.message };
  }
  // Never leak internal error details (stack traces, driver messages, etc.)
  console.error("Unhandled error:", error);
  return { code: "INTERNAL", message: DEFAULT_USER_MESSAGE.INTERNAL };
}
