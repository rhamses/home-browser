/**
 * Vídeo mais recente de uma playlist pública (YouTube Data API v3).
 *
 * Definir `VITE_YOUTUBE_API_KEY` no `.env` (chave de browser no Google Cloud Console,
 * com YouTube Data API v3 ativada). Sem chave, o widget mostra instruções.
 *
 * @see https://developers.google.com/youtube/v3/docs/playlistItems/list
 */

const CACHE_KEY = 'home-browser:yt-playlist-latest:v1'
export const YOUTUBE_PLAYLIST_LATEST_TTL_MS = 30 * 60 * 1000

/** Playlist "homebrowser" (URL partilhada pelo utilizador). */
export const HOMEBROWSER_PLAYLIST_ID =
  'PL_cyIxORBi9YVeiP0xq6H-_4iSYmT1R0j'

export type YoutubeLatestVideo = {
  title: string
  publishedAt: string
  publishedLabel: string
  watchUrl: string
  thumbnailUrl: string | null
  channelTitle: string
  videoId: string
}

type PlaylistItemsResponse = {
  items?: {
    snippet?: {
      title?: string
      publishedAt?: string
      channelTitle?: string
      thumbnails?: {
        medium?: { url?: string }
        default?: { url?: string }
      }
      resourceId?: { videoId?: string }
    }
  }[]
  error?: { message?: string }
}

function youtubeApiKey(): string | undefined {
  return import.meta.env.VITE_YOUTUBE_API_KEY?.trim() || undefined
}

export function hasYoutubeApiKey(): boolean {
  return Boolean(youtubeApiKey())
}

function readCache(playlistId: string): YoutubeLatestVideo | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      v: number
      playlistId: string
      payload: YoutubeLatestVideo & { fetchedAt: number }
    }
    if (parsed.v !== 1 || parsed.playlistId !== playlistId) return null
    if (Date.now() - parsed.payload.fetchedAt > YOUTUBE_PLAYLIST_LATEST_TTL_MS)
      return null
    const { fetchedAt: _, ...video } = parsed.payload
    return video
  } catch {
    return null
  }
}

function writeCache(playlistId: string, video: YoutubeLatestVideo): void {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        v: 1,
        playlistId,
        payload: { ...video, fetchedAt: Date.now() },
      }),
    )
  } catch {
    /* quota */
  }
}

function publishedLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

async function fetchLatestFromApi(playlistId: string): Promise<YoutubeLatestVideo> {
  const key = youtubeApiKey()
  if (!key) {
    throw new Error('Chave da API em falta')
  }
  const params = new URLSearchParams({
    part: 'snippet',
    maxResults: '50',
    playlistId,
    key,
  })
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
  const res = await fetch(url, { credentials: 'omit' })
  const json = (await res.json()) as PlaylistItemsResponse
  if (!res.ok) {
    const msg = json.error?.message ?? `${res.status} ${res.statusText}`
    throw new Error(msg)
  }
  const items = json.items ?? []
  if (!items.length) {
    throw new Error('Playlist vazia ou sem vídeos públicos.')
  }
  const withDates = items
    .map((it) => {
      const sn = it.snippet
      const id = sn?.resourceId?.videoId
      if (!sn?.title || !sn.publishedAt || !id) return null
      return {
        title: sn.title,
        publishedAt: sn.publishedAt,
        channelTitle: sn.channelTitle ?? '—',
        videoId: id,
        thumb:
          sn.thumbnails?.medium?.url?.trim() ||
          sn.thumbnails?.default?.url?.trim() ||
          null,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x != null)

  if (!withDates.length) {
    throw new Error('Não foi possível ler os itens da playlist.')
  }

  withDates.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
  const top = withDates[0]
  return {
    title: top.title,
    publishedAt: top.publishedAt,
    publishedLabel: publishedLabel(top.publishedAt),
    watchUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(top.videoId)}`,
    thumbnailUrl: top.thumb,
    channelTitle: top.channelTitle,
    videoId: top.videoId,
  }
}

export type YoutubeLatestLoadMeta = { fromCache: boolean }

export async function loadLatestPlaylistVideo(
  playlistId: string = HOMEBROWSER_PLAYLIST_ID,
): Promise<{ data: YoutubeLatestVideo; meta: YoutubeLatestLoadMeta } | null> {
  if (!hasYoutubeApiKey()) return null

  const cached = readCache(playlistId)
  if (cached) {
    return { data: cached, meta: { fromCache: true } }
  }
  const fresh = await fetchLatestFromApi(playlistId)
  writeCache(playlistId, fresh)
  return { data: fresh, meta: { fromCache: false } }
}
