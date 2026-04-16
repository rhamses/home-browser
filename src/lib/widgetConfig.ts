export type WidgetsConfig = {
  youtubePlaylistId: string | null
  youtubePlaylistUrl: string | null
}

const STORAGE_KEY = 'home-browser-widgets-config:v1'

function isRecord(x: unknown): x is Record<string, unknown> {
  return x != null && typeof x === 'object' && !Array.isArray(x)
}

export function loadWidgetsConfig(): WidgetsConfig {
  if (typeof localStorage === 'undefined') {
    return { youtubePlaylistId: null, youtubePlaylistUrl: null }
  }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { youtubePlaylistId: null, youtubePlaylistUrl: null }
  try {
    const data = JSON.parse(raw) as unknown
    if (!isRecord(data)) return { youtubePlaylistId: null, youtubePlaylistUrl: null }
    const youtubePlaylistId =
      typeof data.youtubePlaylistId === 'string' && data.youtubePlaylistId.trim()
        ? data.youtubePlaylistId.trim()
        : null
    const youtubePlaylistUrl =
      typeof data.youtubePlaylistUrl === 'string' && data.youtubePlaylistUrl.trim()
        ? data.youtubePlaylistUrl.trim()
        : null
    return { youtubePlaylistId, youtubePlaylistUrl }
  } catch {
    return { youtubePlaylistId: null, youtubePlaylistUrl: null }
  }
}

export function saveWidgetsConfig(cfg: WidgetsConfig): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
  } catch {
    /* quota */
  }
}

export function parseYoutubePlaylistIdFromUrl(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`)
    const list = u.searchParams.get('list')?.trim()
    if (list) return list
    return null
  } catch {
    return null
  }
}

