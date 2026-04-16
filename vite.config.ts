import { Buffer } from 'node:buffer'
import path from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

/** Em `npm run dev`, contorna CORS ao pedir RSS ao destino real. */
const rssDevProxyPlugin: Plugin = {
  name: 'rss-dev-proxy',
  configureServer(server) {
    server.middlewares.use('/__rss', async (req, res, next) => {
      if (req.method !== 'GET') {
        next()
        return
      }
      try {
        const full = new URL(req.url ?? '', 'http://vite.local')
        const target = full.searchParams.get('url')
        if (!target) {
          res.statusCode = 400
          res.setHeader('content-type', 'text/plain; charset=utf-8')
          res.end('Parâmetro url em falta')
          return
        }
        if (!/^https?:\/\//i.test(target)) {
          res.statusCode = 400
          res.setHeader('content-type', 'text/plain; charset=utf-8')
          res.end('URL inválida')
          return
        }
        const r = await fetch(target, { redirect: 'follow' })
        const ab = await r.arrayBuffer()
        res.statusCode = r.status
        const ct = r.headers.get('content-type')
        if (ct) res.setHeader('content-type', ct)
        res.end(Buffer.from(ab))
      } catch (e) {
        res.statusCode = 502
        res.setHeader('content-type', 'text/plain; charset=utf-8')
        res.end(e instanceof Error ? e.message : 'Erro ao obter feed')
      }
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [rssDevProxyPlugin, tailwindcss(), vue(), crx({ manifest })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
