<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import {
  parseYoutubePlaylistIdFromUrl,
  type WidgetsConfig,
} from '../lib/widgetConfig'

const props = defineProps<{
  open: boolean
  initialConfig: WidgetsConfig
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [cfg: WidgetsConfig]
}>()

const panelRef = ref<HTMLElement | null>(null)
const youtubePlaylistUrl = ref('')
const youtubePlaylistError = ref('')

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    youtubePlaylistError.value = ''
    youtubePlaylistUrl.value = props.initialConfig.youtubePlaylistUrl ?? ''
    await nextTick()
    panelRef.value?.focus()
  },
)

function close() {
  emit('update:open', false)
}

function onSave() {
  youtubePlaylistError.value = ''
  const url = youtubePlaylistUrl.value.trim()
  const playlistId = url ? parseYoutubePlaylistIdFromUrl(url) : null
  if (url && !playlistId) {
    youtubePlaylistError.value = 'URL inválida. Cole o link da playlist do YouTube.'
    return
  }
  emit('save', {
    youtubePlaylistId: playlistId,
    youtubePlaylistUrl: url || null,
  })
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-show="open"
      class="fixed inset-0 z-[220] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        class="absolute inset-0 bg-zinc-950/45 backdrop-blur-[2px]"
        aria-label="Fechar"
        @click="close"
      />
      <div
        ref="panelRef"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-widgets-title"
        class="relative z-[221] w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl outline-none dark:border-zinc-700/90 dark:bg-zinc-900"
        @keydown.escape.prevent="close"
      >
        <div class="border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-700/80">
          <h2
            id="manage-widgets-title"
            class="text-base font-semibold text-zinc-900 dark:text-white"
          >
            Gerenciar Widgets
          </h2>
          <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Tempo e Wikipedia aparecem automaticamente. O YouTube só aparece se
            uma playlist for configurada.
          </p>
        </div>

        <div class="px-4 py-4">
          <div class="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-700/80 dark:bg-zinc-800/40">
            <label
              class="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
              for="yt-playlist-url-manage"
            >
              Playlist do YouTube (opcional)
            </label>
            <input
              id="yt-playlist-url-manage"
              v-model="youtubePlaylistUrl"
              type="url"
              inputmode="url"
              placeholder="https://www.youtube.com/playlist?list=PL..."
              class="w-full rounded-lg border border-zinc-300/90 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-white"
            />
            <p v-if="youtubePlaylistError" class="mt-2 text-sm text-red-600 dark:text-red-300">
              {{ youtubePlaylistError }}
            </p>
            <p v-else class="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Dica: copie o link com <code class="rounded bg-zinc-200/80 px-1 text-[11px] dark:bg-zinc-950">list=</code>.
            </p>
          </div>
        </div>

        <div
          class="flex items-center justify-end gap-2 border-t border-zinc-200/80 bg-zinc-50/80 px-3 py-3 dark:border-zinc-700/80 dark:bg-zinc-900/80"
        >
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
            Salvar e Atualizar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

