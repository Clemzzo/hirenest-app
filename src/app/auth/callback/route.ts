import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Log all parameters for debugging
  console.warn('Auth callback received:', {
    code: code ? 'present' : 'missing',
    error,
    errorDescription,
    allParams: Object.fromEntries(searchParams.entries()),
    fullUrl: request.url
  })

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const response = NextResponse.redirect(`${origin}/login?error=oauth_error&message=${encodeURIComponent(errorDescription || error)}`)
    return response
  }

  if (code) {
    try {
      // Use Supabase Auth Helpers to persist the session via cookies
      const supabase = createRouteHandlerClient({ cookies })
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        // eslint-disable-next-line no-console
        console.error('Code exchange error:', exchangeError)
        const response = NextResponse.redirect(`${origin}/login?error=auth_error&message=${encodeURIComponent(exchangeError.message)}`)
        return response
      }

      if (data?.session) {
        const user = data.session.user
        let role = (user?.user_metadata?.role as string | undefined) || null
        // eslint-disable-next-line no-console
        console.warn('Session exchange succeeded for user:', user.id, 'role from metadata:', role)

        // If no role in metadata, check the profiles table
        if (!role) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('role, created_at')
              .eq('id', user.id)
              .single()
            
            if (!profileError && profileData?.role) {
              role = profileData.role
              // eslint-disable-next-line no-console
              console.warn('Found role in profiles table:', role)
            }
          } catch (e) {
            console.warn('Error fetching role from profiles table:', e)
          }
        }

        // Redirect to appropriate dashboard based on role
        const redirectPath = role === 'provider' || role === 'service-provider' ? '/provider' : '/dashboard'
        console.warn('Redirecting to:', redirectPath, 'based on role:', role)
        const response = NextResponse.redirect(`${origin}${redirectPath}`)
        return response
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unexpected error during auth callback:', error)
      const response = NextResponse.redirect(`${origin}/login?error=unexpected_error`)
      return response
    }
  }

  // Fallback: If no code, check if a session already exists
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: sess } = await supabase.auth.getSession()
    const session = sess?.session
    if (session?.user) {
      const user = session.user
      let role = (user?.user_metadata?.role as string | undefined) || null

      if (!role) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          if (profileData?.role) role = profileData.role
        } catch (_) {}
      }

      const redirectPath = role === 'provider' || role === 'service-provider' ? '/provider' : '/dashboard'
      const response = NextResponse.redirect(`${origin}${redirectPath}`)
      return response
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Fallback session check failed:', e)
  }

  // If no code and no session, redirect with error
  // eslint-disable-next-line no-console
  console.error('No authorization code received in callback')
  const response = NextResponse.redirect(`${origin}/login?error=missing_code&message=${encodeURIComponent('No authorization code received. Please try again.')}`)
  return response
}
