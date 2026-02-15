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
    <div className="min-h-screen bg-carbon-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-f1-red mb-4">
            F1 Predictions
          </h1>
          <p className="text-xl text-zinc-200 mb-8">
            Predict race results and compete with your friends!
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-f1-red hover:bg-f1-red-hover text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="bg-carbon-black hover:bg-f1-black text-white border-2 border-f1-red px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}