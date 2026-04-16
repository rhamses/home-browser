import type { NewsFeedsSchema } from './newsFeeds'
import { loadCustomFeeds, removeCustomFeedsWithSlugs } from './customNewsFeeds'
import { removeExtraFeedsForSlugs } from './extraCategoryFeeds'
import { removeSuppressedFeedsForSlugs } from './suppressedFeedUrls'

const STORAGE_KEY = 'home-browser-news-category-removed:v1'

function parseRemoved(raw: string | null): string[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    return data.filter((x): x is string => typeof x === 'string' && x.length > 0)
  } catch {
    return []
  }
}

export function loadRemovedCategorySlugs(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set()
  return new Set(parseRemoved(localStorage.getItem(STORAGE_KEY)))
}

export function addRemovedCategorySlugs(slugs: string[]): void {
  if (!slugs.length || typeof localStorage === 'undefined') return
  const cur = loadRemovedCategorySlugs()
  for (const s of slugs) cur.add(s)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...cur]))
  } catch {
    /* quota */
  }
}

export function stripRemovedCategories(
  schema: NewsFeedsSchema,
  removed: Set<string>,
): NewsFeedsSchema {
  if (!removed.size) return schema
  const categories = schema.categories.filter((c) => !removed.has(c.slug))
  const feeds: Record<string, string[]> = { ...schema.feeds }
  for (const s of removed) delete feeds[s]
  return { categories, feeds }
}

/**
 * Remove feeds custom da lista e marca categorias do JSON como ocultas.
 * `removedSlugs` são categorias que existiam ao abrir o diálogo e já não estão na lista ao guardar.
 */
export function persistCategoryDeletions(removedSlugs: string[]): void {
  if (!removedSlugs.length) return
  const prevCustom = loadCustomFeeds()
  const customSlugs = new Set(prevCustom.map((c) => c.slug))
  removeCustomFeedsWithSlugs(removedSlugs)
  removeExtraFeedsForSlugs(removedSlugs)
  removeSuppressedFeedsForSlugs(removedSlugs)
  const forJsonHide = removedSlugs.filter((s) => !customSlugs.has(s))
  if (forJsonHide.length) addRemovedCategorySlugs(forJsonHide)
}
