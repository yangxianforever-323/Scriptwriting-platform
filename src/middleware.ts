import { type NextRequest, NextResponse } from "next/server";

/**
 * Simple middleware without authentication.
 * All routes are publicly accessible in development mode.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
