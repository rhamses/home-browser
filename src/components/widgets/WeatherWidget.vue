<script setup lang="ts">
import WeatherIcon from '../WeatherIcon.vue'
import type { DetailedWeather } from '../../lib/weather'

defineProps<{
  detail: DetailedWeather
}>()

const metricClass =
  'rounded-lg border border-zinc-200/80 bg-white/70 px-2 py-1.5 text-center dark:border-zinc-700/80 dark:bg-zinc-900/50'
</script>

<template>
  <li
    class="rounded-xl border border-zinc-200/90 bg-white/80 p-3 shadow-sm dark:border-zinc-700/90 dark:bg-zinc-900/70"
  >
    <div class="flex items-start justify-between gap-2 border-b border-zinc-200/70 pb-2 dark:border-zinc-700/70">
      <div class="min-w-0">
        <p class="text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
          Tempo
        </p>
        <h4 class="truncate text-sm font-semibold text-zinc-900 dark:text-white">
          {{ detail.cityLabel }}
        </h4>
        <p class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
          {{ detail.current.desc }}
        </p>
      </div>
      <div class="flex h-9 w-9 shrink-0 items-center justify-center text-zinc-700 dark:text-zinc-200">
        <WeatherIcon :kind="detail.kind" />
      </div>
    </div>

    <div class="mt-2 flex items-baseline gap-1">
      <span class="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white">
        {{ detail.current.tempC }}
      </span>
      <span class="text-xs text-zinc-500 dark:text-zinc-400">°C</span>
      <span class="ml-auto text-[10px] text-zinc-400 dark:text-zinc-500">agora</span>
    </div>

    <dl class="mt-2 grid grid-cols-2 gap-1.5 text-[10px] leading-tight">
      <div :class="metricClass">
        <dt class="text-zinc-500 dark:text-zinc-400">Sensação</dt>
        <dd class="font-medium tabular-nums text-zinc-800 dark:text-zinc-100">
          {{ detail.current.feelsLikeC }}°C
        </dd>
      </div>
      <div :class="metricClass">
        <dt class="text-zinc-500 dark:text-zinc-400">Humidade</dt>
        <dd class="font-medium tabular-nums text-zinc-800 dark:text-zinc-100">
          {{ detail.current.humidity }}%
        </dd>
      </div>
      <div :class="metricClass">
        <dt class="text-zinc-500 dark:text-zinc-400">Vento</dt>
        <dd class="font-medium text-zinc-800 dark:text-zinc-100">
          {{ detail.current.windDir }} {{ detail.current.windKmph }} km/h
        </dd>
      </div>
      <div :class="metricClass">
        <dt class="text-zinc-500 dark:text-zinc-400">Pressão</dt>
        <dd class="font-medium tabular-nums text-zinc-800 dark:text-zinc-100">
          {{ detail.current.pressure }} mb
        </dd>
      </div>
      <div :class="metricClass">
        <dt class="text-zinc-500 dark:text-zinc-400">Visibilidade</dt>
        <dd class="font-medium tabular-nums text-zinc-800 dark:text-zinc-100">
          {{ detail.current.visibility }} km
        </dd>
      </div>
      <div :class="metricClass">
        <dt class="text-zinc-500 dark:text-zinc-400">UV · chuva</dt>
        <dd class="font-medium tabular-nums text-zinc-800 dark:text-zinc-100">
          {{ detail.current.uvIndex }} · {{ detail.current.precipMm }} mm
        </dd>
      </div>
    </dl>

    <div v-if="detail.hourly.length" class="mt-3 border-t border-zinc-200/70 pt-2 dark:border-zinc-700/70">
      <p class="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
        Próximas horas
      </p>
      <p class="mt-0.5 text-[9px] leading-tight text-zinc-400 dark:text-zinc-500">
        {{ detail.hourlySourceNote }}
      </p>
      <div
        class="mt-1.5 flex max-h-40 flex-col gap-1 overflow-y-auto overscroll-y-contain pr-0.5 text-[10px]"
      >
        <div
          v-for="(row, idx) in detail.hourly"
          :key="idx"
          class="flex shrink-0 items-center gap-2 rounded-md bg-zinc-100/80 px-2 py-1 dark:bg-zinc-800/60"
          :title="row.desc"
        >
          <span class="w-17 shrink-0 font-medium text-zinc-600 dark:text-zinc-300">
            {{ row.label }}
          </span>
          <span class="tabular-nums font-semibold text-zinc-900 dark:text-white">
            {{ row.tempC }}°
          </span>
          <span class="text-zinc-500 dark:text-zinc-400">sens. {{ row.feelsLikeC }}°</span>
          <span class="ml-auto text-zinc-500 dark:text-zinc-400">{{ row.humidity }}%</span>
        </div>
      </div>
    </div>
    <p v-else class="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
      Sem previsão horária disponível.
    </p>
  </li>
</template>
