import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white border-gray-200 dark:bg-gray-900">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <h1 className="text-2xl font-bold font-formula1 text-red-500">F1 Predictions</h1>
        </a>
        <button
          data-collapse-toggle="navbar-default"
          type="button"
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          aria-controls="navbar-default"
          aria-expanded={isMenuOpen}
          onClick={toggleMenu}
        >
          <span className="sr-only">Open main menu</span>
          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
          </svg>
        </button>
        <div className={`w-full md:block md:w-auto ${isMenuOpen ? 'block' : 'hidden'}`} id="navbar-default">
          <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            <li>
              <a
                href="/"
                className={`block py-2 px-3 rounded md:bg-transparent md:p-0 text-white md:hover:text-red-700 ${router.pathname === '/' ? 'bg-red-700 hover:text-white-700' : ' hover:text-red-700 md:hover:bg-transparent'}`}
                aria-current="page"
              >
                2024 Predictions
              </a>
            </li>
            <li>
              <a
                href="/grid2025"
                className={`block py-2 px-3 rounded md:bg-transparent md:p-0 text-white md:hover:text-red-700 ${router.pathname === '/grid2025' ? 'bg-red-700 hover:text-white-700' : ' hover:text-red-700 md:hover:bg-transparent'}`}
              >
                2025 Grid Prediction
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
