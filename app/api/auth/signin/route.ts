import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: () => cookieStore }
    )

    // Get redirect parameter from URL
    const url = new URL(request.url)
    const redirectTo = url.searchParams.get('redirect') || '/dashboard'

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Redirect to Google OAuth page
    return NextResponse.redirect(data.url)
  } catch (error: any) {
    console.error('Signin error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Also support GET for direct links
export async function GET(request: NextRequest) {
  return POST(request)
}
