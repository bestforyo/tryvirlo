import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect') || '/dashboard'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore
            }
          },
        },
      }
    )

    try {
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth error:', error)
        redirect(`/login?error=${encodeURIComponent('authentication_failed')}`)
      }

      if (data?.user && data.session) {
        // Get user data
        const { user, session } = data
        const email = user.email
        const name = user.user_metadata?.name || user.user_metadata?.full_name || email?.split('@')[0]
        const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture

        if (email) {
          // Create or update user in database
          try {
            // First, try to find existing user by email
            let dbUser = await prisma.user.findUnique({
              where: { email }
            })

            if (!dbUser) {
              // Create new user
              dbUser = await prisma.user.create({
                data: {
                  id: user.id,
                  email,
                  googleId: user.id,
                  name,
                  avatar,
                  plan: 'FREE',
                  creditsBalance: 50, // Free tier starting credits
                  creditsMonthlyReset: 100,
                  emailVerified: user.email_confirmed_at != null
                }
              })

              // Create welcome credit transaction
              await prisma.creditsTransaction.create({
                data: {
                  userId: dbUser.id,
                  amount: 50,
                  type: 'BONUS',
                  description: 'Welcome bonus - 50 free credits to get started!'
                }
              })
            } else {
              // Update existing user's Google info
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: {
                  googleId: user.id,
                  name: name || dbUser.name,
                  avatar: avatar || dbUser.avatar,
                  emailVerified: user.email_confirmed_at != null
                }
              })
            }
          } catch (dbError) {
            console.error('Database error:', dbError)
            // Continue anyway - auth was successful
          }
        }

        // Redirect to the intended page
        redirect(redirectTo)
      }
    } catch (error) {
      console.error('Callback error:', error)
      redirect(`/login?error=${encodeURIComponent('server_error')}`)
    }
  }

  // If no code, redirect to login
  redirect('/login')
}
