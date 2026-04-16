import { Buffer } from 'node:buffer'
import fs from 'node:fs'
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

/**
 * AMO / addons-linter exige `background.scripts` como fallback quando existe
 * `service_worker` (Firefox). O Chrome 121+ ignora `scripts`.
 * @see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background
 */
function dualBackgroundForMozilla(): Plugin {
  return {
    name: 'dual-background-firefox-amo',
    writeBundle(options) {
      const outDir = options.dir ?? path.resolve('dist')
      const manifestPath = path.join(outDir, 'manifest.json')
      if (!fs.existsSync(manifestPath)) return
      const raw = fs.readFileSync(manifestPath, 'utf-8')
      const m = JSON.parse(raw) as {
        background?: { service_worker?: string; scripts?: string[]; type?: string }
      }
      const sw = m.background?.service_worker
      if (typeof sw === 'string' && sw.length > 0 && !m.background?.scripts?.length) {
        m.background = { ...m.background, scripts: [sw], service_worker: sw, type: m.background?.type }
        fs.writeFileSync(manifestPath, `${JSON.stringify(m, null, 2)}\n`, 'utf-8')
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [rssDevProxyPlugin, tailwindcss(), vue(), crx({ manifest }), dualBackgroundForMozilla()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
