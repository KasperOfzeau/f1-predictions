'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function loginWithEmailOrUsername(
  usernameOrEmail: string,
  password: string
): Promise<{ error: string | null }> {
  const trimmed = usernameOrEmail.trim()
  if (!trimmed || !password) {
    return { error: 'Email/username and password are required.' }
  }

  let email: string

  if (trimmed.includes('@')) {
    email = trimmed
  } else {
    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('username', trimmed.toLowerCase())
      .maybeSingle()

    if (profileError || !profile) {
      return { error: 'Invalid username or password.' }
    }

    const { data: authUser, error: userError } = await admin.auth.admin.getUserById(profile.id)
    if (userError || !authUser?.user?.email) {
      return { error: 'Invalid username or password.' }
    }
    email = authUser.user.email
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }
  return { error: null }
}
