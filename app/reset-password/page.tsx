'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const initializeRecovery = async () => {
      const code = searchParams.get('code')

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (!isMounted) {
          return
        }

        if (exchangeError) {
          setError('This password reset link is invalid or has expired.')
          setCheckingSession(false)
          return
        }

        setError(null)
        setCheckingSession(false)
        router.replace('/reset-password', { scroll: false })
        return
      }

      const { data, error: sessionError } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (sessionError || !data.session) {
        setError('This password reset link is invalid or has expired.')
      }

      setCheckingSession(false)
    }

    initializeRecovery()

    return () => {
      isMounted = false
    }
  }, [router, searchParams, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    await supabase.auth.signOut()
    router.push('/login?reset=1')
  }

  return (
    <div className="min-h-screen bg-carbon-black">
      <Nav />
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 bg-white shadow rounded-lg p-8">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Choose a new password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Set a new password for your account.
            </p>
          </div>

          {checkingSession ? (
            <div className="text-center text-sm text-gray-600">
              Verifying your reset link...
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="rounded-md shadow-sm space-y-3">
                <div>
                  <label htmlFor="password" className="sr-only">
                    New password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-f1-red focus:border-f1-red focus:z-10 sm:text-sm"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="sr-only">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-f1-red focus:border-f1-red focus:z-10 sm:text-sm"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-f1-red hover:bg-f1-red-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-f1-red disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Update password'}
                </button>

                <Link
                  href="/login"
                  className="block text-center text-sm font-medium text-f1-red hover:text-f1-red-hover"
                >
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
