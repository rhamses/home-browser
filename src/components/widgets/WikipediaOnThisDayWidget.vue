<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  loadWikipediaOnThisDay,
  type WikipediaOtdFact,
} from '../../lib/wikipediaOnThisDayCache'

const loading = ref(true)
const error = ref<string | null>(null)
const fact = ref<WikipediaOtdFact | null>(null)
const fromCache = ref(false)

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    const r = await loadWikipediaOnThisDay()
    fact.value = r.data
    fromCache.value = r.meta.fromCache
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : 'Não foi possível carregar o facto do dia.'
    fact.value = null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <li
    class="rounded-xl border border-zinc-200/90 bg-white/80 p-3 shadow-sm dark:border-zinc-700/90 dark:bg-zinc-900/70"
  >
    <div class="flex items-start justify-between gap-2 border-b border-zinc-200/70 pb-2 dark:border-zinc-700/70">
      <div class="min-w-0">
        <p class="text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400">
          Wikipedia
        </p>
        <h4 class="text-sm font-semibold leading-tight text-zinc-900 dark:text-white">
          Neste dia
        </h4>
        <p v-if="fact" class="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
          {{ fact.monthDayLabel }}
        </p>
      </div>
      <div
        v-if="!loading && fact"
        class="flex shrink-0 flex-col items-end gap-1"
      >
        <span
          v-if="fact.year != null"
          class="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          {{ fact.year }}
        </span>
        <span
          class="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          :title="fromCache ? 'Em cache' : 'Recém obtido'"
        >
          {{ fromCache ? 'Cache' : 'Novo' }}
        </span>
      </div>
    </div>

    <p v-if="loading" class="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
      A carregar…
    </p>
    <p
      v-else-if="error"
      class="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-2 py-1.5 text-[11px] text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
    >
      {{ error }}
    </p>
    <template v-else-if="fact">
      <p class="mt-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
        {{ fact.text }}
      </p>
      <a
        v-if="fact.articleUrl"
        class="mt-2 inline-flex text-[11px] font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
        :href="fact.articleUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        Ler na Wikipédia
        <span v-if="fact.articleTitle" class="sr-only">: {{ fact.articleTitle }}</span>
      </a>
      <p class="mt-2 text-[9px] leading-tight text-zinc-400 dark:text-zinc-500">
        Dados: Wikimedia On this day · CC BY-SA onde aplicável
      </p>
    </template>
  </li>
</template>
