export type FavoriteLink = {
  id: string
  title: string
  url: string
}

const MAX_LINKS = 28

function flattenBarNodes(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  out: FavoriteLink[],
): void {
  for (const n of nodes) {
    if (out.length >= MAX_LINKS) return
    if (n.url) {
      let title = n.title?.trim()
      if (!title) {
        try {
          title = new URL(n.url).hostname
        } catch {
          title = n.url
        }
      }
      out.push({ id: n.id, title, url: n.url })
    } else if (n.children?.length) {
      flattenBarNodes(n.children, out)
    }
  }
}

function getChildrenPromise(
  parentId: string,
): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getChildren(parentId, (results) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve(results ?? [])
    })
  })
}

function getTreePromise(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((tree) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve(tree ?? [])
    })
  })
}

/** Favicon via Google (sem chave). */
export function faviconForUrl(url: string): string {
  try {
    const host = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`
  } catch {
    return ''
  }
}

/**
 * Links da barra de favoritos do Chrome (pastas são percorridas em profundidade).
 */
export async function loadBookmarksBarLinks(): Promise<FavoriteLink[]> {
  const out: FavoriteLink[] = []

  try {
    const fromBar = await getChildrenPromise('1')
    if (fromBar.length) {
      flattenBarNodes(fromBar, out)
      return out
    }
  } catch {
    /* tenta árvore */
  }

  try {
    const tree = await getTreePromise()
    const root = tree[0]
    const bar =
      root?.children?.find((c) => c.id === '1') ??
      root?.children?.find((c) =>
        /favoritos|bookmarks bar|marcadores|personal toolbar/i.test(
          c.title ?? '',
        ),
      ) ??
      root?.children?.[0]

    if (bar?.children?.length) {
      flattenBarNodes(bar.children, out)
    }
  } catch {
    /* vazio */
  }

  return out
}
