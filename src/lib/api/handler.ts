import { NextRequest } from "next/server";
import { authenticateApiKey, type ApiContext } from "./auth";
import { apiUnauthorized, apiError } from "./response";

type HandlerFn = (
  request: NextRequest,
  ctx: ApiContext,
  params: Record<string, string>
) => Promise<Response>;

/**
 * Wraps a route handler with API key authentication and error handling.
 *
 * Usage:
 *   export const GET = withApiAuth(async (request, ctx, params) => {
 *     // ctx.workspaceId, ctx.createdByUserId available
 *     return apiSuccess(data);
 *   });
 */
export function withApiAuth(handler: HandlerFn) {
  return async (
    request: NextRequest,
    segmentData: { params: Promise<Record<string, string>> }
  ) => {
    try {
      const ctx = await authenticateApiKey(request);
      if (!ctx) return apiUnauthorized();

      const params = await segmentData.params;
      return await handler(request, ctx, params);
    } catch (err) {
      console.error("[API v1] Unhandled error:", err);
      return apiError("Internal server error", 500);
    }
  };
}
