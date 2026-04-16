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

function pickImageFromDescription(descHtml: string): string | undefined {
  const m = descHtml.match(/<img[^>]+src=["']([^"']+)["']/i)
  const u = m?.[1]
  if (!u) return undefined
  const low = u.toLowerCase()
  if (low.includes('logo-agenciabrasil')) return undefined
  if (low.includes('width:1px') || low.includes('1px; height:1px')) return undefined
  if (low.endsWith('/ebc.png') || low.endsWith('/ebc.gif')) return undefined
  return u
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

    let imageUrl =
      firstText(item, 'imagem-destaque') ||
      (() => {
        const enc = item.getElementsByTagName('enclosure')[0]
        const url = enc?.getAttribute('url')
        const type = enc?.getAttribute('type') ?? ''
        if (url && type.startsWith('image/')) return url
        return ''
      })() ||
      pickImageFromDescription(descHtml)

    if (imageUrl === '') imageUrl = undefined

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
    const imageUrl = pickImageFromDescription(summaryHtml)

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
