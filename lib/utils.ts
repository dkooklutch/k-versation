export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

export function generateUsername(): string {
  const num = Math.floor(Math.random() * 90000) + 10000
  return `K-versation_follower${num}`
}

export function getOrCreateUsername(): string {
  if (typeof window === 'undefined') return generateUsername()
  const stored = localStorage.getItem('kv_username')
  if (stored) return stored
  const username = generateUsername()
  localStorage.setItem('kv_username', username)
  return username
}

export function hasFollowed(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('kv_followed') === 'true'
}

export function setFollowed(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('kv_followed', 'true')
}

export function getUserReactions(episodeId: string): string[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(`kv_reactions_${episodeId}`)
  return stored ? JSON.parse(stored) : []
}

export function addUserReaction(episodeId: string, type: string): void {
  if (typeof window === 'undefined') return
  const current = getUserReactions(episodeId)
  if (!current.includes(type)) {
    localStorage.setItem(`kv_reactions_${episodeId}`, JSON.stringify([...current, type]))
  }
}

export function hasUserLiked(episodeId: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(`kv_liked_${episodeId}`) === 'true'
}

export function setUserLiked(episodeId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`kv_liked_${episodeId}`, 'true')
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
