<script setup lang="ts">
const popupDevUrl = '/src/popup.html'
const newTabDevUrl = '/src/newtab.html'
</script>

<template>
  <div
    class="min-h-svh bg-linear-to-b from-zinc-950 via-zinc-900 to-violet-950/40 px-4 py-10 font-sans text-zinc-100 antialiased"
  >
    <div class="mx-auto max-w-lg">
      <header class="text-center">
        <p
          class="mb-2 inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300"
        >
          Modo desenvolvimento
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-white">
          Home Browser
        </h1>
        <p class="mt-2 text-sm text-zinc-400">
          Página inicial de teste — use com
          <code class="rounded bg-zinc-800 px-1.5 py-0.5 text-violet-300"
            >npm run dev</code
          >
        </p>
      </header>

      <section
        class="mt-8 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur"
      >
        <h2 class="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Atalhos
        </h2>
        <ul class="space-y-3 text-sm">
          <li>
            <a
              class="flex items-center justify-between rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-4 py-3 text-violet-300 transition hover:border-violet-500/50 hover:bg-zinc-800"
              :href="newTabDevUrl"
            >
              <span>Página inicial (nova aba)</span>
              <span aria-hidden="true">→</span>
            </a>
          </li>
          <li>
            <a
              class="flex items-center justify-between rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-4 py-3 text-violet-300 transition hover:border-violet-500/50 hover:bg-zinc-800"
              :href="popupDevUrl"
            >
              <span>Popup da extensão</span>
              <span aria-hidden="true">→</span>
            </a>
          </li>
          <li
            class="rounded-xl border border-dashed border-zinc-700 px-4 py-3 text-zinc-400"
          >
            <p class="font-medium text-zinc-300">Extensão no Chrome</p>
            <p class="mt-1 text-xs leading-relaxed">
              Carregue a pasta
              <code class="text-violet-300">dist</code> em
              <code class="text-violet-300">chrome://extensions</code>
              com o Vite rodando; depois recarregue a extensão ao mudar o
              código.
            </p>
          </li>
        </ul>
      </section>

      <p class="mt-8 text-center text-xs text-zinc-600">
        Esta página não faz parte do pacote da extensão; serve só para
        desenvolvimento local.
      </p>
    </div>
  </div>
</template>
