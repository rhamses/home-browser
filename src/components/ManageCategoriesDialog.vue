<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { normalizeFeedUrl } from '../lib/customNewsFeeds'
import type { NewsFeedsSchema } from '../lib/newsFeeds'
import type { SelectedFeedEntry } from '../lib/selectedNewsFeeds'

type FeedRow = { slug: string; url: string; key: string; siteName: string }
type CategoryRow = {
  slug: string
  name: string
  iconSvg?: string
  feeds: FeedRow[]
}

const props = defineProps<{
  open: boolean
  catalog: NewsFeedsSchema | null
  initialSelected: SelectedFeedEntry[]
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [entries: SelectedFeedEntry[]]
}>()

const panelRef = ref<HTMLElement | null>(null)
const selectedKeys = ref<Set<string>>(new Set())

function keyFor(slug: string, url: string): string {
  return `${slug}::${normalizeFeedUrl(url) ?? url.trim()}`
}

function siteNameFromUrl(url: string): string {
  try {
    return new URL(normalizeFeedUrl(url) ?? url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const categories = computed<CategoryRow[]>(() => {
  const schema = props.catalog
  if (!schema) return []
  return (schema.categories ?? []).map((c) => {
    const urls = schema.feeds?.[c.slug] ?? []
    const feeds = urls.map((url) => ({
      slug: c.slug,
      url,
      key: keyFor(c.slug, url),
      siteName: siteNameFromUrl(url),
    }))
    return {
      slug: c.slug,
      name: c.name,
      iconSvg: c.iconSvg,
      feeds,
    }
  })
})

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    // Se não houver seleção guardada, assume tudo selecionado.
    const init = props.initialSelected ?? []
    if (init.length) {
      selectedKeys.value = new Set(init.map((x) => keyFor(x.slug, x.url)))
    } else {
      selectedKeys.value = new Set(
        categories.value.flatMap((c) => c.feeds.map((f) => f.key)),
      )
    }
    await nextTick()
    panelRef.value?.focus()
  },
)

watch(
  () => props.catalog,
  () => {
    if (!props.open) return
    const init = props.initialSelected ?? []
    if (!init.length) {
      selectedKeys.value = new Set(
        categories.value.flatMap((c) => c.feeds.map((f) => f.key)),
      )
    }
  },
)

function close() {
  emit('update:open', false)
}

function toggleFeed(key: string, checked: boolean) {
  const next = new Set(selectedKeys.value)
  if (checked) next.add(key)
  else next.delete(key)
  selectedKeys.value = next
}

function onSave() {
  const out: SelectedFeedEntry[] = []
  for (const c of categories.value) {
    for (const f of c.feeds) {
      if (selectedKeys.value.has(f.key)) {
        out.push({ slug: f.slug, url: f.url })
      }
    }
  }
  emit('save', out)
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
        aria-labelledby="manage-categories-title"
        class="relative z-[221] w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl outline-none dark:border-zinc-700/90 dark:bg-zinc-900"
        @keydown.escape.prevent="close"
      >
        <div class="border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-700/80">
          <h2
            id="manage-categories-title"
            class="text-base font-semibold text-zinc-900 dark:text-white"
          >
            Gerencie Categorias
          </h2>
          <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Expanda cada categoria e selecione os feeds que quer ver. Clique em
            «Salvar e Atualizar» para aplicar no app.
          </p>
        </div>

        <div class="max-h-[min(70vh,34rem)] overflow-y-auto px-4 py-4">
          <p
            v-if="loading"
            class="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-3 py-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-300"
          >
            A carregar catálogo de feeds…
          </p>
          <p
            v-else-if="error"
            class="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
          >
            {{ error }}
          </p>
          <p
            v-else-if="!categories.length"
            class="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-3 py-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-300"
          >
            Nenhuma categoria disponível.
          </p>

          <ul v-else class="grid gap-3 lg:grid-cols-2">
            <li
              v-for="cat in categories"
              :key="cat.slug"
              class="overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-50/70 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-800/40"
            >
              <details class="group" :open="true">
                <summary
                  class="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-left marker:hidden"
                >
                  <span
                    v-if="cat.iconSvg"
                    class="inline-flex h-10 w-10 shrink-0 items-center justify-center [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                    v-html="cat.iconSvg"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                      {{ cat.name }}
                    </p>
                    <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {{ cat.feeds.length }} feed<span v-if="cat.feeds.length !== 1">s</span>
                    </p>
                  </div>
                  <span class="text-xs text-zinc-400 transition group-open:rotate-180">
                    v
                  </span>
                </summary>

                <div class="border-t border-zinc-200/70 px-4 py-3 dark:border-zinc-700/70">
                  <ul class="space-y-2">
                    <li
                      v-for="feed in cat.feeds"
                      :key="feed.key"
                      class="rounded-lg border border-zinc-200/70 bg-white/70 px-3 py-2 dark:border-zinc-700/70 dark:bg-zinc-900/30"
                    >
                      <label class="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          class="mt-0.5 h-4 w-4 rounded border-zinc-400 bg-white text-violet-600 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-950"
                          :checked="selectedKeys.has(feed.key)"
                          @change="
                            toggleFeed(
                              feed.key,
                              ($event.target as HTMLInputElement).checked,
                            )
                          "
                        >
                        <div class="min-w-0">
                          <p class="truncate text-sm font-medium text-zinc-900 dark:text-white">
                            {{ feed.siteName }}
                          </p>
                          <p class="mt-0.5 break-all text-xs text-zinc-500 dark:text-zinc-400">
                            {{ feed.url }}
                          </p>
                        </div>
                      </label>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
          </ul>
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
            class="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="loading || !!error || !categories.length"
            @click="onSave"
          >
            Salvar e Atualizar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

