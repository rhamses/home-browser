<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import FavoritesStrip from './components/FavoritesStrip.vue'
import GoogleSearchBar from './components/GoogleSearchBar.vue'
import NewTabHeaderBar from './components/NewTabHeaderBar.vue'
import NewTabUnsplashFooter from './components/NewTabUnsplashFooter.vue'
import HomeBrowserMainTabs from './components/HomeBrowserMainTabs.vue'
import NewsCategoryOrderDialog from './components/NewsCategoryOrderDialog.vue'
import { loadBookmarksBarLinks, type FavoriteLink } from './lib/bookmarksBar'
import {
  addCustomFeed,
  loadCustomFeeds,
  normalizeFeedUrl,
  removeCustomFeedsWithSlugs,
} from './lib/customNewsFeeds'
import {
  addExtraCategoryFeed,
  removeExtraCategoryFeedsMatching,
} from './lib/extraCategoryFeeds'
import { suppressFeedUrl } from './lib/suppressedFeedUrls'
import { saveCategoryOrder } from './lib/newsCategoryOrder'
import { persistCategoryDeletions } from './lib/newsCategoryRemoved'
import {
  loadLocalFavorites,
  newLocalFavoriteId,
  saveLocalFavorites,
} from './lib/localFavorites'
import {
  applyHomeBrowserBackup,
  downloadHomeBrowserBackupJson,
} from './lib/homeBrowserDataBackup'
import { loadNaturePhotoWithCache } from './lib/unsplashCache'
import type { NaturePhoto } from './lib/unsplash'
import {
  emptyDetailedWeather,
  loadLocationWeatherBundle,
  type DetailedWeather,
  type LocationWeather,
} from './lib/weather'

const isDark = ref(
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches,
)

const naturePhoto = ref<NaturePhoto | null>(null)
const photoError = ref(false)

const locationWeather = ref<LocationWeather>({
  cityLabel: '…',
  tempC: '…',
  kind: 'unknown',
})

const weatherDetail = ref<DetailedWeather>(emptyDetailedWeather())

const localFavorites = ref<FavoriteLink[]>(loadLocalFavorites())
const bookmarkBarLinks = ref<FavoriteLink[]>([])

type OrderableCategoryRow = {
  slug: string
  name: string
  feedUrls: string[]
}

type HomeTabsExposed = {
  reloadFeedsConfig?: (selectSlug?: string) => Promise<void>
  getOrderableCategories?: () => OrderableCategoryRow[]
}
const homeTabsRef = ref<HomeTabsExposed | null>(null)

const categoryOrderDialogOpen = ref(false)
const categoryOrderItems = ref<OrderableCategoryRow[]>([])
/** Slugs presentes ao abrir o diálogo (para calcular remoções ao guardar). */
const categoryOrderInitialSlugs = ref<string[]>([])
const headerNewsCategories = ref<{ slug: string; name: string }[]>([])

const displayedFavorites = computed(() => [
  ...localFavorites.value,
  ...bookmarkBarLinks.value,
])

let favoritesRefreshTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFavoritesRefresh() {
  if (favoritesRefreshTimer) clearTimeout(favoritesRefreshTimer)
  favoritesRefreshTimer = setTimeout(async () => {
    favoritesRefreshTimer = null
    bookmarkBarLinks.value = await loadBookmarksBarLinks()
  }, 400)
}

function persistLocalFavorites() {
  saveLocalFavorites(localFavorites.value)
}

function toggleTheme() {
  isDark.value = !isDark.value
}

function onAddFavoriteFromHeader(payload: { title: string; url: string }) {
  localFavorites.value = [
    ...localFavorites.value,
    {
      id: newLocalFavoriteId(),
      title: payload.title,
      url: payload.url,
    },
  ]
  persistLocalFavorites()
}

function onAddCustomFeed(payload: { name: string; feedUrl: string }) {
  const added = addCustomFeed(payload)
  if (added) void homeTabsRef.value?.reloadFeedsConfig?.(added.slug)
}

function feedUrlKey(u: string): string {
  return normalizeFeedUrl(u) ?? u.trim()
}

function onSyncNewsCategories() {
  headerNewsCategories.value =
    homeTabsRef.value?.getOrderableCategories?.().map(({ slug, name }) => ({
      slug,
      name,
    })) ?? []
}

function onAddExtraCategoryFeed(payload: { slug: string; feedUrl: string }) {
  const ok = addExtraCategoryFeed(payload.slug, payload.feedUrl)
  if (!ok) {
    window.alert('URL inválida ou feed já existente nesta categoria.')
    return
  }
  void homeTabsRef.value?.reloadFeedsConfig?.(payload.slug)
}

function onOpenCategoryOrder() {
  const items = homeTabsRef.value?.getOrderableCategories?.() ?? []
  categoryOrderItems.value = items
  categoryOrderInitialSlugs.value = items.map((x) => x.slug)
  categoryOrderDialogOpen.value = true
}

async function refreshCategoryOrderItemsFromTabs(selectSlug?: string) {
  await homeTabsRef.value?.reloadFeedsConfig?.(selectSlug)
  if (categoryOrderDialogOpen.value) {
    categoryOrderItems.value =
      homeTabsRef.value?.getOrderableCategories?.() ?? []
  }
}

function onRemoveCategoryFeed(payload: { slug: string; url: string }) {
  const { slug, url } = payload
  if (removeExtraCategoryFeedsMatching(slug, url)) {
    void refreshCategoryOrderItemsFromTabs(slug)
    return
  }
  const custom = loadCustomFeeds().find((c) => c.slug === slug)
  if (
    custom &&
    feedUrlKey(custom.feedUrl) === feedUrlKey(url)
  ) {
    removeCustomFeedsWithSlugs([slug])
    void refreshCategoryOrderItemsFromTabs()
    return
  }
  suppressFeedUrl(slug, url)
  void refreshCategoryOrderItemsFromTabs(slug)
}

function onSaveCategoryOrder(slugs: string[]) {
  const kept = new Set(slugs)
  const removed = categoryOrderInitialSlugs.value.filter((s) => !kept.has(s))
  persistCategoryDeletions(removed)
  saveCategoryOrder(slugs)
  void homeTabsRef.value?.reloadFeedsConfig?.()
}

function onExportHomeBrowserData() {
  downloadHomeBrowserBackupJson()
}

function onImportHomeBrowserData(payload: { text: string }) {
  let parsed: unknown
  try {
    parsed = JSON.parse(payload.text) as unknown
  } catch {
    window.alert('O ficheiro não é JSON válido.')
    return
  }
  const result = applyHomeBrowserBackup(parsed)
  if (!result.ok) {
    window.alert(result.error)
    return
  }
  localFavorites.value = loadLocalFavorites()
  void homeTabsRef.value?.reloadFeedsConfig?.()
  void loadNaturePhotoWithCache()
    .then((p) => {
      naturePhoto.value = p
      photoError.value = !p
    })
    .catch(() => {
      photoError.value = true
    })
}

function removeLocalFavorite(id: string) {
  localFavorites.value = localFavorites.value.filter((x) => x.id !== id)
  persistLocalFavorites()
}

function clearLocalFavorites() {
  localFavorites.value = []
  persistLocalFavorites()
}

const bgStyle = computed(() =>
  naturePhoto.value
    ? { backgroundImage: `url(${naturePhoto.value.imageUrl})` }
    : {},
)

onMounted(async () => {
  const [photo, weatherBundle] = await Promise.all([
    loadNaturePhotoWithCache().catch(() => null),
    loadLocationWeatherBundle(),
  ])
  if (!photo) photoError.value = true
  naturePhoto.value = photo
  locationWeather.value = weatherBundle.summary
  weatherDetail.value = weatherBundle.detail

  bookmarkBarLinks.value = await loadBookmarksBarLinks()
  chrome.bookmarks.onCreated.addListener(scheduleFavoritesRefresh)
  chrome.bookmarks.onRemoved.addListener(scheduleFavoritesRefresh)
  chrome.bookmarks.onChanged.addListener(scheduleFavoritesRefresh)
  chrome.bookmarks.onMoved.addListener(scheduleFavoritesRefresh)
})

onUnmounted(() => {
  if (favoritesRefreshTimer) clearTimeout(favoritesRefreshTimer)
  chrome.bookmarks.onCreated.removeListener(scheduleFavoritesRefresh)
  chrome.bookmarks.onRemoved.removeListener(scheduleFavoritesRefresh)
  chrome.bookmarks.onChanged.removeListener(scheduleFavoritesRefresh)
  chrome.bookmarks.onMoved.removeListener(scheduleFavoritesRefresh)
})
</script>

<template>
  <div class="relative flex min-h-svh flex-col font-sans antialiased text-zinc-900 dark:text-zinc-100"
    :class="{ dark: isDark }">
    <div
      class="pointer-events-none fixed inset-0 z-0 bg-zinc-200 bg-cover bg-center dark:bg-zinc-900"
      :style="bgStyle"
      aria-hidden="true"
    />

    <div class="relative z-10 flex min-h-svh flex-col">
      <NewTabHeaderBar :location-weather="locationWeather" :is-dark="isDark"
        :has-local-favorites="localFavorites.length > 0" :news-categories="headerNewsCategories"
        @toggle-dark="toggleTheme" @add-favorite="onAddFavoriteFromHeader"
        @add-custom-feed="onAddCustomFeed" @sync-news-categories="onSyncNewsCategories"
        @add-extra-category-feed="onAddExtraCategoryFeed" @open-category-order="onOpenCategoryOrder"
        @export-home-browser-data="onExportHomeBrowserData" @import-home-browser-data="onImportHomeBrowserData"
        @clear-local-favorites="clearLocalFavorites" />

      <NewsCategoryOrderDialog
        v-model:open="categoryOrderDialogOpen"
        :items="categoryOrderItems"
        @save="onSaveCategoryOrder"
        @remove-category-feed="onRemoveCategoryFeed"
      />

      <section class="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-8 pt-10 sm:pt-14">
        <header class="mb-8 text-center">
          <p class="text-xs font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400/90">
            Home Browser
          </p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Nova aba
          </h1>
        </header>

        <GoogleSearchBar />

        <FavoritesStrip :favorites="localFavorites" @remove-local="removeLocalFavorite" />
      </section>

      <HomeBrowserMainTabs
        ref="homeTabsRef"
        :weather-detail="weatherDetail"
        :favorites="displayedFavorites"
      />
      <NewTabUnsplashFooter v-if="naturePhoto" :photo="naturePhoto" />
    </div>
  </div>
</template>
