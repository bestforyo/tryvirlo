import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(searchParams.get('code')!)

  if (error || !data.session) {
    console.error('Error exchanging code for session:', error)
    redirect('/login?error=auth_failed')
  }

  redirect(redirectUrl)
}
