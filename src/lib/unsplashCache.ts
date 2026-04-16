import { fetchNatureBackground, type NaturePhoto } from './unsplash'

const STORAGE_KEY = 'home-browser-unsplash-nature-cache'

/** Duração do cache da imagem de fundo (30 minutos). */
export const UNSPLASH_BG_CACHE_TTL_MS = 30 * 60 * 1000

type CachedPayload = {
  photo: NaturePhoto
  /** Timestamp em ms (Date.now()) após o qual o cache expira. */
  expiresAt: number
}

function isNaturePhoto(x: unknown): x is NaturePhoto {
  if (x == null || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.imageUrl === 'string' &&
    typeof o.photographerName === 'string' &&
    typeof o.photographerProfileUrl === 'string' &&
    typeof o.photoPageUrl === 'string'
  )
}

function readRaw(): CachedPayload | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as unknown
    if (data == null || typeof data !== 'object') return null
    const o = data as Record<string, unknown>
    if (typeof o.expiresAt !== 'number' || !isNaturePhoto(o.photo)) return null
    return { photo: o.photo, expiresAt: o.expiresAt }
  } catch {
    return null
  }
}

/** Devolve a foto em cache se ainda não expirou; caso contrário `null`. */
export function readValidUnsplashBackgroundCache(): NaturePhoto | null {
  const entry = readRaw()
  if (!entry) return null
  if (Date.now() >= entry.expiresAt) return null
  return entry.photo
}

export function writeUnsplashBackgroundCache(photo: NaturePhoto): void {
  if (typeof localStorage === 'undefined') return
  const payload: CachedPayload = {
    photo,
    expiresAt: Date.now() + UNSPLASH_BG_CACHE_TTL_MS,
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* quota ou armazenamento bloqueado */
  }
}

/**
 * Usa localStorage se a entrada existir e não tiver expirado (30 min);
 * senão chama a API Unsplash e grava o novo resultado.
 */
export async function loadNaturePhotoWithCache(): Promise<NaturePhoto | null> {
  const cached = readValidUnsplashBackgroundCache()
  if (cached) return cached

  const fresh = await fetchNatureBackground()
  if (fresh) writeUnsplashBackgroundCache(fresh)
  return fresh
}
