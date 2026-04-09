'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import Modal from './Modal'

const supabase = createClient()

interface UserSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onInvite: (userId: string) => void
  loading: boolean
  error: string | null
  success: string | null
}

export default function UserSearchModal({
  isOpen,
  onClose,
  onInvite,
  loading,
  error,
  success,
}: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const hasSearchQuery = searchQuery.length >= 2
  const visibleResults = hasSearchQuery ? searchResults : []

  useEffect(() => {
    if (!hasSearchQuery) {
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
  }, [hasSearchQuery, searchQuery])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite users" size="md">
      {error && (
        <div className="mb-4 rounded-2xl border border-f1-red/20 bg-f1-red/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by username or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-f1-red focus:outline-none"
        />
      </div>

      <div className="max-h-96 overflow-y-auto">
        {searching && (
          <p className="text-center text-gray-500 py-4">Searching...</p>
        )}

        {!searching && hasSearchQuery && visibleResults.length === 0 && (
          <p className="text-center text-gray-500 py-4">No users found</p>
        )}

        {visibleResults.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-2xl p-3 transition-colors hover:bg-gray-50"
          >
            <div>
              <p className="font-medium text-gray-900">@{user.username ?? ''}</p>
              <p className="text-sm text-gray-600">{user.full_name}</p>
            </div>
            <button
              type="button"
              data-user-id={user.id}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const userId = (e.currentTarget as HTMLButtonElement).dataset.userId
                if (userId) onInvite(userId)
              }}
              disabled={loading}
              className="rounded-full bg-f1-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-f1-red-hover disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Invite'}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  )
}
