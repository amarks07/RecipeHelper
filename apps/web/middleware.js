import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const publicRoutes = ["/", "/auth/login", "/auth/signup"];

  // Check if user is trying to access a protected route without auth
  const isProtectedRoute = !publicRoutes.includes(pathname);

  // Get auth token from cookie
  const authToken = request.cookies.get("sb-auth-token")?.value;

  // If protected route and no token, redirect to login
  if (isProtectedRoute && !authToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
