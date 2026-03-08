import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const next = requestUrl.searchParams.get('next') ?? '/'
  const code = requestUrl.searchParams.get('code')
  const safeNext = next.startsWith('/') ? next : '/'

  // PKCE flow: redirect to app with code so client can exchange for session (e.g. signup confirmation)
  if (code) {
    const redirectUrl = new URL(safeNext, requestUrl.origin)
    redirectUrl.searchParams.set('code', code)
    return NextResponse.redirect(redirectUrl)
  }

  // No code (e.g. old recovery link or invalid) → send to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
