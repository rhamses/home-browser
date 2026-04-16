import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'

const root = process.cwd()
const distDir = path.join(root, 'dist')
const releaseDir = path.join(root, 'release')
const tmpDir = path.join(root, '.tmp-release')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf-8')
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function safeName(s) {
  return String(s || '').replace(/[^a-z0-9._-]+/gi, '-')
}

function usageAndExit() {
  // eslint-disable-next-line no-console
  console.error(
    'Usage: node scripts/package-extension.mjs <chrome|edge|firefox>\n' +
      'Build first: npm run build\n',
  )
  process.exit(2)
}

const target = process.argv[2]
if (!target || !['chrome', 'edge', 'firefox'].includes(target)) usageAndExit()

if (!fs.existsSync(distDir)) {
  // eslint-disable-next-line no-console
  console.error('dist/ not found. Run: npm run build')
  process.exit(2)
}

ensureDir(releaseDir)

const pkg = readJson(path.join(root, 'package.json'))
const manifest = readJson(path.join(distDir, 'manifest.json'))

const extName = safeName(manifest.name || pkg.name || 'extension')
const version = safeName(manifest.version || pkg.version || '0.0.0')

const ext = target === 'firefox' ? 'xpi' : 'zip'
const outFile = path.join(releaseDir, `${extName}-${target}-v${version}.${ext}`)

const output = fs.createWriteStream(outFile)
const archive = archiver('zip', { zlib: { level: 9 } })

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') return
  throw err
})
archive.on('error', (err) => {
  throw err
})

output.on('close', () => {
  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(root, outFile)} (${archive.pointer()} bytes)`)
})

archive.pipe(output)

let archiveSourceDir = distDir
if (target === 'firefox') {
  // Cópia isolada para o .xpi (manifest já vem com scripts + service_worker do build).
  fs.rmSync(tmpDir, { recursive: true, force: true })
  ensureDir(tmpDir)
  fs.cpSync(distDir, tmpDir, { recursive: true })
  archiveSourceDir = tmpDir
}

archive.directory(archiveSourceDir, false)
await archive.finalize()

