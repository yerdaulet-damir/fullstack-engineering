import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, errorResponse, readJsonObject, readString } from "@/lib/http";
import type { PreparedAttachment } from "@/lib/domain";
import { store } from "@/lib/store";
import { ValidationError } from "@/lib/tracker-store";

type RouteContext = { params: Promise<{ projectId: string }> };
const acceptedTypes: PreparedAttachment["contentType"][] = ["image/png", "image/jpeg", "application/pdf"];

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const body = await readJsonObject(request);
    const contentType = readString(body.contentType, "Content type");
    if (!acceptedTypes.includes(contentType as PreparedAttachment["contentType"])) {
      throw new ValidationError("Content type must be PNG, JPEG, or PDF.");
    }
    return NextResponse.json(
      store.prepareAttachment(
        authenticatedUserId(request),
        projectId,
        contentType as PreparedAttachment["contentType"],
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
