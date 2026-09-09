import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, errorResponse, readJsonObject, readString } from "@/lib/http";
import { store } from "@/lib/store";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const body = await readJsonObject(request);
    const issue = store.createIssue(authenticatedUserId(request), projectId, {
      title: readString(body.title, "Title"),
      description: readString(body.description ?? "", "Description"),
    });
    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
