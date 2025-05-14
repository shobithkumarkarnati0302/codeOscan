
// This route is typically used for OAuth callbacks or email link verifications.
// For password-based signup with email confirmation, Supabase handles the token exchange
// when the user clicks the link, and then they can log in.
// If you use OAuth providers (Google, GitHub, etc.), this route is essential.

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
    console.error('Error exchanging code for session:', error.message)
  }

  // URL to redirect to after OAuth or email verification error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}