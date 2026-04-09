export function getResultPageHref(
  sessionKey: number | null,
  username?: string | null
): string {
  if (sessionKey == null) return '#'

  const normalizedUsername = username?.trim().replace(/^@+/, '').toLowerCase()
  if (!normalizedUsername) {
    return `/results/${sessionKey}`
  }

  const searchParams = new URLSearchParams({ user: normalizedUsername })
  return `/results/${sessionKey}?${searchParams.toString()}`
}
