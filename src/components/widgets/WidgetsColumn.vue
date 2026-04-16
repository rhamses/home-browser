<script setup lang="ts">
withDefaults(
  defineProps<{
    ariaLabel?: string
  }>(),
  { ariaLabel: 'Widgets' },
)
</script>

<template>
  <aside class="min-w-0" :aria-label="ariaLabel">
    <ul class="flex flex-col gap-3">
      <slot />
    </ul>
  </aside>
</template>
