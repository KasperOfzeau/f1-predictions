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
    <div className="bg-white shadow rounded-lg p-6">
      <div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Log in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/register" className="font-medium text-f1-red hover:text-f1-red-hover">
            create a new account
          </Link>
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        {notice && (
          <div
            className={[
              'px-4 py-3 rounded border',
              notice.type === 'success' && 'bg-green-50 border-green-200 text-green-700',
              notice.type === 'info' && 'bg-blue-50 border-blue-200 text-blue-700',
              notice.type === 'error' && 'bg-red-50 border-red-200 text-red-700',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {notice.message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="rounded-md shadow-sm -space-y-px">
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
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-f1-red focus:border-f1-red focus:z-10 sm:text-sm"
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
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-f1-red focus:border-f1-red focus:z-10 sm:text-sm"
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
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-f1-red hover:bg-f1-red-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-f1-red disabled:opacity-50"
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
    <div className="min-h-screen bg-carbon-black">
      <Nav />
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="px-4 py-6 sm:px-0">
          <Suspense fallback={
            <div className="bg-white shadow rounded-lg p-6 w-full max-w-md animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-10 bg-gray-200 rounded w-full mb-4" />
              <div className="h-10 bg-gray-200 rounded w-full" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}