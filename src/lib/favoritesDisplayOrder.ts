import type { FavoriteLink } from './bookmarksBar'

const STORAGE_KEY = 'home-browser-favorites-display-order:v1'

function parseOrder(raw: string | null): string[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    return data.filter((x): x is string => typeof x === 'string' && x.length > 0)
  } catch {
    return []
  }
}

export function loadFavoriteDisplayOrder(): string[] {
  if (typeof localStorage === 'undefined') return []
  return parseOrder(localStorage.getItem(STORAGE_KEY))
}

export function saveFavoriteDisplayOrder(ids: string[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    /* quota */
  }
}

/**
 * Aplica a ordem guardada; ids desconhecidos ficam no fim, na ordem de `links`.
 */
export function sortFavoritesBySavedOrder(
  links: FavoriteLink[],
  orderIds: string[],
): FavoriteLink[] {
  const byId = new Map(links.map((l) => [l.id, l]))
  const seen = new Set<string>()
  const out: FavoriteLink[] = []
  for (const id of orderIds) {
    const l = byId.get(id)
    if (l && !seen.has(id)) {
      out.push(l)
      seen.add(id)
    }
  }
  for (const l of links) {
    if (!seen.has(l.id)) out.push(l)
  }
  return out
}
