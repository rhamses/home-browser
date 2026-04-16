import type { FavoriteLink } from './bookmarksBar'

/** Chave atual (persiste entre sessões do navegador). */
const STORAGE_KEY = 'home-browser-local-favorites'

/** Chave legada — migrada uma vez para localStorage. */
const LEGACY_SESSION_KEY = 'home-browser-session-favorites'

function parseStored(raw: string | null): FavoriteLink[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    return data
      .filter(
        (x): x is FavoriteLink =>
          x != null &&
          typeof (x as FavoriteLink).id === 'string' &&
          typeof (x as FavoriteLink).title === 'string' &&
          typeof (x as FavoriteLink).url === 'string',
      )
      .map((x) => ({
        id: x.id,
        title: x.title,
        url: x.url,
      }))
  } catch {
    return []
  }
}

/** Migra dados antigos de sessionStorage → localStorage (uma vez). */
function migrateLegacySessionIfNeeded(): void {
  if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined')
    return
  if (localStorage.getItem(STORAGE_KEY)) return
  const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY)
  if (!legacy) return
  try {
    localStorage.setItem(STORAGE_KEY, legacy)
    sessionStorage.removeItem(LEGACY_SESSION_KEY)
  } catch {
    /* quota ou modo privado restrito */
  }
}

export function loadLocalFavorites(): FavoriteLink[] {
  if (typeof localStorage === 'undefined') return []
  migrateLegacySessionIfNeeded()
  return parseStored(localStorage.getItem(STORAGE_KEY))
}

export function saveLocalFavorites(items: FavoriteLink[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* quota exceeded, etc. */
  }
}

export function newLocalFavoriteId(): string {
  return `local-${crypto.randomUUID()}`
}

/** Favoritos adicionados pela extensão (prefixos atuais e legados). */
export function isExtensionFavoriteId(id: string): boolean {
  return id.startsWith('local-') || id.startsWith('sess-')
}

export function normalizeUserUrl(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  try {
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`
    const u = new URL(withProto)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.href
  } catch {
    return null
  }
}
