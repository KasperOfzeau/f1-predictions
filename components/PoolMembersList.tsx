'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

const supabase = createClient()

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
  const hasDesktopRemoveButton = isAdmin && members.some(
    (member) => member.user_id !== currentUserId && member.role !== 'admin'
  )

  const handleRemoveMember = async (memberId: string) => {
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
    return member.profiles.username?.charAt(0)?.toUpperCase() || '?'
  }

  return (
    <div className={`space-y-2 ${hasDesktopRemoveButton ? 'sm:pr-12' : ''}`}>
      {error && (
        <div className="mb-4 rounded-2xl border border-f1-red/30 bg-f1-red/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {members.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/50">No members yet</p>
      ) : (
        members.map((member) => {
          const isCurrentUser = member.user_id === currentUserId
          const canRemove = isAdmin && !isCurrentUser && member.role !== 'admin'
          const points = seasonPointsByUser?.[member.user_id] ?? 0

          return (
            <div key={member.id} className="relative">
              <div className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/6">
                <div className="grid min-h-18 grid-cols-[minmax(0,1fr)_4.75rem] items-center gap-4">
                  <Link
                    href={`/profile/${encodeURIComponent(member.profiles.username)}`}
                    className="flex min-w-0 flex-1 items-center gap-4 hover:opacity-90"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                      {member.profiles.avatar_url ? (
                        <Image
                          src={member.profiles.avatar_url}
                          alt={member.profiles.username}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white/70">
                          {getDisplayLetter(member)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-white">
                          @{member.profiles.username}
                        </p>
                        {member.role === 'admin' && (
                          <span className="rounded-full border border-f1-red/20 bg-f1-red/15 px-2.5 py-1 text-xs text-f1-red">
                            Admin
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-xs text-white/60">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {seasonPointsByUser && (
                    <div className="w-19 shrink-0 text-right">
                      <p className="text-lg font-bold tabular-nums text-white">
                        {points}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">points</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => canRemove && handleRemoveMember(member.id)}
                disabled={!canRemove || removingId === member.id}
                title={canRemove ? 'Remove member from pool' : undefined}
                aria-label={canRemove ? 'Remove member from pool' : undefined}
                className={[
                  'absolute top-1/2 -right-11 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors sm:flex',
                  canRemove
                    ? 'text-white/35 hover:bg-f1-red/10 hover:text-red-200 disabled:pointer-events-none disabled:opacity-50'
                    : 'pointer-events-none opacity-0',
                ].join(' ')}
              >
                {removingId === member.id ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="9" className="opacity-25" stroke="currentColor" strokeWidth="2" />
                    <path d="M21 12a9 9 0 0 0-9-9" className="opacity-90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M9 3h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M7 7l1 11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}
