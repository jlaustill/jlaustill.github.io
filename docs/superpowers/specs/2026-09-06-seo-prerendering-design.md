# SEO + Prerendering — Design Spec

## Summary

The site is currently 100% client-side rendered: `index.html` ships an empty `<div id="root">`, and every route (including blog posts) only exists after React mounts and runs. There's no `robots.txt`, no `sitemap.xml`, no per-route `<title>`/description, and every route shares the same static title. This spec adds all three, closing the SEO gap without introducing a full SSR framework.

**Priority note:** the home page and blog posts are the actual SEO payload (the content someone would search for or share). The tool pages (turbo-calculator, kfa, econ-spectrum) get the same prerendering plumbing for consistency and fast TTFP, but their prerendered content is allowed to be a layout-only shell — see "Lazy routes" below. Testing effort should weight home + blog posts highest.

---

## 1. `robots.txt` + `sitemap.xml`

- `public/robots.txt`: static file, `Allow: /` for all agents, `Sitemap: https://jlaustill.github.io/sitemap.xml`. Copied verbatim by Vite's `public/` handling — no build step.
- `sitemap.xml` is generated, not static, because the blog post list grows. The prerender script (section 3) generates it in the same pass it already uses to enumerate routes, writing `dist/sitemap.xml`. Static routes get no `<lastmod>`; blog posts use their existing `date` field. Base URL: `https://jlaustill.github.io/` (no CNAME in `public/`, so this is the real deployed origin).

---

## 2. Per-route metadata (`react-helmet-async`)

- New dependency: `react-helmet-async`. Client wraps the tree in `<HelmetProvider>`; the SSR entry (section 3) wraps in `<HelmetProvider context={helmetContext}>` and reads `helmetContext.helmet` after `renderToString` to get `title`/`meta`/`og:*` tag strings.
- **Constraint driving the structure**: `KfaTranslator`, `KfaRaven`, `EconSpectrum`, and (new) `CompoundTurboCalculator` are `lazy()`-loaded. During SSR and during the client's first paint, a lazy chunk hasn't loaded — only its `Suspense` fallback renders. Any `<Helmet>` call inside those components would therefore never appear in the prerendered `<head>`. So per-route metadata must live **outside** the lazy boundary.
- New file `src/routeMeta.ts`: exports `IRouteMeta[]` — `{ path, title, description }` for every static route (`/`, `/blog`, `/turbo-calculator`, `/kfa`, `/kfa/examples/raven`, `/econ-spectrum`). Consumed by a small `<PageMeta title description />` component (new file `src/components/PageMeta.tsx`) rendered directly in `App.tsx` alongside each `<Route>` element's `element` prop — sitting next to the lazy/eager page component, not inside it.
- `BlogPost.tsx` is the one exception: it's eager (not lazy), so it renders its own `<Helmet>` using the matched post's existing `title`/`summary` fields directly — no entry needed in `routeMeta.ts`.
- Every `<Helmet>`/`<PageMeta>` also emits `og:title`, `og:description`, `og:type` (`website` for tool pages, `article` for blog posts), and `og:url` (absolute, using the same base URL as the sitemap) — same source strings, for link-unfurler previews.
- Copy sources:
  - Blog posts: existing `title` + `summary` in `posts/index.ts`. No new copy needed.
  - Turbo-calculator, kfa, kfa/raven, econ-spectrum: reuse the existing short blurbs already written for the home page's cards (`Home.tsx`) as first-draft descriptions in `routeMeta.ts`.
  - **Home page is the one exception requiring the site owner's own copy.** `routeMeta.ts` ships with a clearly marked placeholder (`// TODO(jlaustill): write the real homepage title + meta description`) for the `/` entry — this is the site's front-door pitch to search engines and shouldn't be invented.

---

## 3. Prerender pipeline

### New files

- `src/entry-server.tsx` — exports:
  - `routes: string[]` — built from `routeMeta.ts` paths plus `/blog/${post.id}` for every entry in `posts/index.ts`.
  - `render(url: string): { html: string; helmetTags: string; styleTags: string }` — renders `<StaticRouter location={url}>` wrapping the real `<App>` (same component tree as the client, imported from `App.tsx`), inside a custom Emotion cache (`@emotion/cache`, via `CacheProvider`) and `<HelmetProvider context={...}>`, using `ReactDOMServer.renderToString`. Extracts critical CSS via `@emotion/server/create-instance`'s `extractCriticalToChunks` + `constructStyleTagsFromChunks` (MUI's documented custom-SSR pattern) — without this, prerendered pages would flash unstyled until client JS re-inserts the same styles.
- `scripts/prerender.mjs` — Node script (plain `.mjs`, run post-build, not part of the Vite/TS app graph):
  1. Imports `render`/`routes` from the built SSR bundle (`.ssr-tmp/entry-server.js`).
  2. Reads `dist/index.html` (already has the real hashed `<script>`/`<link>` tags from `vite build`) as the template.
  3. For each route: calls `render(path)`, splices `html` into `<div id="root">…</div>`, splices `helmetTags` + `styleTags` into `<head>`, writes the result to `dist<path>/index.html` (`/` → `dist/index.html` itself; `/blog/1` → `dist/blog/1/index.html`).
  4. After the loop, writes `dist/sitemap.xml` from the same route list + blog post dates.

### Modified files

- `main.tsx`: replace the unconditional `createRoot(...).render(...)` with a branch — `document.getElementById('root')!.hasChildNodes() ? hydrateRoot(root, tree) : createRoot(root).render(tree)`. Prerendered production output always has content in `#root`; the raw `vite dev` `index.html` never does — this check covers both correctly without an env-var branch.
- `package.json` build script becomes:
  ```
  tsc -b && vite build && vite build --ssr src/entry-server.tsx --outDir .ssr-tmp && node scripts/prerender.mjs && node -e "require('fs').rmSync('.ssr-tmp',{recursive:true,force:true})"
  ```
  `.ssr-tmp` is added to `.gitignore`; it's a build-time intermediate, never deployed (the GitHub Actions workflow already only uploads `dist`).
- New dependencies: `react-helmet-async`, `@emotion/cache`, `@emotion/server` (the latter two are build-time-only, used exclusively by `entry-server.tsx`).

### Lazy routes (turbo-calculator, kfa, kfa/raven, econ-spectrum)

`hydrateRoot` requires the client's first render to match the server-rendered HTML, or React discards the prerendered DOM and repaints — a visible flash. A lazy chunk isn't loaded on the client's first paint any more than it is during SSR, so these four routes can only ever prerender to their `Suspense` fallback (a spinner) plus the surrounding `AppLayout` shell and `<PageMeta>` tags. That's an accepted, deliberate trade-off (confirmed with the site owner): these are interactive tools, not indexable text content, and matches the app's existing lazy-loading architecture. `CompoundTurboCalculator` (currently eager, uses Recharts) becomes `lazy()`-loaded the same way, specifically because `ResponsiveContainer` needs a real browser layout pass that neither `renderToString` nor any other synchronous SSR technique can provide — attempting to prerender it directly would render a broken 0×0 chart.

### Fallback safety net

`public/404.html`'s existing GitHub Pages SPA-redirect shim is unchanged. Every current route gets a real prerendered file, so it shouldn't normally fire, but it remains the catch-all for stale links or future routes added without a matching prerender entry.

---

## Testing / Verification

Priority order follows the "real concern" note above — home and blog posts get the deepest scrutiny; tool pages just need to confirm the shell + metadata is right and nothing crashes.

1. `npm run build`, then inspect by hand:
   - `dist/index.html` — full real home page markup present (not just nav), correct title/description/OG tags.
   - `dist/blog/index.html` and `dist/blog/1/index.html` (and any future post) — full post content present in view-source, correct per-post title/description/OG tags matching that post's `title`/`summary`.
   - `dist/turbo-calculator/index.html`, `dist/kfa/index.html`, `dist/kfa/examples/raven/index.html`, `dist/econ-spectrum/index.html` — layout shell + correct title/description present, spinner fallback where expected.
   - `dist/sitemap.xml` — every route listed, blog posts have `<lastmod>` matching their `date`.
2. `npm run preview`, load every route in a browser:
   - No React hydration-mismatch warnings in the console on any route.
   - Home and blog post pages show fully styled real content before any visible re-render (throttle network in devtools to make this observable).
   - The four lazy routes show the shell/spinner immediately, then the real content loads in without an error.
3. `view-source:` on the deployed-equivalent local preview for `/` and `/blog/1` specifically, to confirm the exact bytes a crawler would see contain real, readable text — this is the actual deliverable being verified.
