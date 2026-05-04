#!/usr/bin/env node
/**
 * render-diagrams.mjs
 *
 * Modos de uso:
 *
 *   node render-diagrams.mjs                        Renderiza SVGs (sin tocar los .md)
 *   node render-diagrams.mjs --patch                Renderiza SVGs y parchea los .md (muestra <img>)
 *   node render-diagrams.mjs --patch --theme github-light
 *   node render-diagrams.mjs --restore              Revierte los .md a bloques mermaid originales
 *   node render-diagrams.mjs --single ../TECHNICAL_SAD.md --patch
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs'
import { join, basename, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT       = resolve(__dirname, '..')
const DIAGRAMS   = join(ROOT, 'diagrams')

// ─── CLI ─────────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2)
const themeArg  = args.includes('--theme')   ? args[args.indexOf('--theme') + 1]  : 'tokyo-night'
const singleArg = args.includes('--single')  ? args[args.indexOf('--single') + 1] : null
const doPatch   = args.includes('--patch')
const doRestore = args.includes('--restore')

// Sentinel que enmarca cada bloque reemplazado en los .md
// Permite re-parchear y restaurar de forma idempotente
const SENTINEL_START = (svgName, origCode) =>
  `<!-- mermaid-render:${svgName}\n${origCode}\n-->`
const SENTINEL_RE = /<!-- mermaid-render:([^\n]+)\n([\s\S]*?)\n-->\n<img[^>]+>/g

// ─── beautiful-mermaid ───────────────────────────────────────────────────────
let renderMermaidSVG, THEMES
try {
  const mod = await import('beautiful-mermaid')
  renderMermaidSVG = mod.renderMermaidSVG
  THEMES = mod.THEMES
} catch {
  console.error('\n[ERROR] beautiful-mermaid no instalado.')
  console.error('Ejecutar: npm install  (en Documentacion/scripts/)\n')
  process.exit(1)
}

if (!doRestore && !THEMES[themeArg]) {
  console.error(`[ERROR] Tema "${themeArg}" no existe.`)
  console.error(`Disponibles: ${Object.keys(THEMES).join(', ')}`)
  process.exit(1)
}

const theme = THEMES[themeArg]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sanitize(s) {
  return s.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-')
}

function getDiagramType(code) {
  const clean = code.replace(/%%\{[\s\S]*?\}%%\n?/g, '').trim()
  const first = clean.split('\n')[0].trim()
  return sanitize(first.split(/[\s{]/)[0] || 'diagram')
}

function extractMermaidBlocks(content) {
  const blocks = []
  const re = /```mermaid\n([\s\S]*?)```/g
  let m
  while ((m = re.exec(content)) !== null) {
    blocks.push({ raw: m[0], code: m[1].trim(), offset: m.index })
  }
  return blocks
}

// ─── RESTORE MODE ────────────────────────────────────────────────────────────
function restoreFile(mdPath) {
  let content = readFileSync(mdPath, 'utf-8')
  let count = 0
  content = content.replace(SENTINEL_RE, (_match, _svgName, origCode) => {
    count++
    return '```mermaid\n' + origCode + '\n```'
  })
  if (count > 0) {
    writeFileSync(mdPath, content, 'utf-8')
    console.log(`  [RESTORED] ${basename(mdPath)} — ${count} bloque(s)`)
  } else {
    console.log(`  [SKIP]     ${basename(mdPath)} — nada que restaurar`)
  }
}

// ─── RENDER + PATCH MODE ─────────────────────────────────────────────────────
function processFile(mdPath) {
  let content = readFileSync(mdPath, 'utf-8')
  const fileBase = basename(mdPath, '.md')
  const blocks = extractMermaidBlocks(content)

  if (blocks.length === 0) {
    console.log(`  [SKIP]  ${basename(mdPath)} — sin bloques mermaid`)
    return
  }

  console.log(`\n  ${basename(mdPath)} — ${blocks.length} diagrama(s)`)

  // Proceso en reversa para no romper los offsets al reemplazar
  const patchList = []
  blocks.forEach((block, i) => {
    const num   = String(i + 1).padStart(2, '0')
    const type  = getDiagramType(block.code)
    const svgName = `${fileBase}-${num}-${type}.svg`
    const svgPath = join(DIAGRAMS, svgName)

    // Renderizar SVG
    try {
      const clean = block.code.replace(/%%\{[\s\S]*?\}%%\n?/g, '').trim()
      const svg = renderMermaidSVG(clean, theme)
      writeFileSync(svgPath, svg, 'utf-8')
      console.log(`    [SVG] ${svgName}`)
    } catch (e) {
      console.error(`    [FAIL] ${svgName}: ${e.message}`)
      return
    }

    if (doPatch) {
      // Construir el reemplazo: sentinel con código original + img
      const sentinel = SENTINEL_START(svgName, block.code)
      const imgTag   = `<img src="./diagrams/${svgName}" alt="${type} diagram" width="100%">`
      patchList.push({ raw: block.raw, replacement: `${sentinel}\n${imgTag}` })
    }
  })

  if (doPatch && patchList.length > 0) {
    // Reemplazar de atrás hacia adelante para conservar offsets
    let patched = content
    for (const { raw, replacement } of patchList.reverse()) {
      patched = patched.replace(raw, replacement)
    }
    writeFileSync(mdPath, patched, 'utf-8')
    console.log(`    [PATCHED] ${basename(mdPath)} — <img> embebidas`)
  }
}

// ─── INDEX HTML ──────────────────────────────────────────────────────────────
function buildIndex() {
  const svgFiles = readdirSync(DIAGRAMS).filter(f => f.endsWith('.svg')).sort()
  if (svgFiles.length === 0) return

  const cards = svgFiles.map(name => {
    const svg = readFileSync(join(DIAGRAMS, name), 'utf-8')
    const [file, num, ...rest] = name.replace('.svg','').split('-')
    return `
    <div class="card">
      <div class="card-header">
        <code class="tag">${file}.md</code>
        <span>#${num} — ${rest.join('-')}</span>
      </div>
      <div class="diagram">${svg}</div>
    </div>`
  }).join('\n')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Diagramas Menu Bites — ${themeArg}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Inter,system-ui,sans-serif;background:#0d1117;color:#e6edf3;padding:2rem}
    h1{font-size:1.4rem;margin-bottom:.25rem;color:#f0f6fc}
    .meta{color:#8b949e;font-size:.8rem;margin-bottom:2rem}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(560px,1fr));gap:1.5rem}
    .card{background:#161b22;border:1px solid #30363d;border-radius:8px;overflow:hidden}
    .card-header{padding:.6rem 1rem;border-bottom:1px solid #30363d;display:flex;gap:.75rem;align-items:center;font-size:.8rem;color:#8b949e}
    .tag{background:#21262d;border:1px solid #30363d;border-radius:4px;padding:1px 6px;font-size:.7rem}
    .diagram{padding:1rem;overflow:auto;background:#0d1117}
    .diagram svg{max-width:100%;height:auto}
  </style>
</head>
<body>
  <h1>Diagramas — Menu Bites</h1>
  <p class="meta">Tema: <code>${themeArg}</code> · ${svgFiles.length} diagramas · ${new Date().toLocaleString('es-CL')}</p>
  <div class="grid">${cards}</div>
</body>
</html>`

  const out = join(DIAGRAMS, 'index.html')
  writeFileSync(out, html, 'utf-8')
  return out
}

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
if (!existsSync(DIAGRAMS)) mkdirSync(DIAGRAMS, { recursive: true })

const mdFiles = singleArg
  ? [resolve(singleArg)]
  : readdirSync(ROOT)
      .filter(f => f.endsWith('.md') && f !== 'README.md')
      .map(f => join(ROOT, f))

if (doRestore) {
  console.log('\nrestaurando bloques mermaid originales...')
  console.log('='.repeat(50))
  mdFiles.forEach(restoreFile)
  console.log('\nListo. Los .md tienen los bloques ```mermaid``` de nuevo.\n')
} else {
  const mode = doPatch ? 'render + patch .md' : 'solo render SVGs'
  console.log(`\nbeautiful-mermaid [${mode}] — tema: ${themeArg}`)
  console.log('='.repeat(50))
  mdFiles.forEach(processFile)
  const indexPath = buildIndex()
  console.log('\n' + '='.repeat(50))
  console.log(`SVGs en:  ${DIAGRAMS}`)
  if (indexPath) console.log(`Preview:  ${indexPath}`)
  if (doPatch) console.log(`Markdown: bloques mermaid reemplazados por <img> en los .md`)
  console.log()
}
