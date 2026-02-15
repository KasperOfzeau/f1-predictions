'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Member {
  id: string
  user_id: string
  role: string
  joined_at: string
  profiles: {
    id: string
    username: string
    full_name: string
    avatar_url?: string | null
  }
}

interface PoolMembersListProps {
  members: Member[]
  isAdmin: boolean
  poolId: string
  currentUserId?: string
  /** Season points per user_id (current year). When provided, the points column is shown. */
  seasonPointsByUser?: Record<string, number>
}

export default function PoolMembersList({ members, isAdmin, poolId, currentUserId, seasonPointsByUser }: PoolMembersListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the pool?')) {
      return
    }

    setRemovingId(memberId)
    setError(null)

    const { error: deleteError } = await supabase
      .from('pool_members')
      .delete()
      .eq('id', memberId)

    setRemovingId(null)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    router.refresh()
  }

  const getDisplayLetter = (member: Member) => {
    return member.profiles.full_name?.charAt(0)?.toUpperCase()
      || member.profiles.username?.charAt(0)?.toUpperCase()
      || '?'
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {members.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No members yet</p>
      ) : (
        members.map((member) => {
          const isCurrentUser = member.user_id === currentUserId
          const canRemove = isAdmin && !isCurrentUser && member.role !== 'admin'

          return (
            <div
              key={member.id}
              className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                  {member.profiles.avatar_url ? (
                    <Image
                      src={member.profiles.avatar_url}
                      alt={member.profiles.username}
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="40px"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-500">
                      {getDisplayLetter(member)}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">
                      @{member.profiles.username}
                    </p>
                    {member.role === 'admin' && (
                      <span className="text-xs bg-red-100 text-f1-red px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                    {isCurrentUser && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        You
                      </span>
                    )}
                    {canRemove && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.user_id)}
                        disabled={removingId === member.id}
                        title="Remove member from pool"
                        className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {removingId === member.id ? 'Removing…' : 'Remove'}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{member.profiles.full_name}</p>
                </div>
              </div>

              {seasonPointsByUser && (
                <div className="text-right shrink-0">
                  <p className="font-bold text-lg text-gray-900">
                    {seasonPointsByUser[member.user_id] ?? 0}
                  </p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
