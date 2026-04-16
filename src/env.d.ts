/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UNSPLASH_ACCESS_KEY?: string
  /** URL absoluto do JSON de feeds (produção). Se vazio, usa `news.json` na raiz. */
  readonly VITE_NEWS_FEEDS_URL?: string
  /** YouTube Data API v3 — playlist "homebrowser" no widget da nova aba. */
  readonly VITE_YOUTUBE_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
