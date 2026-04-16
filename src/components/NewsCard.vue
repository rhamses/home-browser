<script setup lang="ts">
import type { NewsArticle } from '../types/newsArticle'

defineProps<{
  article: NewsArticle
}>()

const cardClass =
  'group mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/95 shadow-md shadow-zinc-900/5 transition hover:border-violet-300/70 hover:shadow-lg dark:border-zinc-700/90 dark:bg-zinc-900/80 dark:shadow-black/25 dark:hover:border-violet-500/45'
</script>

<template>
  <article :class="cardClass">
    <a
      :href="article.link"
      target="_blank"
      rel="noopener noreferrer"
      class="block outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
    >
      <div
        v-if="article.imageUrl"
        class="relative max-h-56 overflow-hidden bg-zinc-100 dark:bg-zinc-800"
      >
        <img
          :src="article.imageUrl"
          :alt="article.title"
          class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div class="p-4">
        <h3
          class="line-clamp-3 text-base font-semibold leading-snug text-zinc-900 dark:text-white"
        >
          {{ article.title }}
        </h3>
        <p
          v-if="article.summary"
          class="mt-2 line-clamp-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
        >
          {{ article.summary }}
        </p>
        <div
          class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-500"
        >
          <time
            v-if="article.pubLabel"
            :datetime="
              article.pubDate
                ? new Date(article.pubDate).toISOString()
                : undefined
            "
          >
            {{ article.pubLabel }}
          </time>
          <span v-if="article.pubLabel && article.sourceLabel" aria-hidden="true">·</span>
          <span v-if="article.sourceLabel" class="truncate">{{ article.sourceLabel }}</span>
        </div>
      </div>
    </a>
  </article>
</template>
