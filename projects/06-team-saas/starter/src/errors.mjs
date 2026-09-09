export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new AppError(400, "BAD_REQUEST", message, details);
export const unauthorized = () => new AppError(401, "UNAUTHENTICATED", "Authentication is required");
export const forbidden = () => new AppError(403, "FORBIDDEN", "The authenticated user cannot perform this action");
export const notFound = (resource) => new AppError(404, "NOT_FOUND", `${resource} was not found`);
export const conflict = (message) => new AppError(409, "CONFLICT", message);
