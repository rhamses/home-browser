<script setup lang="ts">
import { faviconForUrl, type FavoriteLink } from '../lib/bookmarksBar'
import { isExtensionFavoriteId } from '../lib/localFavorites'

defineProps<{
  favorites: FavoriteLink[]
}>()
</script>

<template>
  <section class="mt-6" aria-labelledby="favorites-heading">
    <div class="mb-2 flex items-center justify-between gap-2">
      <h2
        id="favorites-heading"
        class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
      >
        Favoritos
      </h2>
    </div>
    <div
      v-if="favorites.length"
      class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
    >
      <div
        v-for="f in favorites"
        :key="f.id"
        class="group relative flex min-w-18 max-w-26 shrink-0 flex-col items-center gap-1.5"
      >
        <a
          class="flex w-full flex-col items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white/80 px-2 py-2.5 text-center no-underline shadow-sm transition hover:border-violet-400/60 hover:bg-white hover:shadow-md dark:border-zinc-700/90 dark:bg-zinc-900/60 dark:hover:border-violet-500/50 dark:hover:bg-zinc-900"
          :class="
            isExtensionFavoriteId(f.id)
              ? 'ring-1 ring-violet-400/40 dark:ring-violet-500/30'
              : ''
          "
          :href="f.url"
          :title="f.title"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            class="h-7 w-7 rounded-md bg-zinc-100 object-contain dark:bg-zinc-800"
            :src="faviconForUrl(f.url)"
            width="28"
            height="28"
            loading="lazy"
            alt=""
          />
          <span
            class="w-full truncate text-[11px] font-medium leading-tight text-zinc-700 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100"
          >
            {{ f.title }}
          </span>
        </a>
      </div>
    </div>
    <p
      v-else
      class="rounded-xl border border-dashed border-zinc-300/90 bg-white/40 px-3 py-4 text-center text-xs text-zinc-500 dark:border-zinc-700/90 dark:bg-zinc-900/30 dark:text-zinc-400"
    >
      Usa o menu à esquerda para adicionar sites favoritos neste dispositivo, ou
      adiciona atalhos na barra de favoritos do Chrome para que apareçam aqui.
    </p>
  </section>
</template>
