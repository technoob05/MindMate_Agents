import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy token từ cookie
  const token = request.cookies.get('sessionToken')?.value;
  
  // Xác thực token
  const isAuthenticated = token ? !!verifyToken(token) : false;

  // Định nghĩa các đường dẫn công khai không cần xác thực
  const publicPaths = [
    '/login',
    '/register',
    '/emergency-debug',
    '/emergency-fix',
    '/debug',
    '/api/auth/login',
    '/api/auth/register',
    '/_next',
    '/favicon.ico',
    '/images',
    '/models'
  ];

  // Kiểm tra xem đường dẫn hiện tại có phải là public path không
  const isPublicPath = publicPaths.some(path => {
    if (path === '/debug' && pathname.startsWith('/debug')) {
      return true;
    }
    return pathname.startsWith(path);
  });

  // Nếu người dùng chưa đăng nhập và đang cố truy cập trang được bảo vệ
  if (!isAuthenticated && !isPublicPath) {
    // Chuyển hướng đến trang login
    const loginUrl = new URL('/login', request.url);
    // Lưu URL hiện tại để chuyển hướng lại sau khi đăng nhập
    loginUrl.searchParams.set('redirect', pathname);
    console.log(`Redirecting unauthenticated access from ${pathname} to /login`);
    return NextResponse.redirect(loginUrl);
  }

  // Cho phép request tiếp tục nếu đã xác thực hoặc đang truy cập đường dẫn công khai
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
