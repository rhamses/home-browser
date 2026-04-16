import { normalizeFeedUrl } from './customNewsFeeds'
import type { NewsFeedsSchema } from './newsFeeds'

const STORAGE_KEY = 'home-browser-feeds_selected:v1'

export type SelectedFeedEntry = {
  slug: string
  url: string
}

function parse(raw: string | null): SelectedFeedEntry[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    const out: SelectedFeedEntry[] = []
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

function normalizedUrl(url: string): string {
  return normalizeFeedUrl(url) ?? url.trim()
}

export function loadSelectedNewsFeeds(): SelectedFeedEntry[] {
  if (typeof localStorage === 'undefined') return []
  return parse(localStorage.getItem(STORAGE_KEY))
}

export function replaceSelectedNewsFeeds(entries: SelectedFeedEntry[]): void {
  if (typeof localStorage === 'undefined') return
  const cleaned = entries
    .filter((x) => x.slug.trim() && x.url.trim())
    .map((x) => ({
      slug: x.slug.trim(),
      url: normalizedUrl(x.url),
    }))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
  } catch {
    /* quota */
  }
}

/**
 * Filtra o schema base para mostrar apenas feeds escolhidos no setup inicial.
 * Se não existir seleção guardada, mantém o schema original.
 */
export function applySelectedFeeds(schema: NewsFeedsSchema): NewsFeedsSchema {
  const selected = loadSelectedNewsFeeds()
  if (!selected.length) return schema

  const bySlug = new Map<string, Set<string>>()
  for (const item of selected) {
    if (!bySlug.has(item.slug)) bySlug.set(item.slug, new Set())
    bySlug.get(item.slug)!.add(normalizedUrl(item.url))
  }

  const feeds: Record<string, string[]> = {}
  for (const [slug, urls] of Object.entries(schema.feeds)) {
    const keep = bySlug.get(slug)
    if (!keep) continue
    const filtered = urls.filter((u) => keep.has(normalizedUrl(u)))
    if (filtered.length) feeds[slug] = filtered
  }

  const categories = schema.categories.filter((c) => (feeds[c.slug] ?? []).length > 0)
  return { categories, feeds }
}
