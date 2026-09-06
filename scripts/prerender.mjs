import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, routes, postDates } from '../dist-ssr/entry-server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const SITE_URL = 'https://jlaustill.github.io';

const template = readFileSync(join(distDir, 'index.html'), 'utf-8');

function outputPathForRoute(route) {
  return route === '/'
    ? join(distDir, 'index.html')
    : join(distDir, route, 'index.html');
}

async function renderPage(route) {
  const { html, helmetTags, styleTags } = await render(route);
  const rootStamp = `<div id="root" data-prerendered-path="${route}">${html}</div>`;

  const withTitle = template.replace(/<title>.*?<\/title>/, () => helmetTags);
  if (!withTitle.includes(helmetTags)) {
    throw new Error(`Prerender splice failed for route "${route}": <title> tag not found/replaced.`);
  }

  const withHead = withTitle.replace('</head>', () => `${styleTags}</head>`);
  if (styleTags.length > 0 && !withHead.includes(styleTags)) {
    throw new Error(`Prerender splice failed for route "${route}": </head> insertion of styleTags failed.`);
  }

  const withRoot = withHead.replace('<div id="root"></div>', () => rootStamp);
  if (!withRoot.includes(`data-prerendered-path="${route}"`)) {
    throw new Error(`Prerender splice failed for route "${route}": <div id="root"> insertion failed.`);
  }

  return withRoot;
}

for (const route of routes) {
  const outputPath = outputPathForRoute(route);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, await renderPage(route));
  console.log(`Prerendered ${route} -> ${outputPath}`);
}

function buildSitemap() {
  const urls = routes.map((route) => {
    const loc = `${SITE_URL}${route === '/' ? '/' : `${route}/`}`;
    const lastmod = postDates[route];
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

writeFileSync(join(distDir, 'sitemap.xml'), buildSitemap());
console.log('Wrote sitemap.xml');
