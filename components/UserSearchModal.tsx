'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface UserSearchModalProps {
  onClose: () => void
  onInvite: (userId: string) => void
  loading: boolean
  error: string | null
  success: string | null
}

export default function UserSearchModal({
  onClose,
  onInvite,
  loading,
  error,
  success
}: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const search = setTimeout(async () => {
      setSearching(true)

      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, email, avatar_url')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(10)

      setSearchResults(data || [])
      setSearching(false)
    }, 500)

    return () => clearTimeout(search)
  }, [searchQuery])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Invite users</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {searching && (
            <p className="text-center text-gray-500 py-4">Searching...</p>
          )}

          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="text-center text-gray-500 py-4">No users found</p>
          )}

          {searchResults.map((user) => (
            <div
              key={user.id}
              className="flex justify-between items-center p-3 hover:bg-gray-50 rounded"
            >
              <div>
                <p className="font-medium">@{user.username ?? ''}</p>
                <p className="text-sm text-gray-600">{user.full_name}</p>
              </div>
              <button
                onClick={() => onInvite(user.id)}
                disabled={loading}
                className="bg-f1-red hover:bg-f1-red-hover text-white px-4 py-1 rounded text-sm disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Invite'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
