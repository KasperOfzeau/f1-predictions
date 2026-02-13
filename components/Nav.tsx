import Link from 'next/link'
import Image from 'next/image'

interface NavProps {
  username?: string | null
  avatarUrl?: string | null
  fullName?: string | null
}

export default function Nav({ username, avatarUrl, fullName }: NavProps) {
  const displayLetter = fullName?.charAt(0)?.toUpperCase() || username?.charAt(0)?.toUpperCase() || '?'

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard">
              <h1 className="text-xl font-bold text-[#ED1131]">F1 Predictions</h1>
            </Link>
          </div>
          {username && (
            <Link
              href="/settings"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0 ring-2 ring-gray-200">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="32px"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-500">
                    {displayLetter}
                  </span>
                )}
              </div>
              @{username}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
