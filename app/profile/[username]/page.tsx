import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Nav from '@/components/Nav'
import { getRecentPredictionsForUser } from '@/lib/services/profilePredictions'
import ProfilePredictionsList from '@/components/ProfilePredictionsList'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('username', username.toLowerCase())
    .single()
  const displayName = profile?.username ? `@${profile.username}` : undefined
  return {
    title: profile ? `${displayName} | Profile` : 'Profile',
  }
}

export default async function ProfileByUsernamePage({ params }: PageProps) {
  const { username: usernameParam } = await params
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, full_name')
    .eq('username', usernameParam.toLowerCase())
    .single()

  if (error || !profile) {
    notFound()
  }

  const isOwnProfile = !!currentUser && currentUser.id === profile.id

  const displayLetter = profile.username?.charAt(0)?.toUpperCase() || '?'

  const recentPredictions = await getRecentPredictionsForUser(profile.id, 5)

  const currentSeasonYear = new Date().getMonth() === 0
    ? new Date().getFullYear() - 1
    : new Date().getFullYear()
  // Use admin client so we can read any user's season prediction (RLS only allows own rows with anon).
  const admin = createAdminClient()
  const { data: seasonPrediction } = await admin
    .from('season_predictions')
    .select('*')
    .eq('user_id', profile.id)
    .eq('season_year', currentSeasonYear)
    .maybeSingle()   

  return (
    <div className="min-h-screen bg-carbon-black">
      <Nav />

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Profile header with avatar */}
            <div className="bg-zinc-100 px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-zinc-300 shrink-0 ring-4 ring-white shadow-lg">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username ? `@${profile.username}` : 'Profile'}
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="96px"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-3xl font-semibold text-zinc-500">
                      {displayLetter}
                    </span>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-carbon-black">
                    @{profile.username}
                  </h1>
                </div>
              </div>
              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 text-sm font-medium text-f1-red hover:text-f1-red-hover transition-colors shrink-0"
                  title="Profile settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Profile settings
                </Link>
              )}
            </div>

            {/* Details – only show private fields for own profile */}
            <div className="px-6 py-6 space-y-4 border-t border-zinc-200">
              {profile.full_name && (
                <div>
                  <dt className="text-sm font-medium text-zinc-500">Full name</dt>
                  <dd className="mt-0.5 text-carbon-black">{profile.full_name}</dd>
                </div>
              )}
              {isOwnProfile && currentUser && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-zinc-500">Email</dt>
                    <dd className="mt-0.5 text-carbon-black">{currentUser.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-zinc-500">Member since</dt>
                    <dd className="mt-0.5 text-carbon-black">
                      {new Date(currentUser.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </dd>
                  </div>
                </>
              )}
            </div>

            {/* Predictions */}
            <div className="px-6 py-6 border-t border-zinc-200">
              <h2 className="text-xl font-bold text-carbon-black mb-4">
                {isOwnProfile ? 'My predictions' : 'Predictions'}
              </h2>
              <ProfilePredictionsList
                items={recentPredictions}
                seasonPrediction={seasonPrediction ?? null}
                seasonYear={currentSeasonYear}
                isOwnProfile={isOwnProfile}
              />
            </div>

            <div className="px-6 py-6 space-y-4 border-t border-zinc-200">
              <h2 className="text-xl font-bold text-carbon-black">Achievements</h2>
              <p className="text-zinc-600">Coming soon</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
