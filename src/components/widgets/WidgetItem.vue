<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    eyebrow?: string
    hint?: string
  }>(),
  {
    eyebrow: 'Placeholder',
    hint: 'Área reservada (~20% da largura em ecrãs grandes)',
  },
)
</script>

<template>
  <li
    class="flex min-h-22 flex-col justify-center rounded-xl border border-dashed border-zinc-300/90 bg-zinc-100/60 px-3 py-3 text-center dark:border-zinc-600/80 dark:bg-zinc-900/40"
  >
    <span class="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
      {{ eyebrow }}
    </span>
    <span class="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
      {{ title }}
    </span>
    <span class="mt-1 text-[10px] leading-tight text-zinc-400 dark:text-zinc-600">
      {{ hint }}
    </span>
  </li>
</template>
