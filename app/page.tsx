import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Home",
  description: "Predict F1 race results and compete with your friends in pools",
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-[#ED1131] mb-4">
            F1 Predictions
          </h1>
          <p className="text-xl text-gray-900 mb-8">
            Predict race results and compete with your friends!
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg text-lg font-semibold"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}