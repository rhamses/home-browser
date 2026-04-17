<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  description?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: []
  cancel: []
}>()

const panelRef = ref<HTMLElement | null>(null)

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      panelRef.value?.focus()
    }
  },
)

function close() {
  emit('update:open', false)
  emit('cancel')
}

function onSave() {
  emit('save')
}

function onOverlayClick() {
  close()
}

function onKeydownEscape(e: KeyboardEvent) {
  e.preventDefault()
  close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-show="open"
      class="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        class="absolute inset-0 bg-zinc-900/50 backdrop-blur-[2px]"
        aria-label="Fechar"
        @click="onOverlayClick"
      />
      <div
        ref="panelRef"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        class="relative z-[201] flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl outline-none dark:border-zinc-700/90 dark:bg-zinc-900"
        @keydown.escape="onKeydownEscape"
      >
        <div class="border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-700/80">
          <h2 class="text-base font-semibold text-zinc-900 dark:text-white">
            {{ title }}
          </h2>
          <p v-if="description" class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {{ description }}
          </p>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <slot />
        </div>

        <div
          class="flex flex-col gap-2 border-t border-zinc-200/80 bg-zinc-50/80 px-3 py-3 dark:border-zinc-700/80 dark:bg-zinc-900/80"
        >
          <slot name="footerExtra" />
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg border border-zinc-300/90 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              @click="close"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
              @click="onSave"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
