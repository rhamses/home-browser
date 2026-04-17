<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { FavoriteLink } from '../lib/bookmarksBar'
import { isExtensionFavoriteId } from '../lib/localFavorites'
import ReorderListDialog from './ReorderListDialog.vue'

const props = defineProps<{
  open: boolean
  items: FavoriteLink[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [ids: string[]]
  'remove-local': [id: string]
}>()

type Row = { id: string; title: string; url: string }

const localRows = ref<Row[]>([])

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      localRows.value = props.items.map((x) => ({
        id: x.id,
        title: x.title,
        url: x.url,
      }))
      await nextTick()
    }
  },
)

watch(
  () => props.items,
  (items) => {
    if (!props.open) return
    const byId = new Map(items.map((i) => [i.id, i]))
    localRows.value = localRows.value
      .filter((r) => byId.has(r.id))
      .map((r) => {
        const i = byId.get(r.id)!
        return { id: i.id, title: i.title, url: i.url }
      })
  },
  { deep: true },
)

function moveUp(i: number) {
  if (i <= 0) return
  const rows = [...localRows.value]
  ;[rows[i - 1], rows[i]] = [rows[i]!, rows[i - 1]!]
  localRows.value = rows
}

function moveDown(i: number) {
  if (i >= localRows.value.length - 1) return
  const rows = [...localRows.value]
  ;[rows[i], rows[i + 1]] = [rows[i + 1]!, rows[i]!]
  localRows.value = rows
}

function onSave() {
  emit(
    'save',
    localRows.value.map((r) => r.id),
  )
  emit('update:open', false)
}

function onRemoveFavorite(i: number) {
  const row = localRows.value[i]
  if (!row || !isExtensionFavoriteId(row.id)) return
  emit('remove-local', row.id)
  localRows.value = localRows.value.filter((_, j) => j !== i)
}
</script>

<template>
  <ReorderListDialog
    :open="open"
    title="Ordene favoritos"
    description="Use as setas para mudar a ordem dos sites na faixa de favoritos (locais e da barra do navegador)."
    @update:open="emit('update:open', $event)"
    @save="onSave"
  >
    <p
      v-if="open && !localRows.length"
      class="px-2 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
    >
      Nenhum favorito para ordenar.
    </p>
    <ul v-else class="space-y-1">
      <li
        v-for="(row, i) in localRows"
        :key="row.id"
        class="flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-2 py-2 dark:border-zinc-700/80 dark:bg-zinc-800/50"
      >
        <div class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
            {{ row.title }}
          </span>
          <span class="mt-0.5 block truncate text-[10px] text-zinc-500 dark:text-zinc-400">
            {{ row.url }}
          </span>
          <button
            v-if="isExtensionFavoriteId(row.id)"
            type="button"
            class="mt-1.5 text-left text-xs font-medium text-red-600 underline decoration-red-600/60 underline-offset-2 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            @click="onRemoveFavorite(i)"
          >
            remover favorito
          </button>
        </div>
        <div class="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            class="rounded border border-zinc-300/90 bg-white px-1.5 py-0.5 text-xs text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            :disabled="i === 0"
            aria-label="Mover para cima"
            @click="moveUp(i)"
          >
            ↑
          </button>
          <button
            type="button"
            class="rounded border border-zinc-300/90 bg-white px-1.5 py-0.5 text-xs text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            :disabled="i >= localRows.length - 1"
            aria-label="Mover para baixo"
            @click="moveDown(i)"
          >
            ↓
          </button>
        </div>
      </li>
    </ul>
  </ReorderListDialog>
</template>
