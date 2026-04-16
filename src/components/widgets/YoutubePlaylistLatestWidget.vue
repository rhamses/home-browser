<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  hasYoutubeApiKey,
  HOMEBROWSER_PLAYLIST_ID,
  loadLatestPlaylistVideo,
  type YoutubeLatestVideo,
} from '../../lib/youtubePlaylistLatestCache'

const loading = ref(true)
const error = ref<string | null>(null)
const video = ref<YoutubeLatestVideo | null>(null)
const needsKey = ref(false)
const fromCache = ref(false)

const embedSrc = computed(() =>
  video.value
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.value.videoId)}`
    : '',
)

onMounted(async () => {
  loading.value = true
  error.value = null
  needsKey.value = !hasYoutubeApiKey()
  if (needsKey.value) {
    loading.value = false
    return
  }
  try {
    const r = await loadLatestPlaylistVideo(HOMEBROWSER_PLAYLIST_ID)
    if (!r) {
      needsKey.value = true
      return
    }
    video.value = r.data
    fromCache.value = r.meta.fromCache
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : 'Erro ao carregar a playlist do YouTube.'
    video.value = null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <li
    class="rounded-xl border border-zinc-200/90 bg-white/80 p-3 shadow-sm dark:border-zinc-700/90 dark:bg-zinc-900/70">
    <div class="border-b border-zinc-200/70 pb-2 dark:border-zinc-700/70">
      <p class="text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
        YouTube
      </p>
    </div>

    <p v-if="loading" class="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
      A carregar…
    </p>

    <div v-else-if="needsKey"
      class="mt-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/90 px-2 py-2 text-[11px] leading-snug text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
      <p class="font-medium text-zinc-800 dark:text-zinc-200">Chave da API necessária</p>
      <p class="mt-1">
        Cria uma chave
        <strong>YouTube Data API v3</strong>
        no Google Cloud Console e define
        <code class="rounded bg-zinc-200/90 px-1 text-[10px] dark:bg-zinc-900">VITE_YOUTUBE_API_KEY</code>
        no ficheiro
        <code class="rounded bg-zinc-200/90 px-1 text-[10px] dark:bg-zinc-900">.env</code>
        , depois reconstrói a extensão.
      </p>
    </div>

    <p v-else-if="error"
      class="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-2 py-1.5 text-[11px] text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
      {{ error }}
    </p>

    <template v-else-if="video">
      <div
        class="mt-2 overflow-hidden rounded-lg border border-zinc-200/80 bg-black shadow-inner dark:border-zinc-700/80">
        <div class="relative aspect-video w-full">
          <iframe :src="embedSrc" class="absolute inset-0 h-full w-full border-0" :title="`Reproduzir: ${video.title}`"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen referrerpolicy="strict-origin-when-cross-origin" />
        </div>
      </div>
      <div class="mt-2">
        <p class="line-clamp-2 text-xs font-medium leading-snug text-zinc-900 dark:text-white">
          {{ video.title }}
        </p>
        <p class="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
          {{ video.channelTitle }} · {{ video.publishedLabel }}
        </p>
      </div>
      <div class="mt-2 flex items-center justify-between gap-2">
        <a :href="video.watchUrl" target="_blank" rel="noopener noreferrer"
          class="text-[11px] font-medium text-red-700 underline-offset-2 hover:underline dark:text-red-400">
          Abrir no YouTube
        </a>
        <span
          class="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {{ fromCache ? 'Cache' : 'Novo' }}
        </span>
      </div>
    </template>
  </li>
</template>
