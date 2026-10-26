import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const publicRoutes = ["/", "/auth/login", "/auth/signup", "/auth/callback"];

  // Check if user is trying to access a protected route without auth
  const isProtectedRoute = !publicRoutes.includes(pathname);

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // For protected routes, we can't check session on server side
  // The session is stored in localStorage on the client, not in cookies
  // So we'll allow the request through and let the client-side code handle redirects
  // If there's no session, the client will redirect to /auth/login
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
