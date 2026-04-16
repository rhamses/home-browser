<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import WeatherIcon from './WeatherIcon.vue'
import { normalizeFeedUrl } from '../lib/customNewsFeeds'
import { normalizeUserUrl } from '../lib/localFavorites'
import type { LocationWeather } from '../lib/weather'

const props = withDefaults(
  defineProps<{
    locationWeather: LocationWeather
    isDark: boolean
    hasLocalFavorites: boolean
    /** Categorias de notícias para o menu «Adicionar novo feed». */
    newsCategories?: { slug: string; name: string }[]
  }>(),
  { newsCategories: () => [] },
)

const emit = defineEmits<{
  'toggle-dark': []
  'add-favorite': [payload: { title: string; url: string }]
  'add-custom-feed': [payload: { name: string; feedUrl: string }]
  'add-extra-category-feed': [payload: { slug: string; feedUrl: string }]
  'sync-news-categories': []
  'open-manage-categories': []
  'open-manage-widgets': []
  'open-category-order': []
  'clear-app-cache': []
  'export-home-browser-data': []
  'import-home-browser-data': [payload: { text: string }]
  'clear-local-favorites': []
}>()

const menuOpen = ref(false)
const addFavoritePanelOpen = ref(false)
const addNewCategoryPanelOpen = ref(false)
const addExtraFeedPanelOpen = ref(false)
const menuRootRef = ref<HTMLElement | null>(null)
const importBackupInputRef = ref<HTMLInputElement | null>(null)
const newFavUrl = ref('')
const newFavTitle = ref('')
const newFeedName = ref('')
const newFeedUrl = ref('')
const feedUrlError = ref('')
const extraFeedSlug = ref('')
const extraFeedUrl = ref('')
const extraFeedUrlError = ref('')

function onDocumentPointerDown(e: MouseEvent) {
  const root = menuRootRef.value
  if (!menuOpen.value || !root) return
  const t = e.target
  if (t instanceof Node && !root.contains(t)) {
    menuOpen.value = false
    addFavoritePanelOpen.value = false
    addNewCategoryPanelOpen.value = false
    addExtraFeedPanelOpen.value = false
  }
}

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    menuOpen.value = false
    addFavoritePanelOpen.value = false
    addNewCategoryPanelOpen.value = false
    addExtraFeedPanelOpen.value = false
  }
}

function toggleMenu() {
  if (menuOpen.value) {
    menuOpen.value = false
    addFavoritePanelOpen.value = false
    addNewCategoryPanelOpen.value = false
    addExtraFeedPanelOpen.value = false
  } else {
    menuOpen.value = true
    addFavoritePanelOpen.value = false
    addNewCategoryPanelOpen.value = false
    addExtraFeedPanelOpen.value = false
  }
}

function openAddFavoritePanel() {
  addNewCategoryPanelOpen.value = false
  addExtraFeedPanelOpen.value = false
  feedUrlError.value = ''
  extraFeedUrlError.value = ''
  addFavoritePanelOpen.value = true
}

function openAddNewCategoryPanel() {
  addFavoritePanelOpen.value = false
  addExtraFeedPanelOpen.value = false
  feedUrlError.value = ''
  extraFeedUrlError.value = ''
  addNewCategoryPanelOpen.value = true
}

async function openAddExtraFeedPanel() {
  emit('sync-news-categories')
  await nextTick()
  addFavoritePanelOpen.value = false
  addNewCategoryPanelOpen.value = false
  feedUrlError.value = ''
  extraFeedUrlError.value = ''
  const cats = props.newsCategories ?? []
  extraFeedSlug.value = cats[0]?.slug ?? ''
  extraFeedUrl.value = ''
  addExtraFeedPanelOpen.value = true
}

function openCategoryOrderDialog() {
  addFavoritePanelOpen.value = false
  addNewCategoryPanelOpen.value = false
  addExtraFeedPanelOpen.value = false
  menuOpen.value = false
  emit('open-category-order')
}

function openManageCategoriesDialog() {
  addFavoritePanelOpen.value = false
  addNewCategoryPanelOpen.value = false
  addExtraFeedPanelOpen.value = false
  menuOpen.value = false
  emit('open-manage-categories')
}

function openManageWidgetsDialog() {
  addFavoritePanelOpen.value = false
  addNewCategoryPanelOpen.value = false
  addExtraFeedPanelOpen.value = false
  menuOpen.value = false
  emit('open-manage-widgets')
}

function triggerExportData() {
  addFavoritePanelOpen.value = false
  addNewCategoryPanelOpen.value = false
  addExtraFeedPanelOpen.value = false
  menuOpen.value = false
  emit('export-home-browser-data')
}

function clearAppCache() {
  addFavoritePanelOpen.value = false
  addNewCategoryPanelOpen.value = false
  addExtraFeedPanelOpen.value = false
  menuOpen.value = false
  emit('clear-app-cache')
}

function triggerImportData() {
  addFavoritePanelOpen.value = false
  addNewCategoryPanelOpen.value = false
  addExtraFeedPanelOpen.value = false
  menuOpen.value = false
  importBackupInputRef.value?.click()
}

function onImportBackupFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    emit('import-home-browser-data', {
      text: String(reader.result ?? ''),
    })
  }
  reader.onerror = () => {
    /* ignorado */
  }
  reader.readAsText(file, 'utf-8')
}

function submitAddFavorite() {
  const url = normalizeUserUrl(newFavUrl.value)
  if (!url) return
  let title = newFavTitle.value.trim()
  if (!title) {
    try {
      title = new URL(url).hostname
    } catch {
      title = url
    }
  }
  emit('add-favorite', { title, url })
  newFavUrl.value = ''
  newFavTitle.value = ''
  addFavoritePanelOpen.value = false
  menuOpen.value = false
}

function submitAddFeed() {
  feedUrlError.value = ''
  const normalized = normalizeFeedUrl(newFeedUrl.value)
  if (!normalized) {
    feedUrlError.value = 'URL inválida (use https://…)'
    return
  }
  emit('add-custom-feed', {
    name: newFeedName.value.trim(),
    feedUrl: newFeedUrl.value.trim(),
  })
  newFeedUrl.value = ''
  newFeedName.value = ''
  addNewCategoryPanelOpen.value = false
  menuOpen.value = false
}

function submitAddExtraFeed() {
  extraFeedUrlError.value = ''
  if (!extraFeedSlug.value) {
    extraFeedUrlError.value = 'Escolha uma categoria.'
    return
  }
  const normalized = normalizeFeedUrl(extraFeedUrl.value)
  if (!normalized) {
    extraFeedUrlError.value = 'URL inválida (use https://…)'
    return
  }
  emit('add-extra-category-feed', {
    slug: extraFeedSlug.value,
    feedUrl: extraFeedUrl.value.trim(),
  })
  extraFeedUrl.value = ''
  extraFeedUrlError.value = ''
  addExtraFeedPanelOpen.value = false
  menuOpen.value = false
}

function clearLocal() {
  emit('clear-local-favorites')
  menuOpen.value = false
  addFavoritePanelOpen.value = false
  addNewCategoryPanelOpen.value = false
  addExtraFeedPanelOpen.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <header
    class="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/55 px-3 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/45 sm:px-4"
  >
    <div ref="menuRootRef" class="relative shrink-0">
      <input
        ref="importBackupInputRef"
        type="file"
        accept="application/json,.json"
        class="sr-only"
        aria-hidden="true"
        tabindex="-1"
        @change="onImportBackupFileChange"
      />
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300/90 bg-white/80 text-zinc-700 shadow-sm transition hover:bg-white dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
        aria-label="Menu"
        aria-haspopup="true"
        :aria-expanded="menuOpen"
        @click.stop="toggleMenu"
      >
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div
        v-show="menuOpen"
        class="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-zinc-200/90 bg-white/95 py-1 shadow-xl backdrop-blur-md dark:border-zinc-700/90 dark:bg-zinc-900/95"
        role="menu"
        @click.stop
      >
        <button
          type="button"
          class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
          role="menuitem"
          @click="openAddFavoritePanel"
        >
          <svg
            class="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 5v14M5 12h14"
            />
          </svg>
          Adicionar site favorito
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
          role="menuitem"
          @click="openAddNewCategoryPanel"
        >
          <svg
            class="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="6.5" cy="17.5" r="2.5" />
            <path
              d="M4 11a9 9 0 019 9h-2.2A6.8 6.8 0 004 13.2V11zM4 5a15 15 0 0115 15h-2.3A12.7 12.7 0 004 7.3V5z"
            />
          </svg>
          Adicionar nova categoria
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
          role="menuitem"
          @click="openAddExtraFeedPanel"
        >
          <svg
            class="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 5v14M5 12h14"
            />
          </svg>
          Adicionar novo feed
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
          role="menuitem"
          @click="openCategoryOrderDialog"
        >
          <svg
            class="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 6h16M4 12h10M4 18h14"
            />
          </svg>
          Ordene categorias
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
          role="menuitem"
          @click="openManageCategoriesDialog"
        >
          <svg
            class="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          Gerencie Categorias
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
          role="menuitem"
          @click="openManageWidgetsDialog"
        >
          <svg
            class="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.4 15a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8.2 8.2 0 0 0-1.7-1l-.3-2.6H9l-.3 2.6a8.2 8.2 0 0 0-1.7 1l-2.4-1-2 3.4L4.6 13a7.9 7.9 0 0 0-.1 1 7.9 7.9 0 0 0 .1 1l-2 1.5 2 3.4 2.4-1a8.2 8.2 0 0 0 1.7 1l.3 2.6h6l.3-2.6a8.2 8.2 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5z"
            />
          </svg>
          Gerenciar Widgets
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
          role="menuitem"
          @click="clearAppCache"
        >
          <svg
            class="h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 6h18M8 6V4h8v2m-1 0l-1 14H10L9 6"
            />
          </svg>
          Limpar cache
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
          role="menuitem"
          @click="triggerExportData"
        >
          <svg
            class="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
            />
          </svg>
          Exportar dados
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-800 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
          role="menuitem"
          @click="triggerImportData"
        >
          <svg
            class="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-4-4l-5-5m0 0L8 8m5-5v12"
            />
          </svg>
          Importar dados
        </button>
        <button
          v-if="hasLocalFavorites"
          type="button"
          class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          role="menuitem"
          @click="clearLocal"
        >
          <svg
            class="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Limpar favoritos guardados
        </button>
        <div
          v-if="addFavoritePanelOpen"
          class="border-t border-zinc-200/80 p-2 dark:border-zinc-700/80"
        >
          <p class="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Guardados neste dispositivo; persistem ao fechar o navegador.
          </p>
          <label class="sr-only" for="new-fav-url">URL do site</label>
          <input
            id="new-fav-url"
            v-model="newFavUrl"
            type="url"
            inputmode="url"
            placeholder="https://exemplo.com"
            class="mb-2 w-full rounded-lg border border-zinc-300/90 bg-white px-2.5 py-2 text-xs text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-white"
            @keydown.enter.prevent="submitAddFavorite"
          />
          <label class="sr-only" for="new-fav-title">Nome (opcional)</label>
          <input
            id="new-fav-title"
            v-model="newFavTitle"
            type="text"
            placeholder="Nome (opcional)"
            class="mb-2 w-full rounded-lg border border-zinc-300/90 bg-white px-2.5 py-2 text-xs text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-white"
          />
          <button
            type="button"
            class="w-full rounded-lg bg-violet-600 py-2 text-xs font-semibold text-white transition hover:bg-violet-500"
            @click="submitAddFavorite"
          >
            Guardar
          </button>
        </div>
        <div
          v-if="addNewCategoryPanelOpen"
          class="border-t border-zinc-200/80 p-2 dark:border-zinc-700/80"
        >
          <p class="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Nova aba de notícias com um feed RSS ou Atom.
          </p>
          <label class="sr-only" for="new-feed-name">Nome da categoria</label>
          <input
            id="new-feed-name"
            v-model="newFeedName"
            type="text"
            placeholder="Nome (opcional)"
            class="mb-2 w-full rounded-lg border border-zinc-300/90 bg-white px-2.5 py-2 text-xs text-zinc-900 outline-none focus:border-orange-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-white"
          />
          <label class="sr-only" for="new-feed-url">URL do feed</label>
          <input
            id="new-feed-url"
            v-model="newFeedUrl"
            type="url"
            inputmode="url"
            placeholder="https://exemplo.com/feed.xml"
            class="mb-1 w-full rounded-lg border border-zinc-300/90 bg-white px-2.5 py-2 text-xs text-zinc-900 outline-none focus:border-orange-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-white"
            @keydown.enter.prevent="submitAddFeed"
          />
          <p
            v-if="feedUrlError"
            class="mb-2 text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {{ feedUrlError }}
          </p>
          <button
            type="button"
            class="w-full rounded-lg bg-orange-600 py-2 text-xs font-semibold text-white transition hover:bg-orange-500"
            @click="submitAddFeed"
          >
            Guardar categoria
          </button>
        </div>
        <div
          v-if="addExtraFeedPanelOpen"
          class="border-t border-zinc-200/80 p-2 dark:border-zinc-700/80"
        >
          <p class="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Adiciona um feed a uma categoria existente; os artigos juntam-se aos já
            mostrados nessa aba.
          </p>
          <template v-if="(newsCategories ?? []).length">
            <label class="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300" for="extra-feed-category">
              Categoria
            </label>
            <select
              id="extra-feed-category"
              v-model="extraFeedSlug"
              class="mb-2 w-full rounded-lg border border-zinc-300/90 bg-white px-2 py-2 text-xs text-zinc-900 outline-none focus:border-amber-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-white"
            >
              <option v-for="c in newsCategories" :key="c.slug" :value="c.slug">
                {{ c.name }}
              </option>
            </select>
            <label class="sr-only" for="extra-feed-url">URL do feed</label>
            <input
              id="extra-feed-url"
              v-model="extraFeedUrl"
              type="url"
              inputmode="url"
              placeholder="https://exemplo.com/feed.xml"
              class="mb-1 w-full rounded-lg border border-zinc-300/90 bg-white px-2.5 py-2 text-xs text-zinc-900 outline-none focus:border-amber-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-white"
              @keydown.enter.prevent="submitAddExtraFeed"
            />
          </template>
          <p
            v-else
            class="mb-2 text-xs text-amber-800 dark:text-amber-200/90"
          >
            Ainda não há categorias de notícias. Adicione uma categoria primeiro.
          </p>
          <p
            v-if="extraFeedUrlError"
            class="mb-2 text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {{ extraFeedUrlError }}
          </p>
          <button
            type="button"
            class="w-full rounded-lg bg-amber-600 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!(newsCategories ?? []).length"
            @click="submitAddExtraFeed"
          >
            Adicionar feed
          </button>
        </div>
      </div>
    </div>
    <div
      class="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-end"
    >
      <span
        class="min-w-0 truncate text-sm font-medium text-zinc-800 dark:text-zinc-100"
        :title="props.locationWeather.cityLabel"
      >
        {{ props.locationWeather.cityLabel }}
      </span>
      <span class="inline-flex items-center gap-1.5">
        <WeatherIcon :kind="props.locationWeather.kind" />
        <span class="shrink-0 tabular-nums text-sm text-zinc-600 dark:text-zinc-300">
          <template v-if="props.locationWeather.tempC !== '—'">
            {{ props.locationWeather.tempC }}°C
          </template>
          <template v-else>—</template>
        </span>
      </span>
    </div>
    <button
      type="button"
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-300/90 bg-white/80 text-zinc-700 shadow-sm transition hover:bg-white dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-amber-200 dark:hover:bg-zinc-800"
      :aria-label="props.isDark ? 'Ativar tema claro' : 'Ativar tema escuro'"
      :aria-pressed="props.isDark"
      @click="emit('toggle-dark')"
    >
      <svg
        v-if="props.isDark"
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          stroke-linecap="round"
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        />
      </svg>
      <svg
        v-else
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        />
      </svg>
    </button>
  </header>
</template>
