<script setup lang="ts">
import type { WeatherKind } from '../lib/weather'

const props = defineProps<{
  kind: WeatherKind
}>()

const LABELS: Record<WeatherKind, string> = {
  'clear-day': 'Tempo ensolarado',
  'clear-night': 'Céu limpo à noite',
  'partly-day': 'Parcialmente nublado',
  'partly-night': 'Parcialmente nublado à noite',
  cloudy: 'Nublado',
  rain: 'Chuva',
  snow: 'Neve',
  thunder: 'Trovoada',
  fog: 'Neblina ou nevoeiro',
  unknown: 'Condição meteorológica indisponível',
}
</script>

<template>
  <span
    class="inline-flex h-5 w-5 shrink-0 text-sky-600 dark:text-sky-300"
    role="img"
    :aria-label="LABELS[props.kind]"
  >
    <!-- clear day -->
    <svg
      v-if="props.kind === 'clear-day'"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.5" />
      <path
        stroke-linecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>

    <!-- clear night -->
    <svg
      v-else-if="props.kind === 'clear-night'"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      />
    </svg>

    <!-- partly day -->
    <svg
      v-else-if="props.kind === 'partly-day'"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M8.5 14.5a4 4 0 0 1 6.3-4.9 3.5 3.5 0 1 0-6.2 4.9z"
      />
      <path
        stroke-linecap="round"
        d="M17 5v1M17 8v1M14 6.5h1M19 6.5h1"
      />
    </svg>

    <!-- partly night -->
    <svg
      v-else-if="props.kind === 'partly-night'"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M18 16a5 5 0 0 1-7.8-6.2 4 4 0 1 1 7.8 6.2z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M8.5 14.5a4 4 0 0 1 4.5-6.5"
      />
    </svg>

    <!-- cloudy -->
    <svg
      v-else-if="props.kind === 'cloudy'"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M6 18h12a4 4 0 0 0 .2-8 5.5 5.5 0 0 0-10.8 1.5A3.5 3.5 0 0 0 6 18z"
      />
    </svg>

    <!-- rain -->
    <svg
      v-else-if="props.kind === 'rain'"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M6 17h12a4 4 0 0 0 .2-8 5.5 5.5 0 0 0-10.8 1.5A3.5 3.5 0 0 0 6 17z"
      />
      <path stroke-linecap="round" d="M8 21v-2M12 21v-3M16 21v-2" />
    </svg>

    <!-- snow -->
    <svg
      v-else-if="props.kind === 'snow'"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M6 16h12a4 4 0 0 0 .2-8 5.5 5.5 0 0 0-10.8 1.5A3.5 3.5 0 0 0 6 16z"
      />
      <path
        stroke-linecap="round"
        d="M12 19v-4M12 15l2.2 2.2M12 15l-2.2 2.2M12 15l2.2-2.2M12 15l-2.2-2.2"
      />
    </svg>

    <!-- thunder -->
    <svg
      v-else-if="props.kind === 'thunder'"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M6 17h12a4 4 0 0 0 .2-8 5.5 5.5 0 0 0-10.8 1.5A3.5 3.5 0 0 0 6 17z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M13 9l-5 7h4l-2 5 6-8h-3l0-4z"
      />
    </svg>

    <!-- fog -->
    <svg
      v-else-if="props.kind === 'fog'"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      aria-hidden="true"
    >
      <path stroke-linecap="round" d="M4 14h16M4 10h16M6 18h12" />
    </svg>

    <!-- unknown -->
    <svg
      v-else
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M6 18h12a4 4 0 0 0 .2-8 5.5 5.5 0 0 0-10.8 1.5A3.5 3.5 0 0 0 6 18z"
        opacity="0.45"
      />
      <path stroke-linecap="round" d="M12 15v.01M12 11h.01" />
    </svg>
  </span>
</template>
