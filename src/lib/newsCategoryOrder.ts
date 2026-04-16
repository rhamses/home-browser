import type { NewsCategory } from './newsFeeds'

const STORAGE_KEY = 'home-browser-news-category-order:v1'

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

export function loadCategoryOrder(): string[] {
  if (typeof localStorage === 'undefined') return []
  return parseOrder(localStorage.getItem(STORAGE_KEY))
}

export function saveCategoryOrder(slugs: string[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
  } catch {
    /* quota */
  }
}

/**
 * Aplica a ordem guardada: slugs desconhecidos ou novos ficam no fim,
 * na ordem em que aparecem em `categories`.
 */
export function orderNewsCategories(
  categories: NewsCategory[],
  savedOrder: string[],
): NewsCategory[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]))
  const seen = new Set<string>()
  const out: NewsCategory[] = []
  for (const slug of savedOrder) {
    const c = bySlug.get(slug)
    if (c) {
      out.push(c)
      seen.add(slug)
    }
  }
  for (const c of categories) {
    if (!seen.has(c.slug)) out.push(c)
  }
  return out
}
