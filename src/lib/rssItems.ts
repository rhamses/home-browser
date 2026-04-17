import type { NewsArticle } from '../types/newsArticle'

function resolveFeedFetchUrl(feedUrl: string): string {
  if (import.meta.env.DEV) {
    return `/__rss?url=${encodeURIComponent(feedUrl)}`
  }
  return feedUrl
}

function firstText(parent: Element, localName: string): string {
  const el = parent.getElementsByTagName(localName)[0]
  return el?.textContent?.trim() ?? ''
}

function excerptFromHtml(html: string, max = 200): string {
  const plain = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!plain) return ''
  return plain.length > max ? `${plain.slice(0, max)}…` : plain
}

function hostFromUrl(url: string): string | undefined {
  try {
    return new URL(url).hostname
  } catch {
    return undefined
  }
}

function formatPub(ts: number): string {
  if (!ts || !Number.isFinite(ts)) return ''
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(ts))
  } catch {
    return ''
  }
}

const MRSS_NS = 'http://search.yahoo.com/mrss/'
const CONTENT_NS = 'http://purl.org/rss/1.0/modules/content/'
const ITUNES_NS = 'http://www.itunes.com/dtds/podcast-1.0.dtd'

function isFilteredOutImageUrl(u: string): boolean {
  const low = u.toLowerCase()
  if (low.includes('logo-agenciabrasil')) return true
  if (low.includes('width:1px') || low.includes('1px; height:1px')) return true
  if (low.endsWith('/ebc.png') || low.endsWith('/ebc.gif')) return true
  return false
}

function pickImageFromDescription(descHtml: string): string | undefined {
  if (!descHtml) return undefined
  const m = descHtml.match(/<img[^>]+src=["']([^"']+)["']/i)
  const u = m?.[1]
  if (!u || isFilteredOutImageUrl(u)) return undefined
  return u
}

function rssContentEncoded(item: Element): string {
  const el = item.getElementsByTagNameNS(CONTENT_NS, 'encoded')[0]
  return el?.textContent?.trim() ?? ''
}

function pickRssItemImage(item: Element, descriptionHtml: string): string | undefined {
  const dest = firstText(item, 'imagem-destaque')
  if (dest && !isFilteredOutImageUrl(dest)) return dest

  const enc = item.getElementsByTagName('enclosure')[0]
  if (enc) {
    const url = enc.getAttribute('url')
    const type = enc.getAttribute('type') ?? ''
    if (url && type.startsWith('image/') && !isFilteredOutImageUrl(url)) return url
  }

  const mediaContents = item.getElementsByTagNameNS(MRSS_NS, 'content')
  for (let i = 0; i < mediaContents.length; i++) {
    const el = mediaContents[i]
    const url = el?.getAttribute('url')
    const type = el?.getAttribute('type') ?? ''
    if (!url || isFilteredOutImageUrl(url)) continue
    if (type.startsWith('image/')) return url
    if (!type && /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(url)) return url
  }

  const thumbs = item.getElementsByTagNameNS(MRSS_NS, 'thumbnail')
  for (let i = 0; i < thumbs.length; i++) {
    const url = thumbs[i]?.getAttribute('url')
    if (url && !isFilteredOutImageUrl(url)) return url
  }

  const itImg = item.getElementsByTagNameNS(ITUNES_NS, 'image')[0]
  const itHref = itImg?.getAttribute('href')
  if (itHref && !isFilteredOutImageUrl(itHref)) return itHref

  const encoded = rssContentEncoded(item)
  const fromDesc = pickImageFromDescription(descriptionHtml)
  if (fromDesc) return fromDesc
  return pickImageFromDescription(encoded)
}

function parseRssChannel(channel: Element, feedUrl: string): NewsArticle[] {
  const items = channel.getElementsByTagName('item')
  const out: NewsArticle[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const title = firstText(item, 'title')
    const link = firstText(item, 'link')
    if (!title || !link) continue
    const descHtml = firstText(item, 'description')
    const summary = excerptFromHtml(descHtml)
    const pubStr = firstText(item, 'pubDate')
    const parsed = pubStr ? Date.parse(pubStr) : NaN
    const pubDate = Number.isFinite(parsed) ? parsed : 0

    const imageUrl = pickRssItemImage(item, descHtml)

    out.push({
      id: link,
      title,
      link,
      summary,
      pubDate,
      pubLabel: formatPub(pubDate),
      imageUrl,
      sourceLabel: hostFromUrl(feedUrl),
    })
  }
  return out
}

function parseRssDocument(doc: Document, feedUrl: string): NewsArticle[] {
  const ch = doc.getElementsByTagName('channel')[0]
  if (!ch) return []
  return parseRssChannel(ch, feedUrl)
}

function parseAtomDocument(doc: Document, feedUrl: string): NewsArticle[] {
  const entries = doc.getElementsByTagName('entry')
  const out: NewsArticle[] = []
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const title = firstText(entry, 'title')
    let link = ''
    const links = entry.getElementsByTagName('link')
    for (let j = 0; j < links.length; j++) {
      const rel = links[j].getAttribute('rel')
      const href = links[j].getAttribute('href')
      if (href && (rel === 'alternate' || !rel)) {
        link = href
        break
      }
    }
    if (!link && links[0]) link = links[0].getAttribute('href') ?? ''
    if (!title || !link) continue
    const summaryHtml =
      firstText(entry, 'summary') ||
      firstText(entry, 'content') ||
      firstText(entry, 'subtitle')
    const summary = excerptFromHtml(summaryHtml)
    const updated = firstText(entry, 'updated') || firstText(entry, 'published')
    const parsed = updated ? Date.parse(updated) : NaN
    const pubDate = Number.isFinite(parsed) ? parsed : 0

    let imageUrl = pickImageFromDescription(summaryHtml)
    if (!imageUrl) {
      const thumbs = entry.getElementsByTagNameNS(MRSS_NS, 'thumbnail')
      for (let t = 0; t < thumbs.length; t++) {
        const url = thumbs[t]?.getAttribute('url')
        if (url && !isFilteredOutImageUrl(url)) {
          imageUrl = url
          break
        }
      }
    }
    if (!imageUrl) {
      const links = entry.getElementsByTagName('link')
      for (let j = 0; j < links.length; j++) {
        const rel = links[j]?.getAttribute('rel')
        const href = links[j]?.getAttribute('href')
        const type = links[j]?.getAttribute('type') ?? ''
        if (href && rel === 'enclosure' && type.startsWith('image/')) {
          imageUrl = href
          break
        }
      }
    }

    out.push({
      id: link,
      title,
      link,
      summary,
      pubDate,
      pubLabel: formatPub(pubDate),
      imageUrl,
      sourceLabel: hostFromUrl(feedUrl),
    })
  }
  return out
}

function parseFeedXml(text: string, feedUrl: string): NewsArticle[] {
  const doc = new DOMParser().parseFromString(text, 'text/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('Resposta não é XML RSS/Atom válido')
  }
  const root = doc.documentElement
  if (root.getElementsByTagName('item').length) {
    return parseRssDocument(doc, feedUrl)
  }
  if (root.getElementsByTagName('entry').length) {
    return parseAtomDocument(doc, feedUrl)
  }
  return []
}

export async function fetchFeedArticles(feedUrl: string): Promise<NewsArticle[]> {
  const url = resolveFeedFetchUrl(feedUrl)
  const res = await fetch(url, { credentials: 'omit' })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`)
  }
  const text = await res.text()
  return parseFeedXml(text, feedUrl)
}

export function mergeSortDedupeArticles(lists: NewsArticle[], max = 48): NewsArticle[] {
  const byLink = new Map<string, NewsArticle>()
  for (const a of lists) {
    if (!byLink.has(a.link)) byLink.set(a.link, a)
  }
  return [...byLink.values()].sort((x, y) => y.pubDate - x.pubDate).slice(0, max)
}

export async function fetchCategoryArticles(feedUrls: string[]): Promise<NewsArticle[]> {
  if (!feedUrls.length) return []
  const chunks: NewsArticle[][] = []
  const errors: string[] = []
  for (const u of feedUrls) {
    try {
      chunks.push(await fetchFeedArticles(u))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`${u}: ${msg}`)
    }
  }
  if (!chunks.length && errors.length) {
    throw new Error(errors.join(' · '))
  }
  return mergeSortDedupeArticles(chunks.flat())
}

export type FeedImageScanResult = {
  imagesFound: number
  sampleImageUrl?: string
  hints: string[]
}

/**
 * Obtém o feed e conta quantos dos primeiros itens têm imagem utilizável no cartão.
 */
export async function scanFeedForImageFields(
  feedUrl: string,
  maxItems = 5,
): Promise<FeedImageScanResult> {
  try {
    const articles = (await fetchFeedArticles(feedUrl)).slice(0, maxItems)
    const withImg = articles.filter((a) => Boolean(a.imageUrl))
    const hints: string[] = []
    if (withImg.length) {
      hints.push(
        `${withImg.length}/${articles.length} artigos com campo de imagem resolvido (media/content, enclosure, HTML, etc.).`,
      )
    } else if (articles.length) {
      hints.push(
        `${articles.length} artigos analisados; nenhuma imagem típica encontrada nos campos suportados.`,
      )
    } else {
      hints.push('Nenhum item encontrado no feed.')
    }
    return {
      imagesFound: withImg.length,
      sampleImageUrl: withImg[0]?.imageUrl,
      hints,
    }
  } catch (e) {
    return {
      imagesFound: 0,
      hints: [e instanceof Error ? e.message : 'Erro ao obter o feed.'],
    }
  }
}
