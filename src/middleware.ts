import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

//  Secret used to verify JWT
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your_jwt_secret_here'
)

//  Public routes that DON'T need authentication
const publicRoutes = ['/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value
  console.log(' Middleware checking:', pathname, 'Token exists:', !!token)

  //  Skip checks for static assets, API routes, etc.
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  //  Check if current route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  )

  //  If there's no token and trying to access a protected route
  if (!token && !isPublicRoute) {
    console.log('❌ No token, redirecting to /auth')
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  //  If token exists, verify it
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      console.log(' JWT is valid')

      // If already logged in and trying to access /auth, redirect to dashboard
      if (isPublicRoute) {
        console.log(' Already authenticated, redirecting to /dashboard')
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }

      // Allow access to protected routes
      return NextResponse.next()
    } catch (err) {
      console.error('❌ Invalid token:', err)

      // Clear the invalid token
      const response = NextResponse.redirect(
        new URL('/auth', request.url)
      )
      response.cookies.delete('token')
      return response
    }
  }

  // Allow access to public routes without token
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|public).*)',
  ],
};

