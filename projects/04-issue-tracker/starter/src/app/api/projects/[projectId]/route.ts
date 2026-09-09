import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, errorResponse } from "@/lib/http";
import { store } from "@/lib/store";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    return NextResponse.json(store.getProject(authenticatedUserId(request), projectId));
  } catch (error) {
    return errorResponse(error);
  }
}
