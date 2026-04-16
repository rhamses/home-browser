<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import NewsCard from './NewsCard.vue'
import WeatherWidget from './widgets/WeatherWidget.vue'
import WikipediaOnThisDayWidget from './widgets/WikipediaOnThisDayWidget.vue'
import YoutubePlaylistLatestWidget from './widgets/YoutubePlaylistLatestWidget.vue'
import WidgetsColumn from './widgets/WidgetsColumn.vue'
import type { FavoriteLink } from '../lib/bookmarksBar'
import {
  loadCustomFeeds,
  mergeNewsFeedsWithCustom,
  normalizeFeedUrl,
} from '../lib/customNewsFeeds'
import {
  loadCategoryOrder,
  orderNewsCategories,
} from '../lib/newsCategoryOrder'
import { mergeExtraFeedsIntoSchema } from '../lib/extraCategoryFeeds'
import { applySuppressedFeeds } from '../lib/suppressedFeedUrls'
import {
  loadRemovedCategorySlugs,
  stripRemovedCategories,
} from '../lib/newsCategoryRemoved'
import { fetchCategoryArticles } from '../lib/rssItems'
import { loadNewsFeedsConfig, type NewsFeedsSchema } from '../lib/newsFeeds'
import type { NewsArticle } from '../types/newsArticle'
import type { DetailedWeather } from '../lib/weather'

const props = defineProps<{
  weatherDetail: DetailedWeather
  favorites: FavoriteLink[]
}>()

type TabItem = { id: string; label: string; iconSvg?: string }

const iconSvgGames =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' aria-hidden='true'><path fill='#7B1FA2' d='M6 11h4v9H6z'/><path fill='#9C27B0' d='M14 8h4v12h-4z'/><path fill='#E1BEE7' d='M10 14h4v6h-4z'/><circle cx='9' cy='9' r='2' fill='#FFD54F'/><path fill='#5E35B1' d='M4 20h16v2H4z'/></svg>"

const iconSvgChat =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' aria-hidden='true'><path fill='#00897B' d='M4 4h16v12H7l-3 3V4z'/><path fill='#4DB6AC' d='M7 7h10v2H7zm0 4h7v2H7z'/><circle cx='18' cy='18' r='4' fill='#26A69A'/><path fill='#E0F2F1' d='M17 17h2v2h-2z'/></svg>"

const iconSvgFavorites =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' aria-hidden='true'><path fill='#F9A825' d='M12 17.3l-5.2 3 1-5.9-4.3-4.2 6-0.9L12 4l2.7 5.3 6 0.9-4.3 4.2 1 5.9z'/><path fill='#FFF8E1' d='M12 15.9l3.2 1.8-.6-3.6 2.6-2.5-3.6-.5L12 7.9l-1.6 3.2-3.6.5 2.6 2.5-.6 3.6z' opacity='.9'/></svg>"

const feedsConfig = ref<NewsFeedsSchema | null>(null)
const feedsError = ref<string | null>(null)

const articlesBySlug = ref<Record<string, NewsArticle[]>>({})
const newsLoadingSlug = ref<string | null>(null)
const newsErrors = ref<Record<string, string | undefined>>({})
let loadGeneration = 0

function hostnameFromUrl(url: string): string | undefined {
  try {
    return new URL(normalizeFeedUrl(url) ?? url).hostname
  } catch {
    return undefined
  }
}

const favoriteArticles = computed<NewsArticle[]>(() =>
  (props.favorites ?? []).map((f) => ({
    id: `fav-${f.id}`,
    title: f.title,
    link: f.url,
    summary: f.url,
    pubDate: 0,
    pubLabel: '',
    sourceLabel: hostnameFromUrl(f.url) ?? 'Favoritos',
  })),
)

const tabs = computed<TabItem[]>(() => {
  const fromJson =
    feedsConfig.value?.categories.map((c) => ({
      id: c.slug,
      label: c.name,
      iconSvg: c.iconSvg,
    })) ?? []
  return [
    ...fromJson,
    { id: 'games', label: 'Jogos', iconSvg: iconSvgGames },
    { id: 'chat', label: 'Chat', iconSvg: iconSvgChat },
    { id: 'favorites', label: 'Favoritos', iconSvg: iconSvgFavorites },
  ]
})

const activeTab = ref<string>('games')

function isCategorySlug(slug: string): boolean {
  return !!feedsConfig.value?.categories.some((c) => c.slug === slug)
}

async function loadArticlesForCategory(slug: string) {
  const urls = feedsConfig.value?.feeds[slug] ?? []
  if (!urls.length) {
    articlesBySlug.value = { ...articlesBySlug.value, [slug]: [] }
    newsErrors.value = { ...newsErrors.value, [slug]: undefined }
    return
  }
  const gen = ++loadGeneration
  newsLoadingSlug.value = slug
  newsErrors.value = { ...newsErrors.value, [slug]: undefined }
  try {
    const list = await fetchCategoryArticles(urls)
    if (gen !== loadGeneration) return
    articlesBySlug.value = { ...articlesBySlug.value, [slug]: list }
  } catch (e) {
    if (gen !== loadGeneration) return
    const msg = e instanceof Error ? e.message : 'Erro ao carregar notícias'
    newsErrors.value = { ...newsErrors.value, [slug]: msg }
    articlesBySlug.value = { ...articlesBySlug.value, [slug]: [] }
  } finally {
    if (gen === loadGeneration) newsLoadingSlug.value = null
  }
}

function selectTab(tab: TabItem) {
  activeTab.value = tab.id
  if (!feedsConfig.value || !isCategorySlug(tab.id)) return
  void loadArticlesForCategory(tab.id)
}

async function applyFeedsConfig(): Promise<void> {
  try {
    const base = await loadNewsFeedsConfig()
    const merged = mergeNewsFeedsWithCustom(base, loadCustomFeeds())
    const stripped = stripRemovedCategories(merged, loadRemovedCategorySlugs())
    const withExtras = mergeExtraFeedsIntoSchema(stripped)
    const afterSuppress = applySuppressedFeeds(withExtras)
    const ordered = orderNewsCategories(
      afterSuppress.categories,
      loadCategoryOrder(),
    )
    feedsConfig.value = { ...afterSuppress, categories: ordered }
    feedsError.value = null
  } catch (e) {
    feedsError.value = e instanceof Error ? e.message : 'Erro ao carregar feeds'
    feedsConfig.value = { categories: [], feeds: {} }
  }
}

async function reloadFeedsConfig(selectSlug?: string): Promise<void> {
  await applyFeedsConfig()
  const cfg = feedsConfig.value
  if (!cfg?.categories.length) {
    activeTab.value = 'games'
    return
  }
  if (selectSlug && isCategorySlug(selectSlug)) {
    activeTab.value = selectSlug
    await loadArticlesForCategory(selectSlug)
    return
  }
  if (activeTab.value && isCategorySlug(activeTab.value)) {
    await loadArticlesForCategory(activeTab.value)
    return
  }
  const first = cfg.categories[0].slug
  activeTab.value = first ?? 'games'
  if (first) await loadArticlesForCategory(first)
}

onMounted(async () => {
  await applyFeedsConfig()
  const cfg = feedsConfig.value
  if (!cfg?.categories.length) {
    activeTab.value = 'games'
    return
  }
  const first = cfg.categories[0].slug
  activeTab.value = first ?? 'games'
  if (first) await loadArticlesForCategory(first)
})

function getOrderableCategories(): {
  slug: string
  name: string
  feedUrls: string[]
}[] {
  const cfg = feedsConfig.value
  if (!cfg) return []
  return cfg.categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    feedUrls: [...(cfg.feeds[c.slug] ?? [])],
  }))
}

defineExpose({ reloadFeedsConfig, getOrderableCategories })

/** Exemplo — substituir por API ou links reais depois. */
const gameCards = [
  {
    id: 'g1',
    title: 'Wordle',
    body: 'Adivinha a palavra em seis tentativas. Um desafio rápido por dia.',
    meta: 'Palavras · 5 min',
  },
  {
    id: 'g2',
    title: '2048',
    body: 'Junta peças com o mesmo número até chegares ao 2048.',
    meta: 'Puzzle · casual',
  },
  {
    id: 'g3',
    title: 'Chess.com',
    body: 'Partidas online, puzzles e lições — ideal para treinar tática.',
    meta: 'Estratégia · multijogador',
  },
]

const cardArticle =
  'rounded-2xl border border-zinc-200/90 bg-white/90 p-5 shadow-md shadow-zinc-900/5 backdrop-blur-sm transition hover:border-violet-300/60 hover:shadow-lg dark:border-zinc-700/90 dark:bg-zinc-900/70 dark:shadow-black/20 dark:hover:border-violet-500/40'

const masonryClass =
  'columns-1 gap-x-4 [column-fill:_balance] sm:columns-2 xl:columns-4'
</script>

<template>
  <section
    class="mx-auto mt-0 flex w-full max-w-4/5 flex-1 flex-col rounded-2xl border border-zinc-200/80 bg-white/55 px-4 pb-8 pt-6 shadow-xl shadow-zinc-900/10 dark:border-zinc-800/80 dark:bg-zinc-950/50 dark:shadow-black/30 sm:px-6 sm:pt-8"
    aria-label="Conteúdo Home Browser">
    <header class="mb-6 flex flex-wrap items-center gap-3 sm:gap-4">
      <nav class="flex min-w-0 flex-1 justify-start" aria-label="Secções principais">
        <ul class="flex max-w-full gap-1 overflow-x-auto p-1" role="tablist">
          <li v-for="tab in tabs" :key="tab.id" class="shrink-0">
            <button :id="`tab-${tab.id}`" type="button" role="tab"
              class="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition sm:px-4" :class="activeTab === tab.id
                ? 'bg-white text-violet-700 shadow-sm dark:bg-zinc-800 dark:text-violet-300'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                " :aria-selected="activeTab === tab.id" :aria-controls="`panel-${tab.id}`"
              :tabindex="activeTab === tab.id ? 0 : -1" @click="selectTab(tab)">
              <span v-if="tab.iconSvg"
                class="inline-flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:max-w-none"
                v-html="tab.iconSvg" />
              <span class="whitespace-nowrap">{{ tab.label }}</span>
            </button>
          </li>
        </ul>
      </nav>
    </header>

    <p v-if="feedsError"
      class="mb-4 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
      {{ feedsError }}
    </p>

    <div class="grid w-full min-w-0 gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,1fr)] lg:items-start lg:gap-5">
      <div class="min-w-0">
        <template v-for="cat in feedsConfig?.categories ?? []" :key="cat.slug">
          <div v-show="activeTab === cat.slug" :id="`panel-${cat.slug}`" role="tabpanel"
            :aria-labelledby="`tab-${cat.slug}`" :aria-hidden="activeTab !== cat.slug" class="min-h-48">
            <p v-if="newsLoadingSlug === cat.slug" class="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
              A carregar notícias…
            </p>
            <template v-else>
              <p v-if="newsErrors[cat.slug]"
                class="mb-4 rounded-lg border border-red-200/90 bg-red-50/90 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
                {{ newsErrors[cat.slug] }}
              </p>
              <div v-else-if="(articlesBySlug[cat.slug] ?? []).length" :class="masonryClass">
                <NewsCard v-for="a in articlesBySlug[cat.slug] ?? []" :key="a.id" :article="a" />
              </div>
              <p v-else
                class="rounded-2xl border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <template v-if="(feedsConfig?.feeds[cat.slug] ?? []).length">
                  Nenhum artigo encontrado nos feeds de «{{ cat.name }}».
                </template>
                <template v-else>
                  Nenhum feed configurado para «{{ cat.name }}».
                </template>
              </p>
            </template>
          </div>
        </template>

        <div v-show="activeTab === 'games'" id="panel-games" role="tabpanel" aria-labelledby="tab-games"
          :aria-hidden="activeTab !== 'games'" class="min-h-48">
          <p class="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Sugestões em destaque — cada item abre numa nova aba quando tiveres links
            configurados.
          </p>
          <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <li v-for="g in gameCards" :key="g.id">
              <article :class="cardArticle">
                <h3 class="font-semibold text-zinc-900 dark:text-white">
                  {{ g.title }}
                </h3>
                <p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {{ g.body }}
                </p>
                <p class="mt-3 text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
                  {{ g.meta }}
                </p>
              </article>
            </li>
          </ul>
        </div>

        <div v-show="activeTab === 'chat'" id="panel-chat" role="tabpanel" aria-labelledby="tab-chat"
          :aria-hidden="activeTab !== 'chat'" class="min-h-48">
          <article :class="cardArticle" class="mx-auto max-w-md text-center">
            <h3 class="font-semibold text-zinc-900 dark:text-white">Chat</h3>
            <p class="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Esta secção está em desenvolvimento. Em breve poderás conversar ou ver
              resumos aqui.
            </p>
            <p class="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
              Estado: em construção
            </p>
          </article>
        </div>

        <div
          v-show="activeTab === 'favorites'"
          id="panel-favorites"
          role="tabpanel"
          aria-labelledby="tab-favorites"
          :aria-hidden="activeTab !== 'favorites'"
          class="min-h-48"
        >
          <p
            v-if="!favoriteArticles.length"
            class="rounded-2xl border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            Nenhum favorito encontrado.
          </p>
          <div v-else :class="masonryClass">
            <NewsCard v-for="a in favoriteArticles" :key="a.id" :article="a" />
          </div>
        </div>
      </div>

      <WidgetsColumn>
        <WeatherWidget :detail="props.weatherDetail" />
        <YoutubePlaylistLatestWidget />
        <WikipediaOnThisDayWidget />
      </WidgetsColumn>
    </div>
  </section>
</template>
