# Home Browser (Extensão)

Extensão (MV3) com Vue + Vite + Tailwind.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Gera a pasta `dist/`.

## Empacotar (Chrome / Edge / Firefox)

Os comandos abaixo geram ficheiros em `release/`:

```bash
npm run package:chrome
npm run package:edge
npm run package:firefox
```

- **Chrome / Edge**: gera `.zip` (submeter na store ou carregar manualmente).
- **Firefox**: gera `.xpi` (é um `.zip` com outra extensão).

## Carregar manualmente

- **Chrome / Edge**
  - Vá a `chrome://extensions`
  - Ative “Developer mode”
  - “Load unpacked” → selecione `dist/`

- **Firefox**
  - Vá a `about:debugging#/runtime/this-firefox`
  - “Load Temporary Add-on…” → selecione `dist/manifest.json`

