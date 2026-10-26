# Vesper Technical Documentation

Documentation site for Vesper, built with [VitePress](https://vitepress.dev).

## Run locally

```bash
npm install
npm run docs:dev
```

Open the address shown in the terminal (usually `http://localhost:5173`).

## Build

```bash
npm run docs:build
npm run docs:preview
```

## Deploy on Vercel

| Setting | Value |
|---|---|
| Framework preset | VitePress |
| Build command | `npm run docs:build` |
| Output directory | `.vitepress/dist` |
