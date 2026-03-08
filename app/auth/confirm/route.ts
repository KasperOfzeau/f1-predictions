import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const next = requestUrl.searchParams.get('next') ?? '/'
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const safeNext = next.startsWith('/') ? next : '/'
  if (code) {
    const redirectUrl = new URL(safeNext, requestUrl.origin)
    redirectUrl.searchParams.set('code', code)
    return NextResponse.redirect(redirectUrl)
  }

  if (!tokenHash || type !== 'recovery') {
    return NextResponse.redirect(new URL('/login?resetError=1', requestUrl.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error) {
    return NextResponse.redirect(new URL('/login?resetError=1', requestUrl.origin))
  }

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin))
}
