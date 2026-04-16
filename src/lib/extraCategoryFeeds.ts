import { normalizeFeedUrl } from './customNewsFeeds'
import type { NewsFeedsSchema } from './newsFeeds'

const STORAGE_KEY = 'home-browser-extra-category-feeds:v1'

export type StoredExtraCategoryFeed = {
  id: string
  slug: string
  feedUrl: string
}

function parseStored(raw: string | null): StoredExtraCategoryFeed[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    const out: StoredExtraCategoryFeed[] = []
    for (const x of data) {
      if (x == null || typeof x !== 'object') continue
      const o = x as Record<string, unknown>
      if (
        typeof o.id === 'string' &&
        typeof o.slug === 'string' &&
        typeof o.feedUrl === 'string'
      ) {
        out.push({ id: o.id, slug: o.slug, feedUrl: o.feedUrl })
      }
    }
    return out
  } catch {
    return []
  }
}

export function loadExtraCategoryFeeds(): StoredExtraCategoryFeed[] {
  if (typeof localStorage === 'undefined') return []
  return parseStored(localStorage.getItem(STORAGE_KEY))
}

function saveExtraCategoryFeeds(list: StoredExtraCategoryFeed[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
}

function urlKey(u: string): string {
  return normalizeFeedUrl(u) ?? u.trim()
}

/**
 * Junta feeds extra às listas `feeds[slug]` (sem duplicar URL normalizada).
 * Ignora entradas cujo `slug` já não existe em `categories`.
 */
export function mergeExtraFeedsIntoSchema(schema: NewsFeedsSchema): NewsFeedsSchema {
  const categorySlugs = new Set(schema.categories.map((c) => c.slug))
  const feeds: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(schema.feeds)) {
    feeds[k] = [...v]
  }
  for (const entry of loadExtraCategoryFeeds()) {
    if (!categorySlugs.has(entry.slug)) continue
    const norm = urlKey(entry.feedUrl)
    if (!feeds[entry.slug]) feeds[entry.slug] = []
    const list = feeds[entry.slug]
    if (!list.some((existing) => urlKey(existing) === norm)) list.push(norm)
  }
  return { ...schema, feeds }
}

/**
 * Adiciona um URL de feed a uma categoria existente. Retorna false se URL inválida ou duplicada.
 */
export function addExtraCategoryFeed(slug: string, rawUrl: string): boolean {
  const feedUrl = normalizeFeedUrl(rawUrl)
  if (!feedUrl || !slug.trim()) return false
  const list = loadExtraCategoryFeeds()
  const key = urlKey(feedUrl)
  if (
    list.some(
      (e) => e.slug === slug && urlKey(e.feedUrl) === key,
    )
  ) {
    return false
  }
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  list.push({ id, slug, feedUrl })
  saveExtraCategoryFeeds(list)
  return true
}

export function removeExtraFeedsForSlugs(slugs: string[]): void {
  if (!slugs.length) return
  const drop = new Set(slugs)
  const next = loadExtraCategoryFeeds().filter((e) => !drop.has(e.slug))
  saveExtraCategoryFeeds(next)
}

/** Remove um feed extra por slug + URL (normalizado). Retorna true se removeu. */
export function removeExtraCategoryFeedsMatching(
  slug: string,
  rawUrl: string,
): boolean {
  const key = urlKey(rawUrl)
  const prev = loadExtraCategoryFeeds()
  const next = prev.filter(
    (e) => !(e.slug === slug && urlKey(e.feedUrl) === key),
  )
  if (next.length === prev.length) return false
  saveExtraCategoryFeeds(next)
  return true
}
