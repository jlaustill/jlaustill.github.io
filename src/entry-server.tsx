import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { Writable } from 'node:stream';
import { StaticRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import createEmotionServer from '@emotion/server/create-instance';
import { HelmetProvider } from 'react-helmet-async';
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

// react-helmet-async 3.0.0 detects React 19 at runtime and, on React 19,
// makes `HelmetProvider`'s `context` prop a no-op: `<Helmet>` instead renders
// real head-only elements (`<title>`, `<meta>`, `<link>`, `<style>`, `<script>`)
// and lets React 19's native document-metadata hoisting move them to the front
// of the `renderToString()` output (this is documented behavior, not a bug —
// see react-helmet-async's README "React 19" section). So instead of reading
// `context.helmet`, pull the hoisted tags back off the front of the rendered
// string. `<link>` is void (self-closing); `<style>`/`<script>` are not, so
// they need a matching close tag.
const leadingHeadTagPattern =
  /^(<title[^>]*>[\s\S]*?<\/title>|<meta[^>]*\/?>|<link[^>]*\/?>|<style[^>]*>[\s\S]*?<\/style>|<script[^>]*>[\s\S]*?<\/script>)/;

// Guards the extraction above: if a future head tag type (or malformed markup)
// isn't matched by leadingHeadTagPattern, this catches it loudly instead of
// letting a head-only tag silently leak into the body html.
const leadingHeadTagNamePattern = /^<(title|meta|link|style|script)\b/i;

function splitHoistedHeadTags(html: string): { helmetTags: string; bodyHtml: string } {
  let bodyHtml = html;
  let helmetTags = '';
  let match = leadingHeadTagPattern.exec(bodyHtml);
  while (match) {
    helmetTags += match[0];
    bodyHtml = bodyHtml.slice(match[0].length);
    match = leadingHeadTagPattern.exec(bodyHtml);
  }
  return { helmetTags, bodyHtml };
}

// `renderToString` cannot wait for `React.lazy`/`Suspense` boundaries to
// resolve — it synchronously renders whatever is available and emits the
// Suspense fallback for anything still pending, which for a dynamic
// `import()` is always still pending. Several routes (turbo-calculator, kfa,
// kfa/examples/raven, econ-spectrum) lazy-load their page component, so
// `renderToString` would prerender nothing but the loading spinner for them.
// `renderToPipeableStream`'s `onAllReady` callback waits for every Suspense
// boundary — including lazy components — to finish before we read the HTML,
// which is what a build-time prerender (as opposed to a streaming HTTP
// response) should always do.
function renderToStringAsync(element: React.ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const writable = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });
    writable.on('finish', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    writable.on('error', reject);

    const { pipe } = renderToPipeableStream(element, {
      onAllReady() {
        pipe(writable);
      },
      onShellError: reject,
      onError: reject,
    });
  });
}

export async function render(url: string): Promise<IRenderResult> {
  const rawHtml = await renderToStringAsync(
    <StrictMode>
      <CacheProvider value={cache}>
        <HelmetProvider>
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

  const { helmetTags, bodyHtml } = splitHoistedHeadTags(rawHtml);
  if (!helmetTags.includes('<title>')) {
    throw new Error(`No title tag hoisted by react-helmet-async for route: ${url}`);
  }
  if (leadingHeadTagNamePattern.test(bodyHtml)) {
    throw new Error(
      `A head-only tag leaked into body html for route: ${url} — leadingHeadTagPattern ` +
        'needs to be extended to cover it.',
    );
  }

  const chunks = extractCriticalToChunks(bodyHtml);
  const styleTags = constructStyleTagsFromChunks(chunks);

  return { html: bodyHtml, helmetTags, styleTags };
}
