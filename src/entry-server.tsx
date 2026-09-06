import { StrictMode } from 'react';
import ReactDOMServer from 'react-dom/server';
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
// real `<title>`/`<meta>` elements and lets React 19's native document-metadata
// hoisting move them to the front of the `renderToString()` output (this is
// documented behavior, not a bug — see react-helmet-async's README "React 19"
// section). So instead of reading `context.helmet`, pull the hoisted tags back
// off the front of the rendered string.
const leadingHeadTagPattern = /^(<title[^>]*>[\s\S]*?<\/title>|<meta[^>]*\/?>)/;

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

export function render(url: string): IRenderResult {
  const rawHtml = ReactDOMServer.renderToString(
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

  const chunks = extractCriticalToChunks(bodyHtml);
  const styleTags = constructStyleTagsFromChunks(chunks);

  return { html: bodyHtml, helmetTags, styleTags };
}
