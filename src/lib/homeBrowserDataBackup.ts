/**
 * Exportação / importação de dados locais (localStorage) prefixados por `home-browser`:
 * feeds, ordem/remoção de categorias, favoritos, caches (Unsplash, YouTube, Wikipedia), etc.
 */

export const HOME_BROWSER_STORAGE_KEY_PREFIX = 'home-browser'

export type HomeBrowserBackupV1 = {
  version: 1
  exportedAt: string
  /** Chave localStorage → valor já parseado em JSON (ou string se não for JSON). */
  stores: Record<string, unknown>
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x != null && typeof x === 'object' && !Array.isArray(x)
}

function isAllowedBackupKey(key: string): boolean {
  return (
    typeof key === 'string' &&
    key.length > 0 &&
    key.startsWith(HOME_BROWSER_STORAGE_KEY_PREFIX)
  )
}

export function buildHomeBrowserBackup(): HomeBrowserBackupV1 {
  const stores: Record<string, unknown> = {}
  if (typeof localStorage === 'undefined') {
    return { version: 1, exportedAt: new Date().toISOString(), stores: {} }
  }
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !isAllowedBackupKey(key)) continue
    const raw = localStorage.getItem(key)
    if (raw == null) continue
    try {
      stores[key] = JSON.parse(raw) as unknown
    } catch {
      stores[key] = raw
    }
  }
  return { version: 1, exportedAt: new Date().toISOString(), stores }
}

export function downloadHomeBrowserBackupJson(): void {
  const data = buildHomeBrowserBackup()
  const text = JSON.stringify(data, null, 2)
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  a.href = url
  a.download = `home-browser-dados-${stamp}.json`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function valueToStorageString(value: unknown): string {
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

export function applyHomeBrowserBackup(
  input: unknown,
): { ok: true } | { ok: false; error: string } {
  if (!isRecord(input)) {
    return { ok: false, error: 'O ficheiro não é um objeto JSON válido.' }
  }
  if (input.version !== 1) {
    return { ok: false, error: 'Versão de backup não suportada.' }
  }
  const stores = input.stores
  if (!isRecord(stores)) {
    return { ok: false, error: 'Falta o campo "stores" no backup.' }
  }
  if (typeof localStorage === 'undefined') {
    return { ok: false, error: 'Armazenamento local não disponível.' }
  }
  for (const key of Object.keys(stores)) {
    if (!isAllowedBackupKey(key)) {
      return { ok: false, error: `Chave inválida no backup: ${key}` }
    }
  }
  try {
    for (const [key, value] of Object.entries(stores)) {
      localStorage.setItem(key, valueToStorageString(value))
    }
  } catch {
    return { ok: false, error: 'Não foi possível gravar (quota ou acesso bloqueado).' }
  }
  return { ok: true }
}
