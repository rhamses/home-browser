<script setup lang="ts">
import type { NaturePhoto } from '../lib/unsplash'

defineProps<{
  photo: NaturePhoto
}>()
</script>

<template>
  <footer
    class="mt-8 border-t border-zinc-200/80 pt-3 text-center text-[11px] text-zinc-600 dark:border-zinc-800/80 dark:text-zinc-500"
  >
    Foto por
    <a
      class="text-violet-700 underline decoration-violet-400/50 underline-offset-2 hover:decoration-violet-600 dark:text-violet-300 dark:hover:text-violet-200"
      :href="photo.photographerProfileUrl"
      target="_blank"
      rel="noopener noreferrer"
      >{{ photo.photographerName }}</a
    >
    ·
    <a
      class="text-violet-700 underline decoration-violet-400/50 underline-offset-2 hover:decoration-violet-600 dark:text-violet-300 dark:hover:text-violet-200"
      :href="photo.photoPageUrl"
      target="_blank"
      rel="noopener noreferrer"
      >Unsplash</a
    >
  </footer>
</template>
