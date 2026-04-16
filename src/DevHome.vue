<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import newsFeedsMock from '../news.json'
import { normalizeFeedUrl } from './lib/customNewsFeeds'
import { replaceSelectedNewsFeeds } from './lib/selectedNewsFeeds'
import { replaceSuppressedFeedUrls } from './lib/suppressedFeedUrls'
import {
  parseYoutubePlaylistIdFromUrl,
  saveWidgetsConfig,
} from './lib/widgetConfig'
import { loadNaturePhotoWithCache } from './lib/unsplashCache'
import type { NaturePhoto } from './lib/unsplash'

const newTabDevUrl = '/src/newtab.html'
const SETUP_DONE_STORAGE_KEY = 'home-browser-initial-setup-complete:v1'
const naturePhoto = ref<NaturePhoto | null>(null)
const selectedFeedKeys = ref<string[]>([])
const youtubePlaylistUrl = ref('')
const youtubePlaylistError = ref('')

function markSetupDone(): void {
  try {
    localStorage.setItem(SETUP_DONE_STORAGE_KEY, '1')
  } catch {
    /* localStorage indisponivel */
  }
}

const bgStyle = computed(() =>
  naturePhoto.value
    ? { backgroundImage: `url(${naturePhoto.value.imageUrl})` }
    : {},
)

function feedKey(slug: string, url: string): string {
  return `${slug}::${normalizeFeedUrl(url) ?? url.trim()}`
}

function siteNameFromUrl(url: string): string {
  try {
    return new URL(normalizeFeedUrl(url) ?? url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const availableNewsSources = computed(() =>
  (newsFeedsMock.categories ?? []).map((category) => ({
    slug: category.slug,
    name: category.name,
    iconSvg: category.iconSvg,
    feeds:
      (
        newsFeedsMock.feeds as Record<string, string[]> | undefined
      )?.[category.slug]?.map((url) => ({
        url,
        key: feedKey(category.slug, url),
        siteName: siteNameFromUrl(url),
      })) ?? [],
  })),
)

function onToggleFeed(key: string, checked: boolean) {
  if (checked) {
    if (!selectedFeedKeys.value.includes(key)) {
      selectedFeedKeys.value = [...selectedFeedKeys.value, key]
    }
    return
  }
  selectedFeedKeys.value = selectedFeedKeys.value.filter((x) => x !== key)
}

function savePreferencesAndStart() {
  youtubePlaylistError.value = ''
  const playlistId = youtubePlaylistUrl.value.trim()
    ? parseYoutubePlaylistIdFromUrl(youtubePlaylistUrl.value)
    : null
  if (youtubePlaylistUrl.value.trim() && !playlistId) {
    youtubePlaylistError.value = 'URL inválida. Cole o link da playlist do YouTube.'
    return
  }

  const selected = []
  for (const source of availableNewsSources.value) {
    for (const feed of source.feeds) {
      if (selectedFeedKeys.value.includes(feed.key)) {
        selected.push({
          slug: source.slug,
          url: normalizeFeedUrl(feed.url) ?? feed.url.trim(),
        })
      }
    }
  }
  replaceSelectedNewsFeeds(selected)
  replaceSuppressedFeedUrls([])
  saveWidgetsConfig({
    youtubePlaylistId: playlistId,
    youtubePlaylistUrl: youtubePlaylistUrl.value.trim() || null,
  })
  markSetupDone()
  window.location.assign(newTabDevUrl)
}

onMounted(() => {
  try {
    if (localStorage.getItem(SETUP_DONE_STORAGE_KEY) === '1') {
      window.location.replace(newTabDevUrl)
    }
  } catch {
    /* localStorage indisponivel */
  }
  void loadNaturePhotoWithCache().then((photo) => {
    naturePhoto.value = photo
  })
  selectedFeedKeys.value = availableNewsSources.value.flatMap((source) =>
    source.feeds.map((feed) => feed.key),
  )
})
</script>

<template>
  <div
    class="relative min-h-svh px-4 py-10 font-sans text-zinc-100 antialiased"
  >
    <div
      class="pointer-events-none fixed inset-0 z-0 bg-zinc-200 bg-cover bg-center dark:bg-zinc-900"
      :style="bgStyle"
      aria-hidden="true"
    />

    <div class="pointer-events-none fixed inset-0 z-0 bg-linear-to-b from-zinc-950/85 via-zinc-900/70 to-violet-950/45" />

    <div class="relative z-10 mx-auto max-w-5xl">
      <header class="text-center">
        <h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Home Browser
        </h1>
        <p class="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
          Página inicial de teste — use com
          <code class="rounded bg-zinc-800 px-1.5 py-0.5 text-violet-300"
            >npm run dev</code
          >
        </p>
      </header>

      <section
        class="mx-auto mt-8 max-w-4xl rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur-md"
      >
        <h2 class="text-center text-lg font-semibold text-white sm:text-xl">
          Configurações de widgets
        </h2>
        <p class="mt-2 text-center text-sm text-zinc-400">
          Tempo e Wikipedia aparecem automaticamente. O YouTube só aparece se uma playlist for configurada.
        </p>

        <div class="mt-6 rounded-xl border border-zinc-700/80 bg-zinc-800/60 p-4">
          <label class="mb-1 block text-sm font-medium text-zinc-200" for="yt-playlist-url">
            Playlist do YouTube (opcional)
          </label>
          <input
            id="yt-playlist-url"
            v-model="youtubePlaylistUrl"
            type="url"
            inputmode="url"
            placeholder="https://www.youtube.com/playlist?list=PL..."
            class="w-full rounded-lg border border-zinc-600 bg-zinc-950/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
          />
          <p v-if="youtubePlaylistError" class="mt-2 text-sm text-red-300">
            {{ youtubePlaylistError }}
          </p>
          <p v-else class="mt-2 text-xs text-zinc-400">
            Dica: abra a playlist no YouTube e copie o link com <code class="rounded bg-zinc-900 px-1">list=</code>.
          </p>
        </div>

        <hr class="my-8 border-zinc-700/70" />

        <h2 class="text-center text-lg font-semibold text-white sm:text-xl">
          Escolha as fontes de notícias
        </h2>
        <p class="mt-2 text-center text-sm text-zinc-400">
          Expanda cada categoria e selecione os feeds que quer ver quando abrir o app.
        </p>

        <ul class="mt-6 grid gap-3 lg:grid-cols-2">
          <li
            v-for="source in availableNewsSources"
            :key="source.slug"
            class="overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-800/60 shadow-sm"
          >
            <details class="group" :open="true">
              <summary
                class="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-left marker:hidden"
              >
                <span
                  v-if="source.iconSvg"
                  class="inline-flex h-10 w-10 shrink-0 items-center justify-center [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                  v-html="source.iconSvg"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-white">
                    {{ source.name }}
                  </p>
                  <p class="mt-0.5 text-xs text-zinc-400">
                    {{ source.feeds.length }} feed<span v-if="source.feeds.length !== 1">s</span>
                  </p>
                </div>
                <span class="text-xs text-zinc-400 transition group-open:rotate-180">
                  v
                </span>
              </summary>

              <div class="border-t border-zinc-700/70 px-4 py-3">
                <ul class="space-y-2">
                  <li
                    v-for="feed in source.feeds"
                    :key="feed.key"
                    class="rounded-lg border border-zinc-700/70 bg-zinc-900/35 px-3 py-2"
                  >
                    <label class="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        class="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500"
                        :checked="selectedFeedKeys.includes(feed.key)"
                        @change="
                          onToggleFeed(
                            feed.key,
                            ($event.target as HTMLInputElement).checked,
                          )
                        "
                      >
                      <div class="min-w-0">
                        <p class="truncate text-sm font-medium text-white">
                          {{ feed.siteName }}
                        </p>
                        <p class="mt-0.5 break-all text-xs text-zinc-400">
                          {{ feed.url }}
                        </p>
                      </div>
                    </label>
                  </li>
                </ul>
              </div>
            </details>
          </li>
        </ul>

        <div class="mt-6 flex justify-center">
          <button
            type="button"
            class="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            @click="savePreferencesAndStart"
          >
            Salvar e Começar
          </button>
        </div>
      </section>

      <p class="mt-8 text-center text-xs text-zinc-500">
        Esta página não faz parte do pacote da extensão; serve só para
        desenvolvimento local.
      </p>
    </div>
  </div>
</template>
