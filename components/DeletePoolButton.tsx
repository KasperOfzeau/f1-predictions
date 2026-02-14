'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DeletePoolButtonProps {
  poolId: string
  poolName: string
}

export default function DeletePoolButton({ poolId, poolName }: DeletePoolButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    const { error: deleteError } = await supabase
      .from('pools')
      .delete()
      .eq('id', poolId)

    setLoading(false)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    // Redirect to dashboard
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:text-red-700 text-sm font-medium"
      >
        Delete pool
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Delete pool?</h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;<strong>{poolName}</strong>&quot;?
              This will remove all members, predictions, and data associated with this pool.
              <br /><br />
              <strong className="text-red-600">This action cannot be undone.</strong>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete pool'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
