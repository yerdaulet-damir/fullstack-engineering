export class OperatorError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
    public readonly retryable = false
  ) {
    super(message);
    this.name = "OperatorError";
  }
}

export class CrashAfterWriteError extends Error {
  constructor() {
    super("Simulated process crash after the external write");
    this.name = "CrashAfterWriteError";
  }
}

export function toOperatorError(error: unknown): OperatorError {
  if (error instanceof OperatorError) return error;
  if (error instanceof Error) {
    return new OperatorError("INTERNAL_ERROR", error.message, 500, false);
  }
  return new OperatorError("INTERNAL_ERROR", "Unknown operator failure", 500, false);
}
