'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const AVATAR_BUCKET = 'avatars'
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB (original; after compression much smaller)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// Compression settings to limit storage
const AVATAR_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.15,           // max ~150 KB per avatar
  maxWidthOrHeight: 400,     // 400px is plenty for profile picture
  useWebWorker: true,
  fileType: 'image/jpeg' as const, // JPEG for best compression (no transparency needed)
}

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null) // local file preview
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      setError('Username must be 3-20 characters (letters, numbers, underscore only)')
      setLoading(false)
      return
    }

    // Check if username already exists (except own)
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

    // Update profile (including avatar_url if changed)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        username: username.toLowerCase(),
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess('Profile updated successfully!')
    setAvatarPreview(null)
    router.refresh()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please choose a JPEG, PNG, GIF or WebP image.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be smaller than 2MB.')
      return
    }

    setError(null)
    setUploadingAvatar(true)

    let fileToUpload: File
    try {
      fileToUpload = await imageCompression(file, AVATAR_COMPRESSION_OPTIONS)
    } catch (err) {
      setUploadingAvatar(false)
      e.target.value = ''
      setError('Could not resize image. Try a different photo.')
      return
    }

    const path = `${user.id}/avatar.jpg`

    // Remove any existing avatar file(s) in this user's folder so the new one replaces it
    const { data: existingFiles } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(user.id)
    if (existingFiles?.length) {
      const toRemove = existingFiles.map((f) => `${user.id}/${f.name}`)
      await supabase.storage.from(AVATAR_BUCKET).remove(toRemove)
    }

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, fileToUpload, { upsert: true, contentType: 'image/jpeg' })

    setUploadingAvatar(false)
    e.target.value = ''

    if (uploadError) {
      setError(uploadError.message)
      return
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
    // Append cache buster so the new image shows after save/reload (same path would otherwise serve cached old image)
    setAvatarUrl(`${data.publicUrl}?v=${Date.now()}`)
    setAvatarPreview(URL.createObjectURL(fileToUpload))
  }

  const displayAvatarUrl = avatarPreview || avatarUrl

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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile picture
        </label>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 shrink-0 ring-2 ring-gray-200">
            {displayAvatarUrl ? (
              <Image
                src={displayAvatarUrl}
                alt="Profile"
                fill
                className="object-cover"
                unoptimized
                sizes="80px"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-gray-500">
                {username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleAvatarChange}
              className="hidden"
              aria-label="Upload profile picture"
            />
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-sm font-medium text-f1-red hover:text-f1-red-hover border border-f1-red hover:border-f1-red-hover rounded-md disabled:opacity-50"
            >
              {uploadingAvatar ? 'Uploading...' : 'Upload photo'}
            </button>
            <p className="text-xs text-gray-500">
              JPEG, PNG, GIF or WebP. Max 2MB.
            </p>
          </div>
        </div>
      </div>

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
          Full name
        </label>
        <input
          id="full-name"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red focus:border-f1-red"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red focus:border-f1-red"
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
          className="flex-1 bg-f1-red hover:bg-f1-red-hover text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save changes'}
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