<script setup lang="ts">
const newTabPageUrl = chrome.runtime.getURL('src/newtab.html')
</script>

<template>
  <div class="w-[280px] bg-zinc-950 p-4 font-sans text-zinc-100 antialiased">
    <h1 class="text-base font-semibold text-white">Home Browser</h1>
    <p class="mt-2 text-xs leading-relaxed text-zinc-400">
      A nova aba do Chrome usa a sua página inicial com busca e favoritos.
    </p>
    <a
      class="mt-4 flex w-full items-center justify-center rounded-lg bg-violet-600 px-3 py-2 text-center text-sm font-medium text-white no-underline transition hover:bg-violet-500"
      :href="newTabPageUrl"
      target="_blank"
      rel="noopener noreferrer"
    >
      Abrir página inicial
    </a>
  </div>
</template>
