/**
 * Server-only Supabase client with service role key.
 * Bypasses RLS – use only for admin tasks (e.g. backfilling other users' prediction points).
 * Never expose this client or the service role key to the client.
 */
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

function getAdminClientOrNull(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

/**
 * Returns admin client or throws if env vars are missing. Use when admin access is required.
 */
export function createAdminClient(): SupabaseClient {
  const client = getAdminClientOrNull()
  if (!client) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return client
}

/**
 * Returns admin client when available (e.g. on Vercel with SUPABASE_SERVICE_ROLE_KEY set).
 * Returns null otherwise so callers can fall back to the regular client.
 */
export function getAdminClientIfAvailable(): SupabaseClient | null {
  return getAdminClientOrNull()
}
