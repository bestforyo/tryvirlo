/**
 * Supabase Auth Client Configuration
 * Handles server-side and client-side authentication
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return url && url !== 'your-supabase-project-url' && url.startsWith('http')
}

export async function createClient() {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Running in demo mode.')
    return null
  }

  const cookieStore = await cookies()

  return createServerClient(
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

export async function getUser() {
  const supabase = await createClient()

  if (!supabase) {
    // Return a demo user for local development
    return process.env.NODE_ENV === 'development' ? {
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User'
    } : null
  }

  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}
