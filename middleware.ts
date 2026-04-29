import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return url && url !== 'your-supabase-project-url' && url.startsWith('http')
}

export async function middleware(req: NextRequest) {
  // Skip auth checks if Supabase is not configured (demo mode)
  if (!isSupabaseConfigured()) {
    return NextResponse.next()
  }

  const res = NextResponse.next({
    request: {
      headers: req.headers
    }
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session }
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/assets', '/generations', '/text-to-video', '/image-to-video', '/text-to-image', '/video-upscaler', '/admin']
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // Redirect to login if trying to access protected route without session
  if (isProtectedPath && !session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
