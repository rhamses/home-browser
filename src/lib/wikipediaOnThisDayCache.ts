/**
 * Facto histórico do dia (Wikipedia / Wikimedia "on this day") com cache em localStorage.
 * https://api.wikimedia.org/wiki/Feed_API/Reference/On_this_day
 */

const CACHE_KEY_PREFIX = 'home-browser:wiki-otd:v1:'
/** Reutiliza o mesmo facto até 8 h (várias abas no mesmo dia). */
export const WIKI_OTD_TTL_MS = 8 * 60 * 60 * 1000

type WikiContentUrls = { desktop?: { page?: string } }
type OtdPage = { title?: string; content_urls?: WikiContentUrls }
type OtdEvent = {
  text?: string
  year?: number
  pages?: OtdPage[]
}

type OtdEventsResponse = {
  events?: OtdEvent[]
}

export type WikipediaOtdFact = {
  /** Texto curto do feed (geralmente 1 frase). */
  text: string
  year: number | null
  articleUrl: string | null
  articleTitle: string | null
  /** Ex.: "15 de abril" */
  monthDayLabel: string
  fetchedAt: number
}

function monthDayKey(d: Date): { mm: string; dd: string; label: string } {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const label = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
  }).format(d)
  return { mm, dd, label }
}

function cacheKey(mm: string, dd: string): string {
  return `${CACHE_KEY_PREFIX}${mm}-${dd}`
}

function readCache(mm: string, dd: string): WikipediaOtdFact | null {
  try {
    const raw = localStorage.getItem(cacheKey(mm, dd))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { v: number; payload: WikipediaOtdFact }
    if (parsed.v !== 1 || !parsed.payload?.fetchedAt) return null
    if (Date.now() - parsed.payload.fetchedAt > WIKI_OTD_TTL_MS) return null
    return parsed.payload
  } catch {
    return null
  }
}

function writeCache(mm: string, dd: string, payload: WikipediaOtdFact): void {
  try {
    localStorage.setItem(cacheKey(mm, dd), JSON.stringify({ v: 1, payload }))
  } catch {
    /* quota / privado */
  }
}

function pickEventIndex(events: OtdEvent[], mm: string, dd: string): number {
  if (!events.length) return 0
  const n = (parseInt(mm, 10) || 1) * 31 + (parseInt(dd, 10) || 1)
  return n % events.length
}

function mapEvent(ev: OtdEvent | undefined, label: string): WikipediaOtdFact {
  if (!ev?.text?.trim()) {
    return {
      text: 'Nenhum evento disponível para esta data.',
      year: null,
      articleUrl: null,
      articleTitle: null,
      monthDayLabel: label,
      fetchedAt: Date.now(),
    }
  }
  const page = ev.pages?.[0]
  const articleUrl = page?.content_urls?.desktop?.page?.trim() || null
  const articleTitle = page?.title?.replace(/_/g, ' ') || null
  return {
    text: ev.text.trim(),
    year: typeof ev.year === 'number' && Number.isFinite(ev.year) ? ev.year : null,
    articleUrl,
    articleTitle,
    monthDayLabel: label,
    fetchedAt: Date.now(),
  }
}

async function fetchEvents(mm: string, dd: string): Promise<OtdEvent[]> {
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/pt/onthisday/events/${mm}/${dd}`
  const res = await fetch(url, { credentials: 'omit' })
  if (!res.ok) throw new Error(`Wikipedia OTD: HTTP ${res.status}`)
  const json = (await res.json()) as OtdEventsResponse
  return Array.isArray(json.events) ? json.events : []
}

export type WikipediaOtdLoadMeta = { fromCache: boolean }

/**
 * Um facto do dia (evento histórico), em português, com cache.
 */
export async function loadWikipediaOnThisDay(
  date = new Date(),
): Promise<{ data: WikipediaOtdFact; meta: WikipediaOtdLoadMeta }> {
  const { mm, dd, label } = monthDayKey(date)
  const cached = readCache(mm, dd)
  if (cached) {
    return { data: cached, meta: { fromCache: true } }
  }
  const events = await fetchEvents(mm, dd)
  const idx = pickEventIndex(events, mm, dd)
  const fact = mapEvent(events[idx], label)
  writeCache(mm, dd, fact)
  return { data: fact, meta: { fromCache: false } }
}
