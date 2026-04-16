import { defineManifest } from '@crxjs/vite-plugin'

const hostPermissions = [
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
]

export default defineManifest({
  manifest_version: 3,
  name: 'Home Browser',
  version: '1.0.0',
  description: 'Home Browser is an extension for Chrome, Edge, and Firefox that replaces the new tab with a customizable panel: news via RSS, local favorites, widgets (weather, Wikipedia, and YouTube), Unsplash background, and export/import of settings. Your new home tab',
  /**
   * Firefox (Gecko) metadata.
   * Required to allow signing / install and to make updates stable.
   */
  browser_specific_settings: {
    gecko: {
      id: 'home-browser@rhamses',
      /** Desktop: `data_collection_permissions` suportado a partir do Firefox 140. */
      strict_min_version: '140.0',
      /**
       * Obrigatório para novas extensões no Firefox (AMO).
       * @see https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/
       */
      data_collection_permissions: {
        required: [
          'locationInfo',
          'bookmarksInfo',
          'websiteContent',
          'searchTerms',
        ],
        optional: ['technicalAndInteraction'],
      },
    } as any,
    gecko_android: {
      id: 'home-browser@rhamses',
      /** Android: consentimento integrado a partir do Firefox 142. */
      strict_min_version: '142.0',
      data_collection_permissions: {
        required: [
          'locationInfo',
          'bookmarksInfo',
          'websiteContent',
          'searchTerms',
        ],
        optional: ['technicalAndInteraction'],
      },
    } as any,
  } as any,
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
  host_permissions: hostPermissions,
} as any)
