import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.HOME_PASSWORD || 'default-secret-at-least-32-chars-long'
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('home_auth_token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch (e) {
      console.error('Invalid token', e);
      // If token is invalid, we proceed with isAuthenticated = false
    }
  }

  if (!isAuthenticated && !isLoginPage) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Clear invalid cookie
    if (token) response.cookies.delete('home_auth_token');
    return response;
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|.*\\.png|.*\\.jpg).*)',
  ],
};
