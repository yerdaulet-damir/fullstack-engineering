import { NextRequest, NextResponse } from "next/server";
import { errorResponse, readJsonObject, readString, SESSION_COOKIE } from "@/lib/http";
import { store } from "@/lib/store";
import { SESSION_TTL_MS } from "@/lib/tracker-store";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    const { sessionId, snapshot } = store.signIn(readString(body.email, "Email"));
    const response = NextResponse.json(snapshot);
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  store.signOut(request.cookies.get(SESSION_COOKIE)?.value);
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
