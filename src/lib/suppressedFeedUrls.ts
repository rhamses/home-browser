import { normalizeFeedUrl } from './customNewsFeeds'
import type { NewsFeedsSchema } from './newsFeeds'

const STORAGE_KEY = 'home-browser-suppressed-feed-urls:v1'

export type SuppressedFeedEntry = {
  slug: string
  /** URL normalizada para comparação. */
  url: string
}

function parse(raw: string | null): SuppressedFeedEntry[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    const out: SuppressedFeedEntry[] = []
    for (const x of data) {
      if (x == null || typeof x !== 'object') continue
      const o = x as Record<string, unknown>
      if (typeof o.slug === 'string' && typeof o.url === 'string') {
        out.push({ slug: o.slug, url: o.url })
      }
    }
    return out
  } catch {
    return []
  }
}

export function loadSuppressedFeedUrls(): SuppressedFeedEntry[] {
  if (typeof localStorage === 'undefined') return []
  return parse(localStorage.getItem(STORAGE_KEY))
}

function saveSuppressed(list: SuppressedFeedEntry[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
}

function feedUrlKey(u: string): string {
  return normalizeFeedUrl(u) ?? u.trim()
}

/** Oculta um URL de feed de uma categoria (tipicamente origem JSON). */
export function suppressFeedUrl(slug: string, rawUrl: string): void {
  const url = feedUrlKey(rawUrl)
  const list = loadSuppressedFeedUrls()
  if (list.some((e) => e.slug === slug && e.url === url)) return
  list.push({ slug, url })
  saveSuppressed(list)
}

export function removeSuppressedFeedsForSlugs(slugs: string[]): void {
  if (!slugs.length) return
  const drop = new Set(slugs)
  const next = loadSuppressedFeedUrls().filter((e) => !drop.has(e.slug))
  saveSuppressed(next)
}

export function applySuppressedFeeds(schema: NewsFeedsSchema): NewsFeedsSchema {
  const suppressed = loadSuppressedFeedUrls()
  if (!suppressed.length) return schema
  const dropBySlug = new Map<string, Set<string>>()
  for (const { slug, url } of suppressed) {
    if (!dropBySlug.has(slug)) dropBySlug.set(slug, new Set())
    dropBySlug.get(slug)!.add(url)
  }
  const feeds: Record<string, string[]> = {}
  for (const [slug, urls] of Object.entries(schema.feeds)) {
    const drop = dropBySlug.get(slug)
    feeds[slug] = drop
      ? urls.filter((u) => !drop.has(feedUrlKey(u)))
      : [...urls]
  }
  return { ...schema, feeds }
}
