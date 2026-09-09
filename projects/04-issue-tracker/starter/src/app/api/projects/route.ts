import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, errorResponse } from "@/lib/http";
import { store } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(store.listProjects(authenticatedUserId(request)));
  } catch (error) {
    return errorResponse(error);
  }
}
