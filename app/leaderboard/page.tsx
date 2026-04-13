import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import Nav from '@/components/Nav'
import GlobalLeaderboard from '@/components/GlobalLeaderboard'
import { getPaginatedGlobalLeaderboard } from '@/lib/services/leaderboard'

const PAGE_SIZE = 25

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export const metadata: Metadata = {
  title: 'Global Leaderboard | The Prediction Paddock',
  description: 'View the full global ranking of all Prediction Paddock players.',
}

const getCachedLeaderboardPage = unstable_cache(
  async (page: number) => getPaginatedGlobalLeaderboard({ page, pageSize: PAGE_SIZE }),
  ['global-leaderboard-page'],
  { revalidate: 60 }
)

function parsePageParam(pageParam?: string) {
  const page = Number(pageParam)

  if (!Number.isFinite(page) || page < 1) {
    return 1
  }

  return Math.floor(page)
}

function getLeaderboardPageHref(page: number) {
  return page <= 1 ? '/leaderboard' : `/leaderboard?page=${page}`
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams
  const requestedPage = parsePageParam(pageParam)
  const leaderboard = await getCachedLeaderboardPage(requestedPage)
  const hasMultiplePages = leaderboard.totalPages > 1
  const startRank = leaderboard.totalEntries === 0 ? 0 : (leaderboard.page - 1) * leaderboard.pageSize + 1
  const endRank = leaderboard.totalEntries === 0
    ? 0
    : startRank + leaderboard.entries.length - 1

  return (
    <div className="min-h-screen bg-carbon-black">
      <Nav />

      <main className="max-w-5xl mx-auto px-6 py-10 sm:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Global leaderboard</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/65 sm:text-base">
              Browse the full season standings for every player in The Prediction Paddock.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border-2 border-f1-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-f1-red/20"
          >
            Back to home
          </Link>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white/60">
                {leaderboard.totalEntries === 0
                  ? 'No ranked players yet.'
                  : `Showing ranks ${startRank}-${endRank} of ${leaderboard.totalEntries} players`}
              </p>
            </div>

            {hasMultiplePages && (
              <div className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/70">
                Page {leaderboard.page} of {leaderboard.totalPages}
              </div>
            )}
          </div>

          <GlobalLeaderboard entries={leaderboard.entries} />

          {hasMultiplePages && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <div className="flex min-h-[42px] items-center">
                {leaderboard.hasPreviousPage && (
                  <Link
                    href={getLeaderboardPageHref(leaderboard.page - 1)}
                    className="inline-flex items-center justify-center rounded-full border-2 border-f1-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-f1-red/20"
                  >
                    Previous page
                  </Link>
                )}
              </div>

              <div className="flex min-h-[42px] items-center justify-end">
                {leaderboard.hasNextPage && (
                  <Link
                    href={getLeaderboardPageHref(leaderboard.page + 1)}
                    className="inline-flex items-center justify-center rounded-full border-2 border-f1-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-f1-red/20"
                  >
                    Next page
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
