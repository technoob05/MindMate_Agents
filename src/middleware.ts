import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- SIMULATED AUTH CHECK ---
  // In a real application, you would check for a valid session token (e.g., from a cookie) here.
  // const isAuthenticated = checkAuthToken(request.cookies.get('sessionToken'));
  const isAuthenticated = false; // Hardcoded to false for demo purposes to force login redirect

  // Define public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/register',
    // Add other public paths like landing page, about page, etc. if needed
    // '/', // Let's assume the root page should also be protected for now
  ];

  // Allow requests to API auth routes, static files, and Next.js internals
  const isPublicApiRoute = pathname.startsWith('/api/auth/');
  const isStaticAsset = pathname.startsWith('/_next/') || pathname.includes('.'); // Basic check for static files

  // Check if the requested path is public
  const isPublicPath = publicPaths.includes(pathname);

  // --- Temporarily Disabled for Demo ---
  // The following block redirects unauthenticated users. It's disabled because
  // we don't have real session management yet, causing a redirect loop after login.
  /*
  if (!isAuthenticated && !isPublicPath && !isPublicApiRoute && !isStaticAsset) {
    // Redirect to the login page
    const loginUrl = new URL('/login', request.url);
    console.log(`Redirecting unauthenticated access from ${pathname} to /login`);
    return NextResponse.redirect(loginUrl);
  }
  */
  // --- End Temporarily Disabled Section ---

  // Allow the request to proceed if authenticated or accessing a public path
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes) - We handle API auth routes specifically inside the middleware
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public assets (e.g., /models/*) - Handled by the '.' check or specific path checks if needed
   */
   // We will apply the middleware logic more broadly and filter inside the function
   // This ensures even API routes (except auth) could be protected if needed later.
   // Let the middleware function handle path logic.
   matcher: '/((?!_next/static|_next/image|favicon.ico|models/).*)', // Apply broadly, filter inside
};
