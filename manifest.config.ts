import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Home Browser',
  version: '1.0.0',
  description: 'Extensão Chrome com Vue, Vite e Tailwind',
  action: {
    default_title: 'Home Browser',
    default_popup: 'src/popup.html',
  },
  chrome_url_overrides: {
    newtab: 'src/newtab.html',
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  permissions: ['bookmarks'],
  host_permissions: [
    'https://api.unsplash.com/*',
    'https://images.unsplash.com/*',
    'https://wttr.in/*',
    'https://nominatim.openstreetmap.org/*',
    'https://www.google.com/*',
    'https://www.googleapis.com/*',
    'https://i.ytimg.com/*',
    'https://www.youtube-nocookie.com/*',
    'https://www.youtube.com/*',
    /** Feeds RSS/Atom definidos em `news.json` / URL remoto. */
    '<all_urls>',
  ],
})
