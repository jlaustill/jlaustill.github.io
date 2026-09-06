# SEO + Prerendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every route real, crawlable, styled HTML at first paint — via per-route metadata and a build-time prerender pass — instead of today's empty `<div id="root">` shell, while keeping the app a client-side React SPA after hydration.

**Architecture:** Add `react-helmet-async` for per-route `<title>`/description/OG tags declared outside any `lazy()` boundary. Build a second, Node-targeted bundle of a new `src/entry-server.tsx` (via `vite build --ssr`) that renders every route once with `ReactDOMServer.renderToString` + Emotion critical-CSS extraction. A plain Node script (`scripts/prerender.mjs`) splices that output into `dist/index.html`'s template, writing one real `index.html` per route plus `dist/sitemap.xml`. `main.tsx` switches from unconditional `createRoot` to `hydrateRoot` whenever the root element already has content.

**Tech Stack:** Vite 6, React 19, react-router-dom 7 (`StaticRouter`), MUI 7 + Emotion 11, TypeScript (strict), Node 20 (CI) / Node 24 (local, confirmed via `node -v`).

**Spec:** `docs/superpowers/specs/2026-09-06-seo-prerendering-design.md`

## Global Constraints

- Base URL for all absolute URLs (sitemap `<loc>`, `og:url`) is `https://jlaustill.github.io` — no trailing slash in the constant, add it at the call site. No custom domain (no `public/CNAME`).
- Per-route metadata (title/description/OG tags) must be declared **outside** any `lazy()` boundary — it must render even when only a route's `Suspense` fallback is showing.
- No headless-browser tooling (no Puppeteer, no `vite-react-ssg`) — the prerender path is pure `ReactDOMServer.renderToString` plus a hand-written Node script. This was an explicit decision to avoid a 300MB Chromium dependency.
- `turbo-calculator`, `kfa`, `kfa/examples/raven`, and `econ-spectrum` are intentionally `lazy()`-loaded and will only ever prerender to a layout+spinner shell — this is accepted, not a bug to fix later.
- The home page and blog posts are the actual SEO payload — give their verification steps the most scrutiny; the four lazy routes only need "doesn't crash, has correct `<title>`".
- New dependencies: `react-helmet-async` (dependency), `@emotion/cache` and `@emotion/server` (dependencies — `@emotion/react`/`@emotion/styled` are already present). No new devDependencies (`dist-ssr` is already in `.gitignore` from the original Vite scaffold — reuse that name for the SSR build's temp output instead of inventing a new one).
- No test framework exists in this repo (no vitest/jest, no `test` script). Do not add one for this feature — verification is via `npm run build` + inspecting real generated files (grep/cat), matching the spec's own manual-verification testing plan. Every task below gives exact commands and exact expected output for this reason.

---

### Task 1: `react-helmet-async` + route metadata + `PageMeta` + wire into `App.tsx`

**Files:**
- Modify: `package.json` (add `react-helmet-async` dependency)
- Create: `src/routeMeta.ts`
- Create: `src/components/PageMeta.tsx`
- Modify: `src/main.tsx` (wrap in `HelmetProvider`)
- Modify: `src/App.tsx` (render `<PageMeta>` next to every static route's element)

**Interfaces:**
- Produces: `IRouteMeta { path: string; title: string; description: string }`, `getRouteMeta(path: string): IRouteMeta` (throws if `path` has no entry) from `src/routeMeta.ts`.
- Produces: `PageMeta` component from `src/components/PageMeta.tsx`, props `{ path: string; title: string; description: string }`.

- [ ] **Step 1: Install the dependency**

Run: `npm install react-helmet-async`
Expected: `package.json` `dependencies` now includes `"react-helmet-async"`, and `package-lock.json` is updated.

- [ ] **Step 2: Create `src/routeMeta.ts`**

```typescript
export interface IRouteMeta {
  path: string;
  title: string;
  description: string;
}

const routeMeta: IRouteMeta[] = [
  {
    // TODO(jlaustill): write the real homepage title + meta description —
    // this is the site's front-door pitch to search engines, not something
    // that should be auto-generated.
    path: '/',
    title: 'joSUu ostel',
    description: 'Personal site and portfolio of Joshua Austill.',
  },
  {
    path: '/blog',
    title: 'Blog | joSUu ostel',
    description: 'Technical articles and thoughts.',
  },
  {
    path: '/turbo-calculator',
    title: 'Turbo Calculator | joSUu ostel',
    description: 'Compound turbo boost ratio calculator.',
  },
  {
    path: '/kfa',
    title: 'kfa | joSUu ostel',
    description: 'QWERTY phonetic alphabet translator.',
  },
  {
    path: '/kfa/examples/raven',
    title: 'kfa: The Raven | joSUu ostel',
    description: "Edgar Allan Poe's The Raven translated into the kfa phonetic alphabet.",
  },
  {
    path: '/econ-spectrum',
    title: 'Econ Spectrum | joSUu ostel',
    description: 'Capitalism vs. socialism by country and sector.',
  },
];

export function getRouteMeta(path: string): IRouteMeta {
  const meta = routeMeta.find((route) => route.path === path);
  if (!meta) {
    throw new Error(`No route metadata defined for path: ${path}`);
  }
  return meta;
}

export default routeMeta;
```

- [ ] **Step 3: Create `src/components/PageMeta.tsx`**

```typescript
import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '../constants';

interface IPageMetaProps {
  path: string;
  title: string;
  description: string;
}

const PageMeta = ({ path, title, description }: IPageMetaProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={`${SITE_URL}${path}`} />
  </Helmet>
);

export default PageMeta;
```

- [ ] **Step 4: Create `src/constants.ts`**

```typescript
export const SITE_URL = 'https://jlaustill.github.io';
```

- [ ] **Step 5: Wrap `main.tsx` in `HelmetProvider`**

Read the current file first, then replace its contents:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import theme from './theme';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
```

(This step only adds `HelmetProvider` — the `createRoot`/`hydrateRoot` split happens in Task 5, after the SSR pipeline exists to test it against.)

- [ ] **Step 6: Rewrite `App.tsx` to render `PageMeta` next to every static route, and lazy-load `CompoundTurboCalculator`**

```typescript
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import AppLayout from './components/layout/AppLayout';
import PageMeta from './components/PageMeta';
import { getRouteMeta } from './routeMeta';
import Home from './pages/Home';
import BlogList from './pages/blog/BlogList';
import BlogPost from './pages/blog/BlogPost';

const CompoundTurboCalculator = lazy(
  () => import('./pages/turbo-calculator/CompoundTurboCalculator'),
);
const KfaTranslator = lazy(() => import('./pages/kfa/KfaTranslator'));
const KfaRaven = lazy(() => import('./pages/kfa/examples/KfaRaven'));
const EconSpectrum = lazy(() => import('./pages/econ-spectrum/EconSpectrum'));

const lazyFallback = (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
    <CircularProgress />
  </Box>
);

const App = () => {
  return (
    <AppLayout>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <PageMeta {...getRouteMeta('/')} />
              <Home />
            </>
          }
        />
        <Route
          path="/blog"
          element={
            <>
              <PageMeta {...getRouteMeta('/blog')} />
              <BlogList />
            </>
          }
        />
        <Route path="/blog/:postNumber" element={<BlogPost />} />
        <Route
          path="/turbo-calculator"
          element={
            <>
              <PageMeta {...getRouteMeta('/turbo-calculator')} />
              <Suspense fallback={lazyFallback}>
                <CompoundTurboCalculator />
              </Suspense>
            </>
          }
        />
        <Route
          path="/kfa"
          element={
            <>
              <PageMeta {...getRouteMeta('/kfa')} />
              <Suspense fallback={lazyFallback}>
                <KfaTranslator />
              </Suspense>
            </>
          }
        />
        <Route
          path="/kfa/examples/raven"
          element={
            <>
              <PageMeta {...getRouteMeta('/kfa/examples/raven')} />
              <Suspense fallback={lazyFallback}>
                <KfaRaven />
              </Suspense>
            </>
          }
        />
        <Route
          path="/econ-spectrum"
          element={
            <>
              <PageMeta {...getRouteMeta('/econ-spectrum')} />
              <Suspense fallback={lazyFallback}>
                <EconSpectrum />
              </Suspense>
            </>
          }
        />
      </Routes>
    </AppLayout>
  );
};

export default App;
```

- [ ] **Step 7: Type-check, lint, and build the client bundle**

Run: `npm run build`
Expected: exits 0. This runs `tsc -b` (verifies all the new types line up) then `vite build` (verifies the app still bundles — `dist/` now contains the same empty-root `index.html` as before; prerendering doesn't exist yet).

Run: `npm run lint`
Expected: exits 0, no new errors.

- [ ] **Step 8: Manually verify metadata renders client-side**

Run: `npm run preview` (serves `dist/` on `http://localhost:4173`), then in a browser:
- Visit `/` — devtools "Elements" tab shows `<title>joSUu ostel</title>` (unchanged, since the TODO placeholder wasn't filled in) and a `<meta name="description" ...>` tag now present in `<head>`.
- Visit `/blog` — title changes to `Blog | joSUu ostel` after the page mounts.
- Visit `/turbo-calculator`, `/kfa`, `/kfa/examples/raven`, `/econ-spectrum` — each shows a brief spinner then real content, and each has its own distinct title from `routeMeta.ts` visible in the browser tab immediately (before the lazy chunk loads) — confirming metadata renders outside the lazy boundary.

Stop the preview server (Ctrl+C) when done.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/routeMeta.ts src/components/PageMeta.tsx src/constants.ts src/main.tsx src/App.tsx
git commit -m "$(cat <<'EOF'
feat: add per-route metadata via react-helmet-async

Adds routeMeta.ts + PageMeta as the single source of truth for each
route's title/description/OG tags, rendered outside any lazy() boundary
so it survives prerendering later. Also lazy-loads the turbo-calculator
page, since Recharts can't be part of the synchronous SSR path added
in a later task.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01E6U6SmQy3LnWru9sBr1XR1
EOF
)"
```

---

### Task 2: Per-post metadata in `BlogPost.tsx`

**Files:**
- Modify: `src/pages/blog/BlogPost.tsx`

**Interfaces:**
- Consumes: `SITE_URL` from `src/constants.ts` (Task 1).
- Consumes: `IBlogPost` (existing, `src/pages/blog/types/IBlogPost.ts`) — `{ id, title, summary, date, component }`.

`BlogPost` is not lazy-loaded (it's imported eagerly in `App.tsx`), so — unlike the routes in Task 1 — its `<Helmet>` can live directly inside the component itself.

- [ ] **Step 1: Rewrite `BlogPost.tsx`**

```typescript
import { useParams, Navigate } from 'react-router-dom';
import { Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import posts from './posts';
import { SITE_URL } from '../../constants';

const BlogPost = () => {
  const { postNumber } = useParams<{ postNumber: string }>();
  const postId = parseInt(postNumber || '0', 10);
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const PostComponent = post.component;

  return (
    <Box>
      <Helmet>
        <title>{`${post.title} | joSUu ostel`}</title>
        <meta name="description" content={post.summary} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.summary} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${SITE_URL}/blog/${post.id}`} />
      </Helmet>
      <Button component={RouterLink} to="/blog" sx={{ mb: 2 }}>
        &larr; Back to Blog
      </Button>
      <PostComponent />
    </Box>
  );
};

export default BlogPost;
```

- [ ] **Step 2: Build and verify**

Run: `npm run build && npm run preview`, then visit `http://localhost:4173/blog/1` in a browser.
Expected: browser tab title reads `A Framework for Thinking About AI's Role in Modern Computing | joSUu ostel`; devtools shows the `og:*` meta tags with `og:type` = `article`.

Stop the preview server (Ctrl+C).

- [ ] **Step 3: Commit**

```bash
git add src/pages/blog/BlogPost.tsx
git commit -m "$(cat <<'EOF'
feat: add per-post metadata to blog posts

Blog posts already carry title/summary copy — reuse it directly for
the title tag, meta description, and OG tags instead of duplicating
it in routeMeta.ts.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01E6U6SmQy3LnWru9sBr1XR1
EOF
)"
```

---

### Task 3: `src/entry-server.tsx` — the SSR render function

**Files:**
- Modify: `package.json` (add `@emotion/cache`, `@emotion/server` dependencies)
- Create: `src/entry-server.tsx`

**Interfaces:**
- Consumes: `App` (default export, `src/App.tsx`), `theme` (default export, `src/theme/index.ts`), `posts` (default export, `src/pages/blog/posts/index.ts`), `routeMeta` (default export, `src/routeMeta.ts`).
- Produces: `render(url: string): { html: string; helmetTags: string; styleTags: string }`, `routes: string[]`, `postDates: Record<string, string>` — all named exports of `src/entry-server.tsx`. `routes` and `postDates` are consumed by `scripts/prerender.mjs` in Task 6.

This task's output is a Node module — it is verified with a throwaway Node script, not a browser.

- [ ] **Step 1: Install the new dependencies**

Run: `npm install @emotion/cache @emotion/server`
Expected: `package.json` `dependencies` now includes both, `package-lock.json` updated.

- [ ] **Step 2: Create `src/entry-server.tsx`**

```typescript
import { StrictMode } from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import createEmotionServer from '@emotion/server/create-instance';
import { HelmetProvider, HelmetServerState } from 'react-helmet-async';
import App from './App';
import theme from './theme';
import routeMeta from './routeMeta';
import posts from './pages/blog/posts';

const cache = createCache({ key: 'css' });
const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

export const routes: string[] = [
  ...routeMeta.map((route) => route.path),
  ...posts.map((post) => `/blog/${post.id}`),
];

export const postDates: Record<string, string> = Object.fromEntries(
  posts.map((post) => [`/blog/${post.id}`, post.date]),
);

export interface IRenderResult {
  html: string;
  helmetTags: string;
  styleTags: string;
}

export function render(url: string): IRenderResult {
  const helmetContext: { helmet?: HelmetServerState } = {};

  const html = ReactDOMServer.renderToString(
    <StrictMode>
      <CacheProvider value={cache}>
        <HelmetProvider context={helmetContext}>
          <StaticRouter location={url}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <App />
            </ThemeProvider>
          </StaticRouter>
        </HelmetProvider>
      </CacheProvider>
    </StrictMode>,
  );

  const { helmet } = helmetContext;
  if (!helmet) {
    throw new Error(`HelmetProvider did not populate context for route: ${url}`);
  }
  const helmetTags = `${helmet.title.toString()}${helmet.meta.toString()}`;

  const chunks = extractCriticalToChunks(html);
  const styleTags = constructStyleTagsFromChunks(chunks);

  return { html, helmetTags, styleTags };
}
```

- [ ] **Step 3: Build the SSR bundle**

Run: `npx vite build --ssr src/entry-server.tsx --outDir dist-ssr`
Expected: exits 0, creates `dist-ssr/entry-server.js` (or `.mjs` — check the actual output filename printed in the build log, it will be referenced in Task 6).

- [ ] **Step 4: Verify `render()` works for every route, including the lazy ones, without throwing**

Run this ad-hoc verification script (do not commit it — it's throwaway):

```bash
node -e "
import('./dist-ssr/entry-server.js').then(({ render, routes, postDates }) => {
  console.log('routes:', routes);
  console.log('postDates:', postDates);
  for (const route of routes) {
    const { html, helmetTags, styleTags } = render(route);
    if (!html || html.length === 0) throw new Error(\`Empty html for \${route}\`);
    if (!helmetTags.includes('<title>')) throw new Error(\`No title tag for \${route}\`);
    console.log(\`OK \${route} — html \${html.length} bytes, styleTags \${styleTags.length} bytes\`);
  }
  console.log('All routes rendered successfully.');
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
"
```

Expected: prints `OK <route> — ...` for every entry in `routes` (six static paths plus `/blog/1`), ending with `All routes rendered successfully.` and exit code 0. In particular `/turbo-calculator`, `/kfa`, `/kfa/examples/raven`, and `/econ-spectrum` must NOT throw (they render their `Suspense` fallback markup, which is still non-empty valid HTML) — if any of these throws a `ResizeObserver is not defined` or similar error, it means Task 1's lazy-loading of `CompoundTurboCalculator` (or the pre-existing lazy loading of the other three) isn't taking effect; stop and fix that before proceeding.

- [ ] **Step 5: Clean up the throwaway SSR build**

Run: `rm -rf dist-ssr`
(Task 6 rebuilds this as part of the real `npm run build` script — this was just to prove Task 3 works in isolation.)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/entry-server.tsx
git commit -m "$(cat <<'EOF'
feat: add SSR render function for prerendering

entry-server.tsx renders any route to a string via ReactDOMServer,
extracting Emotion critical CSS (MUI's documented custom-SSR pattern)
and react-helmet-async's title/meta tags. Verified all seven current
routes render without throwing, including the four lazy ones (which
correctly produce their Suspense fallback markup instead of crashing).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01E6U6SmQy3LnWru9sBr1XR1
EOF
)"
```

---

### Task 4: `public/robots.txt`

**Files:**
- Create: `public/robots.txt`

- [ ] **Step 1: Create the file**

```
User-agent: *
Allow: /

Sitemap: https://jlaustill.github.io/sitemap.xml
```

- [ ] **Step 2: Verify it's copied into the build output**

Run: `npm run build`
Expected: `dist/robots.txt` exists with the exact content above (Vite copies `public/` verbatim). Check with: `cat dist/robots.txt`

- [ ] **Step 3: Commit**

```bash
git add public/robots.txt
git commit -m "$(cat <<'EOF'
feat: add robots.txt

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01E6U6SmQy3LnWru9sBr1XR1
EOF
)"
```

---

### Task 5: `scripts/prerender.mjs` + wire the full build pipeline

**Files:**
- Create: `scripts/prerender.mjs`
- Modify: `package.json` (`build` script)

**Interfaces:**
- Consumes: `render`, `routes`, `postDates` from the built `dist-ssr/entry-server.js` (Task 3's exports, after Vite's SSR build compiles the `.tsx` down to `.js`).

This is a plain Node ESM script (`.mjs`, outside `src/`) — it is not covered by `tsc -b`'s `include: ["src"]` and isn't a TypeScript file, so there's no separate type-check step for it; correctness is verified by actually running it.

- [ ] **Step 1: Check the actual SSR build output filename**

Run: `npx vite build --ssr src/entry-server.tsx --outDir dist-ssr && ls dist-ssr`
Expected: a single file, most likely `entry-server.js`. Note the exact name — use it verbatim in Step 2's import path. Then run `rm -rf dist-ssr` again (Step 3 of Task 3's cleanup applies here too; this was just to double check the filename before wiring the real pipeline).

- [ ] **Step 2: Create `scripts/prerender.mjs`**

```javascript
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

function renderPage(route) {
  const { html, helmetTags, styleTags } = render(route);
  return template
    .replace(/<title>.*?<\/title>/, helmetTags)
    .replace('</head>', `${styleTags}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
}

for (const route of routes) {
  const outputPath = outputPathForRoute(route);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, renderPage(route));
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
```

If Step 1 showed a different filename than `entry-server.js` (e.g. `entry-server.mjs`), update the import path in the line above to match exactly.

- [ ] **Step 3: Wire it into the `build` script in `package.json`**

Replace the `"build"` line:

```json
"build": "tsc -b && vite build && vite build --ssr src/entry-server.tsx --outDir dist-ssr && node scripts/prerender.mjs && node -e \"require('fs').rmSync('dist-ssr',{recursive:true,force:true})\"",
```

- [ ] **Step 4: Run the full build and verify every generated file**

Run: `npm run build`
Expected: exits 0, and prints seven `Prerendered <route> -> ...` lines (one per entry in `routes`) followed by `Wrote sitemap.xml`. `dist-ssr/` must NOT exist afterward (the final cleanup command removes it) — check with `ls dist-ssr` and confirm it errors with "No such file or directory".

Then verify content, most important routes first:

```bash
grep -o '<title>[^<]*</title>' dist/index.html
grep -o '<title>[^<]*</title>' dist/blog/1/index.html
grep -c 'Framework for Thinking About' dist/blog/1/index.html
grep -o '<title>[^<]*</title>' dist/blog/index.html
grep -o '<title>[^<]*</title>' dist/turbo-calculator/index.html
grep -o '<title>[^<]*</title>' dist/kfa/index.html
grep -o '<title>[^<]*</title>' dist/kfa/examples/raven/index.html
grep -o '<title>[^<]*</title>' dist/econ-spectrum/index.html
cat dist/sitemap.xml
```

Expected:
- `dist/index.html` title is `joSUu ostel`.
- `dist/blog/1/index.html` title is `A Framework for Thinking About AI's Role in Modern Computing | joSUu ostel`, and the `grep -c` count is at least 1 — confirming the actual post body text (not just the title) is present in the static HTML.
- `dist/blog/index.html` title is `Blog | joSUu ostel`.
- The four lazy routes each show their own distinct title from `routeMeta.ts`.
- `dist/sitemap.xml` is well-formed XML, lists all 7 URLs, and the `/blog/1/` entry has `<lastmod>2025-01-15</lastmod>`.

- [ ] **Step 5: Commit**

```bash
git add scripts/prerender.mjs package.json
git commit -m "$(cat <<'EOF'
feat: prerender every route to real static HTML at build time

Wires the SSR bundle from entry-server.tsx into a Node script that
writes one real index.html per route (splicing in rendered markup,
title/meta tags, and Emotion critical CSS) plus sitemap.xml, so
crawlers and first paint get real content instead of an empty root
div. Verified against every current route, with the deepest check on
the home page and blog post 1 since those are the actual SEO payload.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01E6U6SmQy3LnWru9sBr1XR1
EOF
)"
```

---

### Task 6: Hydration in `main.tsx` + final end-to-end verification

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Switch to conditional `hydrateRoot`/`createRoot`**

```typescript
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import theme from './theme';
import './index.css';

const container = document.getElementById('root')!;

const app = (
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);

if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
```

- [ ] **Step 2: Verify `npm run dev` still works (the `createRoot` path — this `index.html` has an empty root div)**

Run: `npm run dev` in the background, then `curl -s http://localhost:5173/ | grep -o '<div id="root">[^<]*</div>'`
Expected: `<div id="root"></div>` — confirms the dev server's raw `index.html` is untouched and still hits the `createRoot` branch. Stop the dev server.

- [ ] **Step 3: Full production build + hydration check (the `hydrateRoot` path)**

Run: `npm run build && npm run preview`, then open `http://localhost:4173/` in a browser with devtools open on the Console tab.
Expected: no React warnings about hydration mismatches (no "Text content does not match", no "Hydration failed" messages) on `/`. Repeat for `/blog`, `/blog/1`, `/turbo-calculator`, `/kfa`, `/kfa/examples/raven`, `/econ-spectrum` — none should log a hydration warning.

- [ ] **Step 4: `view-source:` check on the two priority routes**

In the browser, navigate to `view-source:http://localhost:4173/` and `view-source:http://localhost:4173/blog/1`.
Expected: both show fully readable page content (headings, card text for `/`; the full blog post body for `/blog/1`) directly in the raw HTML — this is the actual deliverable: what a crawler fetching the page would see, with no JavaScript execution.

Stop the preview server (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add src/main.tsx
git commit -m "$(cat <<'EOF'
feat: hydrate prerendered HTML instead of always mounting fresh

main.tsx now uses hydrateRoot when #root already has prerendered
content (every production build, after Task 5) and falls back to
createRoot for the empty root div vite dev serves locally. Verified
no hydration-mismatch warnings across all seven routes, and confirmed
via view-source that the home page and blog post 1 — the actual SEO
payload — are real readable HTML with no JS execution required.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01E6U6SmQy3LnWru9sBr1XR1
EOF
)"
```

---

## Post-plan follow-up (not a task — flagging for the site owner)

`src/routeMeta.ts`'s `/` entry ships with a `TODO(jlaustill)` comment and a placeholder title/description. Before relying on this for real SEO traffic, replace it with real homepage copy — that's the one piece of content this plan deliberately didn't author.
