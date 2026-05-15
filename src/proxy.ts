import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Auth Guard
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/signup') ||
                    request.nextUrl.pathname.startsWith('/forgot-password')
  
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') ||
                         request.nextUrl.pathname.startsWith('/properties') ||
                         request.nextUrl.pathname.startsWith('/tenants') ||
                         request.nextUrl.pathname.startsWith('/leases') ||
                         request.nextUrl.pathname.startsWith('/compliance') ||
                         request.nextUrl.pathname.startsWith('/team') ||
                         request.nextUrl.pathname.startsWith('/settings')

  if (isProtectedPage && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
