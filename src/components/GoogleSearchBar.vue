<script setup lang="ts">
import { ref } from 'vue'

const query = ref('')

function submit() {
  const q = query.value.trim()
  const url = q
    ? `https://www.google.com/search?q=${encodeURIComponent(q)}`
    : 'https://www.google.com/'
  window.location.assign(url)
}
</script>

<template>
  <form
    class="flex w-full gap-2 shadow-lg shadow-black/5 dark:shadow-black/20"
    role="search"
    @submit.prevent="submit"
  >
    <label class="sr-only" for="home-search">Buscar no Google</label>
    <input
      id="home-search"
      v-model="query"
      type="search"
      name="q"
      autocomplete="off"
      placeholder="Buscar no Google…"
      class="min-w-0 flex-1 rounded-2xl border border-zinc-300/90 bg-white/85 px-4 py-3.5 text-base text-zinc-900 outline-none ring-violet-500/0 transition placeholder:text-zinc-500 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25 dark:border-zinc-600/90 dark:bg-zinc-900/75 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-violet-500/50 dark:focus:ring-violet-500/30"
    />
    <button
      type="submit"
      class="shrink-0 rounded-2xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-500 active:scale-[0.98]"
    >
      Buscar
    </button>
  </form>
</template>
