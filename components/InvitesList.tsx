'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Invite {
  id: string
  pool_id: string
  from_user_id: string
  to_user_id: string
  status: string
  created_at: string
  pools: {
    id: string
    name: string
    description: string | null
  }
  from_profile: {
    id: string
    username: string
    full_name: string
  }
}

interface InvitesListProps {
  invites: Invite[]
}

export default function InvitesList({ invites }: InvitesListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAccept = async (invite: Invite) => {
    setLoading(invite.id)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Step 1: Add user to pool
    const { error: memberError } = await supabase
      .from('pool_members')
      .insert({
        pool_id: invite.pool_id,
        user_id: user.id,
        role: 'member',
      })

    if (memberError) {
      setError(memberError.message)
      setLoading(null)
      return
    }

    // Step 2: Update invite status
    const { error: updateError } = await supabase
      .from('invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id)

    setLoading(null)

    if (updateError) {
      setError(updateError.message)
      return
    }

    // Redirect to pool
    router.push(`/pools/${invite.pool_id}`)
    router.refresh()
  }

  const handleDecline = async (inviteId: string) => {
    setLoading(inviteId)
    setError(null)

    const { error: updateError } = await supabase
      .from('invites')
      .update({ status: 'declined' })
      .eq('id', inviteId)

    setLoading(null)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.refresh()
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {invites.map((invite) => (
        <div
          key={invite.id}
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {invite.pools.name}
              </h3>
              {invite.pools.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {invite.pools.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <span>Invited by</span>
                  <span className="font-medium text-gray-700">
                    @{invite.from_profile.username}
                  </span>
                </div>
                <span>•</span>
                <span>{new Date(invite.created_at).toLocaleDateString('en-US')}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(invite)}
                disabled={loading === invite.id}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === invite.id ? 'Accepting...' : 'Accept'}
              </button>
              <button
                onClick={() => handleDecline(invite.id)}
                disabled={loading === invite.id}
                className="flex-1 sm:flex-none bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
