'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      setError('Username must be 3-20 characters (letters, numbers and _ only)')
      setLoading(false)
      return
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single()

    if (existingUser) {
      setError('This username is already in use')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username.toLowerCase(),
        },
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (data.user) {
      if (data.user.identities?.length === 0) {
        setError('This email address is already in use')
      } else {
        router.push('/login?registered=1')
      }
    }
  }

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
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-f1-red transition-colors hover:text-white"
                >
                  Log in here
                </Link>
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
              <div className="space-y-8">
                <div>
                  <h2 className="text-center text-3xl font-semibold text-white">
                    Create an account
                  </h2>
                  <p className="mt-3 text-center text-sm text-white/60">
                    Or{' '}
                    <Link href="/login" className="font-semibold text-f1-red transition-colors hover:text-white">
                      log in if you already have an account
                    </Link>
                  </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="rounded-2xl border border-f1-red/30 bg-f1-red/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label htmlFor="full-name" className="sr-only">
                  Full name
                </label>
                <input
                  id="full-name"
                  name="name"
                  type="text"
                  required
                  className="block w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-f1-red focus:outline-none"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-f1-red focus:outline-none"
                  placeholder="Username (3-20 characters)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  pattern="[a-zA-Z0-9_]{3,20}"
                />
                <p className="mt-2 text-xs text-white/45">
                  Letters, numbers and underscore (_) only
                </p>
              </div>

              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-f1-red focus:outline-none"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-f1-red focus:outline-none"
                  placeholder="Password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                />
              </div>
            </div>

            <p className="text-center text-xs text-white/45">
              By registering, you agree to our{' '}
              <Link href="/terms" className="font-semibold text-f1-red transition-colors hover:text-white">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="font-semibold text-f1-red transition-colors hover:text-white">Privacy Policy</Link>.
            </p>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-full border-2 border-f1-red px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-f1-red/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Register'}
              </button>
            </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}