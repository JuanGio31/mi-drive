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

/** Texto visible de un fragmento HTML, sin etiquetas ni entidades. */
function textoPlano(html) {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

/** Normaliza texto para localizar títulos en el texto extraído del PDF. */
function normalizar(texto) {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function escaparHtml(texto) {
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Elimina el índice escrito en Markdown, añade ids a los títulos y devuelve
 * la lista de entradas que se usará para generar el índice del PDF. */
function prepararContenido(html) {
    let contenido = html.replace(
        /<h1[^>]*>\s*(?:Índice|Contenido)\s*<\/h1>[\s\S]*?(?=<h1)/i,
        '',
    );

    const entradas = [];
    let contador = 0;

    contenido = contenido.replace(
        /<h([12])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/g,
        (_coincidencia, nivel, interior) => {
            const id = `sec-${++contador}`;
            entradas.push({
                id,
                nivel: Number(nivel),
                texto: textoPlano(interior),
                pagina: '000',
            });
            return `<h${nivel} id="${id}">${interior}</h${nivel}>`;
        },
    );

    return { contenido, entradas };
}

function generarIndice(entradas) {
    const filas = entradas
        .map(
            (entrada) =>
                `<div class="indice-linea nivel-${entrada.nivel}">` +
                `<a class="indice-texto" href="#${entrada.id}">${escaparHtml(entrada.texto)}</a>` +
                `<span class="indice-puntos"></span>` +
                `<span class="indice-pagina">${entrada.pagina}</span>` +
                `</div>`,
        )
        .join('\n');

    return `<nav class="indice">` +
        `<h1 class="indice-titulo">Índice</h1>` +
        `${filas}` +
        `<span class="marca-fin-indice">FININDICE</span>` +
        `</nav>`;
}

function construirDocumento(contenido, entradas, css, titulo) {
    const indice = generarIndice(entradas);
    const posicion = contenido.indexOf('<h1');

    const cuerpo =
        posicion >= 0
            ? contenido.slice(0, posicion) + indice + contenido.slice(posicion)
            : contenido + indice;

    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titulo}</title>
  <style>${css}</style>
</head>
<body>
${cuerpo}
</body>
</html>`;
}

async function imprimir(documento, destino, temporal) {
    const htmlPath = join(temporal, `manual-${Date.now()}.html`);
    const perfil = join(temporal, 'chrome-profile');
    await writeFile(htmlPath, documento, 'utf8');

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
            '--virtual-time-budget=15000',
            `--user-data-dir=${perfil}`,
            `--print-to-pdf=${destino}`,
            pathToFileURL(htmlPath).href,
        ],
        { timeout: 180_000, maxBuffer: 10 * 1024 * 1024 },
    );
}

/** Extrae el texto de cada página del PDF para localizar los títulos. */
async function extraerPaginas(pdf) {
    const { stdout } = await ejecutar('pdftotext', ['-layout', pdf, '-'], {
        maxBuffer: 50 * 1024 * 1024,
    });

    return stdout.split('\f').map(normalizar);
}

/** Asigna a cada entrada el número de página donde aparece publicado el
 * título, ignorando las páginas del propio índice. */
function resolverPaginas(entradas, paginas) {
    const marca = paginas.findIndex((pagina) => pagina.includes('finindice'));
    const inicio = marca >= 0 ? marca + 1 : 0;

    for (const entrada of entradas) {
        const aguja = normalizar(entrada.texto);
        const indice = paginas.findIndex(
            (pagina, posicion) => posicion >= inicio && pagina.includes(aguja),
        );
        if (indice >= 0) entrada.pagina = String(indice + 1).padStart(3, '0');
    }
}

async function generar({ origen, destino, titulo }) {
    const markdown = await readFile(origen, 'utf8');
    const html = await incrustarImagenes(
        marked.parse(markdown, { gfm: true, async: false }),
        dirname(origen),
    );
    const { contenido, entradas } = prepararContenido(html);
    const css = await readFile(join(pdfDir, 'estilo.css'), 'utf8');
    const temporal = await mkdtemp(join(tmpdir(), 'dms-pdf-'));
    const borrador = join(temporal, 'borrador.pdf');

    try {
        await imprimir(
            construirDocumento(contenido, entradas, css, titulo),
            borrador,
            temporal,
        );

        const paginas = await extraerPaginas(borrador);
        resolverPaginas(entradas, paginas);

        await imprimir(
            construirDocumento(contenido, entradas, css, titulo),
            destino,
            temporal,
        );
        console.log(`✓ ${destino.replace(raiz + '/', '')}`);
    } finally {
        await rm(temporal, { recursive: true, force: true });
    }
}

for (const manual of manuales) {
    await generar(manual);
}
