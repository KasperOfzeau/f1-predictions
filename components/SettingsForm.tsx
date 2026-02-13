'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
}

interface SettingsFormProps {
  user: User
  profile: Profile | null
}

export default function SettingsForm({ user, profile }: SettingsFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Valideer username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      setError('Username must be 3-20 characters (letters, numbers, underscore only)')
      setLoading(false)
      return
    }

    // Check of username al bestaat (behalve je eigen)
    if (username.toLowerCase() !== profile?.username?.toLowerCase()) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .neq('id', user.id)
        .single()

      if (existingUser) {
        setError('This username is already taken')
        setLoading(false)
        return
      }
    }

    // Update profiel
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        username: username.toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess('Profile updated successfully!')
    router.refresh()
  }

  return (
    <form onSubmit={handleUpdateProfile} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          disabled
          value={user.email}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">
          Email cannot be changed
        </p>
      </div>

      <div>
        <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <input
          id="full-name"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
          Username
        </label>
        <input
          id="username"
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          pattern="[a-zA-Z0-9_]{3,20}"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="your_username"
        />
        <p className="mt-1 text-xs text-gray-500">
          3-20 characters, letters, numbers, and underscore only
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}