import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { marked } from '../../frontend/node_modules/marked/lib/marked.esm.js';

const ejecutar = promisify(execFile);
const pdfDir = dirname(fileURLToPath(import.meta.url));
const docsDir = resolve(pdfDir, '..');
const raiz = resolve(docsDir, '..');
const chrome = '/usr/bin/google-chrome';

const manuales = [
  {
    origen: join(docsDir, 'manual-tecnico.md'),
    destino: join(pdfDir, 'manual-tecnico.pdf'),
    titulo: 'Manual técnico — Sistema de Gestión Documental',
  },
  {
    origen: join(docsDir, 'manual-usuario.md'),
    destino: join(pdfDir, 'manual-usuario.pdf'),
    titulo: 'Manual de usuario — Sistema de Gestión Documental',
  },
];

const tipos = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

/** Convierte las imágenes locales del Markdown en data URI para que Chrome
 * pueda imprimirlas sin depender de permisos de file://. */
async function incrustarImagenes(html, baseDir) {
  const etiquetas = [...html.matchAll(/<img\b[^>]*>/g)];
  let resultado = html;

  for (const [etiqueta] of etiquetas) {
    const src = /src="([^"]+)"/.exec(etiqueta)?.[1];
    if (!src || /^(data:|https?:)/.test(src)) continue;

    const archivo = resolve(baseDir, src);
    const mime = tipos[extname(archivo).toLowerCase()];
    if (!mime) throw new Error(`Formato de imagen no soportado: ${src}`);

    const base64 = (await readFile(archivo)).toString('base64');
    const reemplazo = etiqueta.replace(
      /src="[^"]+"/,
      `src="data:${mime};base64,${base64}"`,
    );
    resultado = resultado.replace(etiqueta, reemplazo);
  }

  return resultado;
}

async function generar({ origen, destino, titulo }) {
  const markdown = await readFile(origen, 'utf8');
  let html = marked.parse(markdown, { gfm: true, async: false });
  html = await incrustarImagenes(html, dirname(origen));

  const css = await readFile(join(pdfDir, 'estilo.css'), 'utf8');
  const documento = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titulo}</title>
  <style>${css}</style>
</head>
<body>
${html}
</body>
</html>`;

  const temporal = await mkdtemp(join(tmpdir(), 'dms-pdf-'));
  const htmlPath = join(temporal, 'manual.html');
  const perfil = join(temporal, 'chrome-profile');
  await writeFile(htmlPath, documento, 'utf8');

  try {
    await ejecutar(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--no-first-run',
        '--no-default-browser-check',
        '--no-pdf-header-footer',
        '--allow-file-access-from-files',
        '--run-all-compositor-stages-before-draw',
        '--virtual-time-budget=10000',
        `--user-data-dir=${perfil}`,
        `--print-to-pdf=${destino}`,
        pathToFileURL(htmlPath).href,
      ],
      { timeout: 120_000, maxBuffer: 10 * 1024 * 1024 },
    );
    console.log(`✓ ${destino.replace(raiz + '/', '')}`);
  } finally {
    await rm(temporal, { recursive: true, force: true });
  }
}

for (const manual of manuales) {
  await generar(manual);
}
