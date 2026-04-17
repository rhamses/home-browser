<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

export type OrderableCategoryItem = {
  slug: string
  name: string
  feedUrls?: string[]
  /** Secções fixas (Jogos, Chat, Favoritos): sem feeds; «apagar» oculta na barra. */
  fixedMain?: boolean
}

const props = defineProps<{
  open: boolean
  items: OrderableCategoryItem[]
  /** Mostra botão para voltar a mostrar secções fixas ocultas. */
  hasHiddenFixedTabs?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [slugs: string[]]
  'remove-category-feed': [payload: { slug: string; url: string }]
  'restore-fixed-tabs': []
}>()

type LocalRow = { slug: string; name: string; feedUrls: string[]; fixedMain?: boolean }

function rowFixed(r: LocalRow): boolean {
  return r.fixedMain === true
}

const localRows = ref<LocalRow[]>([])
const panelRef = ref<HTMLElement | null>(null)

const listFeedsOpen = ref(false)
const listFeedsSlug = ref('')
const listFeedsTitle = ref('')
const feedsListPanelRef = ref<HTMLElement | null>(null)

const urlsInListModal = computed(() => {
  const r = localRows.value.find((x) => x.slug === listFeedsSlug.value)
  return r?.feedUrls ?? []
})

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      listFeedsOpen.value = false
      listFeedsSlug.value = ''
      localRows.value = props.items.map((x) => ({
        slug: x.slug,
        name: x.name,
        feedUrls: [...(x.feedUrls ?? [])],
        fixedMain: x.fixedMain === true,
      }))
      await nextTick()
      panelRef.value?.focus()
    }
  },
)

watch(
  () => props.items,
  (items) => {
    if (!props.open) return
    /** Sincronização completa com o pai (ex.: secções fixas após «Restaurar para o padrão inicial»). */
    localRows.value = items.map((x) => ({
      slug: x.slug,
      name: x.name,
      feedUrls: [...(x.feedUrls ?? [])],
      fixedMain: x.fixedMain === true,
    }))
  },
  { deep: true },
)

watch(listFeedsOpen, async (v) => {
  if (v) await nextTick().then(() => feedsListPanelRef.value?.focus())
})

function close() {
  listFeedsOpen.value = false
  emit('update:open', false)
}

function closeFeedsListOnly() {
  listFeedsOpen.value = false
}

function onMainEscape() {
  if (listFeedsOpen.value) {
    listFeedsOpen.value = false
    return
  }
  close()
}

function moveUp(i: number) {
  if (i <= 0) return
  const rows = localRows.value
  if (rowFixed(rows[i]!) && !rowFixed(rows[i - 1]!)) return
  if (!rowFixed(rows[i]!) && rowFixed(rows[i - 1]!)) return
  const next = [...rows]
  ;[next[i - 1], next[i]] = [next[i]!, next[i - 1]!]
  localRows.value = next
}

function moveDown(i: number) {
  if (i >= localRows.value.length - 1) return
  const rows = localRows.value
  if (!rowFixed(rows[i]!) && rowFixed(rows[i + 1]!)) return
  if (rowFixed(rows[i]!) && !rowFixed(rows[i + 1]!)) return
  const next = [...rows]
  ;[next[i], next[i + 1]] = [next[i + 1]!, next[i]!]
  localRows.value = next
}

function moveUpDisabled(i: number): boolean {
  if (i <= 0) return true
  const rows = localRows.value
  if (rowFixed(rows[i]!) && !rowFixed(rows[i - 1]!)) return true
  if (!rowFixed(rows[i]!) && rowFixed(rows[i - 1]!)) return true
  return false
}

function moveDownDisabled(i: number): boolean {
  if (i >= localRows.value.length - 1) return true
  const rows = localRows.value
  if (!rowFixed(rows[i]!) && rowFixed(rows[i + 1]!)) return true
  if (rowFixed(rows[i]!) && !rowFixed(rows[i + 1]!)) return true
  return false
}

function removeRow(i: number) {
  localRows.value = localRows.value.filter((_, j) => j !== i)
}

function openListFeeds(row: LocalRow) {
  listFeedsSlug.value = row.slug
  listFeedsTitle.value = row.name
  listFeedsOpen.value = true
}

function onRemoveFeedClick(url: string) {
  emit('remove-category-feed', { slug: listFeedsSlug.value, url })
}

function onSave() {
  emit(
    'save',
    localRows.value.map((r) => r.slug),
  )
  listFeedsOpen.value = false
  emit('update:open', false)
}

function onRestoreFixedTabs() {
  emit('restore-fixed-tabs')
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
        @click="close"
      />
      <div
        ref="panelRef"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-order-title"
        class="relative z-[201] w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl outline-none dark:border-zinc-700/90 dark:bg-zinc-900"
        @keydown.escape.prevent="onMainEscape"
      >
        <div class="border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-700/80">
          <h2
            id="category-order-title"
            class="text-base font-semibold text-zinc-900 dark:text-white"
          >
            Ordenar categorias de notícias
          </h2>
          <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Use as setas para mudar a ordem. As secções Jogos, Chat e Favoritos ficam
            depois das categorias de notícias; «apagar» nas notícias remove a categoria;
            nas secções fixas, oculta-as na barra até restaurar.
          </p>
        </div>

        <div class="max-h-[min(60vh,22rem)] overflow-y-auto px-2 py-2">
          <p
            v-if="open && !localRows.length"
            class="px-2 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
          >
            Nada para ordenar. Adicione feeds ou restaure as secções fixas.
          </p>
          <ul v-else class="space-y-1">
            <li
              v-for="(row, i) in localRows"
              :key="row.slug"
              class="flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-2 py-2 dark:border-zinc-700/80 dark:bg-zinc-800/50"
            >
              <div class="min-w-0 flex-1">
                <span class="block truncate text-sm text-zinc-800 dark:text-zinc-100">
                  {{ row.name }}
                </span>
                <div class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  <button
                    type="button"
                    class="text-left text-xs font-medium text-red-600 underline decoration-red-600/60 underline-offset-2 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    @click="removeRow(i)"
                  >
                    {{ row.fixedMain ? 'ocultar secção' : 'apagar categoria' }}
                  </button>
                  <button
                    v-if="!row.fixedMain"
                    type="button"
                    class="text-left text-xs font-medium text-sky-600 underline decoration-sky-600/60 underline-offset-2 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                    @click="openListFeeds(row)"
                  >
                    listar feeds
                  </button>
                </div>
              </div>
              <span class="shrink-0 text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {{ row.slug }}
              </span>
              <div class="flex shrink-0 flex-col gap-0.5">
                <button
                  type="button"
                  class="rounded border border-zinc-300/90 bg-white px-1.5 py-0.5 text-xs text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  :disabled="moveUpDisabled(i)"
                  aria-label="Mover para cima"
                  @click="moveUp(i)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  class="rounded border border-zinc-300/90 bg-white px-1.5 py-0.5 text-xs text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  :disabled="moveDownDisabled(i)"
                  aria-label="Mover para baixo"
                  @click="moveDown(i)"
                >
                  ↓
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div
          class="flex flex-col gap-2 border-t border-zinc-200/80 bg-zinc-50/80 px-3 py-3 dark:border-zinc-700/80 dark:bg-zinc-900/80"
        >
          <button
            v-if="hasHiddenFixedTabs"
            type="button"
            class="w-full rounded-lg border border-emerald-300/90 bg-emerald-50/90 px-3 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-900/50"
            aria-label="Restaurar para o padrão inicial"
            @click="onRestoreFixedTabs"
          >
            Restaurar para o padrão inicial
          </button>
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

      <!-- Popup secundário: feeds da categoria -->
      <div
        v-show="open && listFeedsOpen"
        class="pointer-events-none fixed inset-0 z-[202] flex items-center justify-center p-4"
        aria-hidden="true"
      >
        <div class="pointer-events-auto w-full max-w-lg">
          <button
            type="button"
            class="fixed inset-0 z-[203] bg-zinc-950/40 backdrop-blur-[1px]"
            aria-label="Fechar lista de feeds"
            @click="closeFeedsListOnly"
          />
          <div
            ref="feedsListPanelRef"
            tabindex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feeds-list-title"
            class="relative z-[204] max-h-[min(70vh,28rem)] overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl outline-none dark:border-zinc-700/90 dark:bg-zinc-900"
            @keydown.escape.prevent="closeFeedsListOnly"
          >
            <div class="border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-700/80">
              <h2
                id="feeds-list-title"
                class="text-base font-semibold text-zinc-900 dark:text-white"
              >
                Feeds — {{ listFeedsTitle }}
              </h2>
              <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                «apagar feed» remove de imediato (extra, categoria própria ou feed do JSON).
              </p>
            </div>
            <div class="max-h-[min(50vh,20rem)] overflow-y-auto px-3 py-2">
              <p
                v-if="!urlsInListModal.length"
                class="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400"
              >
                Nenhum feed nesta categoria.
              </p>
              <ul v-else class="space-y-2">
                <li
                  v-for="(u, idx) in urlsInListModal"
                  :key="`${listFeedsSlug}-${idx}-${u}`"
                  class="rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-2.5 py-2 dark:border-zinc-700/80 dark:bg-zinc-800/50"
                >
                  <p class="break-all text-xs text-zinc-800 dark:text-zinc-200">
                    {{ u }}
                  </p>
                  <button
                    type="button"
                    class="mt-1.5 text-left text-xs font-medium text-red-600 underline decoration-red-600/60 underline-offset-2 hover:text-red-700 dark:text-red-400"
                    @click="onRemoveFeedClick(u)"
                  >
                    apagar feed
                  </button>
                </li>
              </ul>
            </div>
            <div
              class="border-t border-zinc-200/80 bg-zinc-50/80 px-3 py-3 dark:border-zinc-700/80 dark:bg-zinc-900/80"
            >
              <button
                type="button"
                class="w-full rounded-lg border border-zinc-300/90 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                @click="closeFeedsListOnly"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
