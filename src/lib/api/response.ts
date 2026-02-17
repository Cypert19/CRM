import { NextResponse } from "next/server";

/**
 * Standard API response format.
 * Success: { success: true, data: T }
 * Error:   { success: false, error: string }
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export function apiUnauthorized() {
  return apiError("Invalid or missing API key", 401);
}

export function apiNotFound(resource = "Resource") {
  return apiError(`${resource} not found`, 404);
}
