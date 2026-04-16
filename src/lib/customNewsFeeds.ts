import type { NewsCategory, NewsFeedsSchema } from './newsFeeds'

const STORAGE_KEY = 'home-browser-custom-news-feeds:v1'

export type StoredCustomFeed = {
  id: string
  name: string
  feedUrl: string
  slug: string
}

/** Ícone simples (RSS) para abas de feeds adicionados pelo utilizador. */
export const CUSTOM_FEED_TAB_ICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' aria-hidden='true'><circle cx='6.5' cy='17.5' r='2.5' fill='#F4511E'/><path fill='#FB8C00' d='M4 11a9 9 0 019 9h-2.2A6.8 6.8 0 004 13.2V11z'/><path fill='#FFB300' d='M4 5a15 15 0 0115 15h-2.3A12.7 12.7 0 004 7.3V5z'/></svg>"

function parseStored(raw: string | null): StoredCustomFeed[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    const out: StoredCustomFeed[] = []
    for (const x of data) {
      if (x == null || typeof x !== 'object') continue
      const o = x as Record<string, unknown>
      if (
        typeof o.id === 'string' &&
        typeof o.name === 'string' &&
        typeof o.feedUrl === 'string' &&
        typeof o.slug === 'string'
      ) {
        out.push({
          id: o.id,
          name: o.name,
          feedUrl: o.feedUrl,
          slug: o.slug,
        })
      }
    }
    return out
  } catch {
    return []
  }
}

export function loadCustomFeeds(): StoredCustomFeed[] {
  if (typeof localStorage === 'undefined') return []
  return parseStored(localStorage.getItem(STORAGE_KEY))
}

function saveCustomFeeds(list: StoredCustomFeed[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
}

export function normalizeFeedUrl(raw: string): string | null {
  let u = raw.trim()
  if (!u) return null
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`
  try {
    const url = new URL(u)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.href
  } catch {
    return null
  }
}

function newFeedSlug(): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  return `cf-${id.slice(0, 24)}`
}

/**
 * Adiciona um feed RSS/Atom à lista local. Falha silenciosamente se URL inválida.
 */
export function removeCustomFeedsWithSlugs(slugs: string[]): void {
  if (!slugs.length) return
  const drop = new Set(slugs)
  const prev = loadCustomFeeds()
  const next = prev.filter((c) => !drop.has(c.slug))
  if (next.length === prev.length) return
  saveCustomFeeds(next)
}

export function addCustomFeed(input: {
  name: string
  feedUrl: string
}): StoredCustomFeed | null {
  const feedUrl = normalizeFeedUrl(input.feedUrl)
  if (!feedUrl) return null
  const name = input.name.trim() || 'Meu feed'
  const slug = newFeedSlug()
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  const entry: StoredCustomFeed = { id, name, feedUrl, slug }
  const list = loadCustomFeeds()
  list.push(entry)
  saveCustomFeeds(list)
  return entry
}

export function mergeNewsFeedsWithCustom(
  base: NewsFeedsSchema,
  custom: StoredCustomFeed[],
): NewsFeedsSchema {
  const categories: NewsCategory[] = [...base.categories]
  const feeds: Record<string, string[]> = { ...base.feeds }
  for (const c of custom) {
    categories.push({
      name: c.name,
      slug: c.slug,
      iconSvg: CUSTOM_FEED_TAB_ICON_SVG,
    })
    feeds[c.slug] = [c.feedUrl]
  }
  return { categories, feeds }
}
