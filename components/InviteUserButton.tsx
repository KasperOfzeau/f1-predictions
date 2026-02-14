'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import UserSearchModal from './UserSearchModal'

interface InviteUserButtonProps {
  poolId: string
}

export default function InviteUserButton({ poolId }: InviteUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()

  const handleInvite = async (userId: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    // Check if user is already member
    const { data: existingMember } = await supabase
      .from('pool_members')
      .select('id')
      .eq('pool_id', poolId)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      setError('User is already a member of this pool')
      setLoading(false)
      return
    }

    // Check if invite already exists
    const { data: existingInvite } = await supabase
      .from('invites')
      .select('id, status')
      .eq('pool_id', poolId)
      .eq('to_user_id', userId)
      .single()

    if (existingInvite) {
      if (existingInvite.status === 'pending') {
        setError('Invite already sent to this user')
      } else {
        setError('This user has already received an invite')
      }
      setLoading(false)
      return
    }

    // Create invite
    const { error: inviteError } = await supabase
      .from('invites')
      .insert({
        pool_id: poolId,
        from_user_id: user.id,
        to_user_id: userId,
        status: 'pending',
      })

    setLoading(false)

    if (inviteError) {
      setError(inviteError.message)
      return
    }

    setSuccess('Invite sent successfully!')
    setTimeout(() => {
      setSuccess(null)
      setIsOpen(false)
    }, 2000)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
      >
        Invite users
      </button>

      {isOpen && (
        <UserSearchModal
          onClose={() => setIsOpen(false)}
          onInvite={handleInvite}
          loading={loading}
          error={error}
          success={success}
        />
      )}
    </>
  )
}
