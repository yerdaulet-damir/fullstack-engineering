import { NextRequest, NextResponse } from "next/server";
import {
  AuthenticationRequiredError,
  InvalidCredentialsError,
  ProjectNotFoundError,
  ValidationError,
} from "./tracker-store";
import { store } from "./store";

export const SESSION_COOKIE = "issue_tracker_session";

export function authenticatedUserId(request: NextRequest): string {
  return store.userIdForSession(request.cookies.get(SESSION_COOKIE)?.value);
}

export function errorResponse(error: unknown) {
  if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: error.message } }, { status: 401 });
  if (error instanceof InvalidCredentialsError) return NextResponse.json({ error: { code: "INVALID_CREDENTIALS", message: error.message } }, { status: 401 });
  if (error instanceof ProjectNotFoundError) return NextResponse.json({ error: { code: "PROJECT_NOT_FOUND", message: error.message } }, { status: 404 });
  if (error instanceof ValidationError) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: error.message } }, { status: 400 });
  console.error(error);
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "The request could not be completed." } }, { status: 500 });
}

export async function readJsonObject(request: NextRequest): Promise<Record<string, unknown>> {
  const value: unknown = await request.json();
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError("Request body must be a JSON object.");
  return value as Record<string, unknown>;
}

export function readString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string.`);
  return value;
}
