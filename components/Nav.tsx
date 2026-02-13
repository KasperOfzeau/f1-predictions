import Link from 'next/link'

interface NavProps {
  username?: string | null
}

export default function Nav({ username }: NavProps) {
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
            <div className="flex items-center gap-4">
              <Link
               href="/dashboard"
               className="text-sm text-gray-600 hover:text-gray-900">
                @{username}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
