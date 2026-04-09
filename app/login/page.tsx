'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { loginWithEmailOrUsername } from '@/lib/actions/auth'

type Notice = {
  type: 'info' | 'success' | 'error'
  message: string
}

function getNoticeFromSearchParams(searchParams: ReturnType<typeof useSearchParams>): Notice | null {
  if (searchParams.get('registered') === '1') {
    return {
      type: 'info',
      message: 'Please check your email and click the confirmation link before logging in.',
    }
  }

  return null
}

function LoginForm() {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [notice] = useState<Notice | null>(() => getNoticeFromSearchParams(searchParams))

  useEffect(() => {
    if (notice) {
      router.replace('/login', { scroll: false })
    }
  }, [notice, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await loginWithEmailOrUsername(emailOrUsername, password)

    setLoading(false)

    if (error) {
      setError(error)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div>
      <div>
        <h2 className="text-center text-3xl font-semibold text-white">
          Log in to your account
        </h2>
        <p className="mt-3 text-center text-sm text-white/60">
          Or{' '}
          <Link href="/register" className="font-semibold text-f1-red transition-colors hover:text-white">
            create a new account
          </Link>
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        {notice && (
          <div
            className={[
              'rounded-2xl border px-4 py-3 text-sm',
              notice.type === 'success' && 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
              notice.type === 'info' && 'border-sky-400/30 bg-sky-500/10 text-sky-200',
              notice.type === 'error' && 'border-f1-red/30 bg-f1-red/10 text-red-100',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {notice.message}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-f1-red/30 bg-f1-red/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label htmlFor="email-or-username" className="sr-only">
              Email or username
            </label>
            <input
              id="email-or-username"
              name="emailOrUsername"
              type="text"
              autoComplete="username email"
              required
              className="block w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-f1-red focus:outline-none"
              placeholder="Email or username"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="block w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-f1-red focus:outline-none"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-full border-2 border-f1-red px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-f1-red/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Log in'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-carbon-black text-white">
      <Nav />
      <main>
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_0.95fr] lg:gap-14 lg:py-16">
          <div className="order-2 max-w-xl lg:order-1">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] sm:text-xs uppercase tracking-[0.24em] text-white/70 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-f1-red" />
                Join The Paddock
              </div>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
                Ready for <span className="text-f1-red">race weekend</span>?
              </h1>
              <p className="max-w-xl text-base text-white/70 sm:text-lg">
                Make your predictions, join private pools and compete with friends throughout the season.
              </p>
              <p className="text-sm text-white/60">
                Don&apos;t have an account yet?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-f1-red transition-colors hover:text-white"
                >
                  Register here
                </Link>
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
              <Suspense fallback={
                <div className="w-full animate-pulse space-y-4">
                  <div className="mx-auto h-8 w-3/4 rounded bg-white/10" />
                  <div className="mx-auto h-4 w-full rounded bg-white/10" />
                  <div className="h-12 w-full rounded-2xl bg-white/10" />
                  <div className="h-12 w-full rounded-2xl bg-white/10" />
                  <div className="h-12 w-full rounded-full bg-white/10" />
                </div>
              }>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}