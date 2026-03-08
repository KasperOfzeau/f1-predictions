import Link from 'next/link'
import Image from 'next/image'

const productLinks = [
  { href: '/', label: 'Home' },
  { href: '/pools/create', label: 'Create pool' },
]

const accountLinks = [
  { href: '/login', label: 'Login' },
  { href: '/register', label: 'Register' },
]

const legalLinks = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
]

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800 bg-[#0a0a0c]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand + about */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block focus:outline-none focus:ring-2 focus:ring-f1-red focus:ring-offset-2 focus:ring-offset-[#0a0a0c] rounded">
              <Image
                src="/logos/TPP_White.svg"
                alt="The Prediction Paddock"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-4 text-sm text-gray-400 max-w-xs leading-relaxed">
              Predict F1 race results, create pools with friends, and climb the leaderboard. For fun, for free.
            </p>
          </div>

          {/* The Paddock */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">The Paddock</h3>
            <ul className="mt-4 space-y-2">
              {productLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Account</h3>
            <ul className="mt-4 space-y-2">
              {accountLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Legal</h3>
            <ul className="mt-4 space-y-2">
              {legalLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} The Prediction Paddock. Made by{' '}
            <a
              href="https://github.com/KasperOfzeau"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-f1-red transition-colors"
            >
              KasperOfzeau
            </a>
          </p>
          <p className="text-amber-500/90">
            Site in development — things may occasionally go wrong.
          </p>
        </div>
      </div>
    </footer>
  )
}
