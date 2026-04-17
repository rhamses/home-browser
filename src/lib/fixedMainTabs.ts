const STORAGE_KEY = 'home-browser-hidden-fixed-tabs:v1'

export const FIXED_MAIN_TAB_IDS = ['games', 'chat', 'favorites'] as const
export type FixedMainTabId = (typeof FIXED_MAIN_TAB_IDS)[number]

function parseHidden(raw: string | null): Set<FixedMainTabId> {
  if (!raw) return new Set()
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return new Set()
    const out = new Set<FixedMainTabId>()
    for (const x of data) {
      if (x === 'games' || x === 'chat' || x === 'favorites') out.add(x)
    }
    return out
  } catch {
    return new Set()
  }
}

export function loadHiddenFixedTabIds(): Set<FixedMainTabId> {
  if (typeof localStorage === 'undefined') return new Set()
  return parseHidden(localStorage.getItem(STORAGE_KEY))
}

export function saveHiddenFixedTabIds(hidden: Set<FixedMainTabId>): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...hidden]))
  } catch {
    /* quota */
  }
}

export function clearHiddenFixedTabIds(): void {
  saveHiddenFixedTabIds(new Set())
}
