import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreatePoolForm from '@/components/CreatePoolForm'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: "Create Pool",
}

export default async function CreatePoolPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-carbon-black text-white">
      <Nav />

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_0.95fr] lg:gap-14 lg:py-16">
          <div className="order-2 max-w-xl space-y-5 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white/70 backdrop-blur-sm sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-f1-red" />
              Start A New Rivalry
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
              Create your own <span className="text-f1-red">pool</span>
            </h1>
            <p className="max-w-xl text-base text-white/70 sm:text-lg">
              Set up a private league for your friends, give it a name with some paddock energy and keep the season standings in one place.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Private competition</p>
                <p className="mt-2 text-sm text-white/60">Invite friends and keep your own mini championship running all season.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Flexible naming</p>
                <p className="mt-2 text-sm text-white/60">Give your pool a serious title or full chaos energy, both work.</p>
              </div>
            </div>
          </div>

          <div className="order-1 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8 lg:order-2">
            <div className="mb-6">
              <h2 className="text-3xl font-semibold text-white">Create new pool</h2>
              <p className="mt-3 text-sm text-white/60">
                Pick a name, add an optional description and you&apos;re ready to invite the grid.
              </p>
            </div>
            <CreatePoolForm />
          </div>
        </section>
      </main>
    </div>
  )
}