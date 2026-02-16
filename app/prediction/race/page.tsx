import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import { getNextEvent } from '@/lib/services/meetings'
import PredictionPageClient from './PredictionPageClient'

export const metadata: Metadata = {
  title: 'Make prediction',
  description: 'Predict the race result for the next Grand Prix',
}

export default async function PredictionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  } else {
    const nextEvent = await getNextEvent()
    if (!nextEvent) {
        redirect('/')
    }
  }

  return (
    <div className="min-h-screen bg-carbon-black">
      <Nav />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
       
      </main>
    </div>
  )
}
