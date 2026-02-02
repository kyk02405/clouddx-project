import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect /portfolio route
    if (pathname.startsWith('/portfolio')) {
        const authToken = request.cookies.get('auth_token');

        if (!authToken) {
            // Redirect to login if not authenticated
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/portfolio/:path*'],
};
