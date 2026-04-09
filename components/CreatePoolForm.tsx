'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()

export default function CreatePoolForm() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    const { data: pool, error: poolError } = await supabase
      .from('pools')
      .insert({
        name,
        description: description || null,
        created_by: user.id,
      })
      .select()
      .single()

    setLoading(false)

    if (poolError) {
      console.error('Full error:', poolError)
      setError(`${poolError.message}${poolError.hint ? ` - ${poolError.hint}` : ''}`)
      return
    }

    // Redirect to pool detail page
    router.push(`/pools/${pool.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-f1-red/30 bg-f1-red/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-white/85">
          Pool Name *
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-f1-red focus:outline-none"
          maxLength={50}
        />
        <p className="mt-2 text-xs text-white/45">
          e.g., GP2 Engine support group, No Michael No That&apos;s So Not Right, DTS Believers Anonymous
        </p>
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium text-white/85">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="block w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-f1-red focus:outline-none"
          placeholder="e.g. Winner gets a Lego set!"
          maxLength={500}
        />
        <p className="mt-2 text-xs text-white/45">
          {description.length}/500 characters
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-full bg-f1-red px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-f1-red-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create pool'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/25 hover:bg-white/6"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}