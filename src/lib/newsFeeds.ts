/**
 * Configuração de feeds de notícias.
 * Em produção: definir `VITE_NEWS_FEEDS_BASE_URL` com a base (ex.: CDN).
 * O nome do ficheiro é fixo no código: `news.json`.
 * Sem env: usa o ficheiro mock `news.json` na raiz do repositório (bundled pelo Vite).
 */

import newsFeedsMock from '../../news.json'

export type NewsCategory = {
  name: string
  slug: string
  /** SVG inline (Material-like), exibido nas abas; opcional. */
  iconSvg?: string
}

export type NewsFeedsSchema = {
  categories: NewsCategory[]
  /** Chaves = `slug` da categoria; valores = lista de URLs de feed (RSS/Atom). */
  feeds: Record<string, string[]>
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x != null && typeof x === 'object' && !Array.isArray(x)
}

function parseCategories(raw: unknown): NewsCategory[] {
  if (!Array.isArray(raw)) return []
  const out: NewsCategory[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const name = item.name
    const slug = item.slug
    const iconSvg = item.iconSvg
    if (typeof name === 'string' && typeof slug === 'string' && name && slug) {
      const cat: NewsCategory = { name, slug }
      if (typeof iconSvg === 'string' && iconSvg.trim()) {
        cat.iconSvg = iconSvg.trim()
      }
      out.push(cat)
    }
  }
  return out
}

function parseFeeds(raw: unknown): Record<string, string[]> {
  if (!isRecord(raw)) return {}
  const out: Record<string, string[]> = {}
  for (const [key, val] of Object.entries(raw)) {
    if (!Array.isArray(val)) continue
    const urls = val.filter((u): u is string => typeof u === 'string' && u.length > 0)
    if (urls.length) out[key] = urls
  }
  return out
}

export function parseNewsFeedsJson(data: unknown): NewsFeedsSchema {
  if (!isRecord(data)) {
    throw new Error('news feeds: raiz do JSON deve ser um objeto')
  }
  return {
    categories: parseCategories(data.categories),
    feeds: parseFeeds(data.feeds),
  }
}

function assertFeedsAlignWithCategories(schema: NewsFeedsSchema): void {
  const slugs = new Set(schema.categories.map((c) => c.slug))
  for (const key of Object.keys(schema.feeds)) {
    if (!slugs.has(key)) {
      console.warn(
        `[newsFeeds] feed key "${key}" não corresponde a nenhum slug em categories`,
      )
    }
  }
}

const REMOTE_FEEDS_FILENAME = 'news.json'

/** URL remota do JSON (ex.: CDN). Definir em `.env` para produção. */
function remoteFeedsUrl(): string | undefined {
  // Back-compat: suporte ao env antigo, se existir.
  const legacy = import.meta.env.VITE_NEWS_FEEDS_URL?.trim() || undefined
  if (legacy) return legacy

  const base = import.meta.env.VITE_NEWS_FEEDS_BASE_URL?.trim() || undefined
  if (!base) return undefined
  const clean = base.replace(/\/+$/, '')
  return `${clean}/${REMOTE_FEEDS_FILENAME}`
}

/**
 * Carrega o schema de feeds.
 * - Com `VITE_NEWS_FEEDS_BASE_URL`: `fetch` a `<base>/news.json` (produção).
 * - Sem URL: usa `news.json` na raiz do projeto (mock, incluído no bundle).
 */
export async function loadNewsFeedsConfig(): Promise<NewsFeedsSchema> {
  const url = remoteFeedsUrl()
  if (url) {
    const res = await fetch(url, { credentials: 'omit' })
    if (!res.ok) {
      throw new Error(
        `newsFeeds: falha ao carregar ${url} (${res.status} ${res.statusText})`,
      )
    }
    const json: unknown = await res.json()
    const schema = parseNewsFeedsJson(json)
    assertFeedsAlignWithCategories(schema)
    return schema
  }

  const schema = parseNewsFeedsJson(newsFeedsMock as unknown)
  assertFeedsAlignWithCategories(schema)
  return schema
}
