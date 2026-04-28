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
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (e) {
            // Ignore
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (e) {
            // Ignore
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
