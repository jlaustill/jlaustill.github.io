import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import theme from './theme';
import './index.css';

function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/$/, '') : path;
}

const container = document.getElementById('root')!;
const prerenderedPath = container.dataset.prerenderedPath;
const currentPath = normalizePath(window.location.pathname);

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

if (prerenderedPath !== undefined && normalizePath(prerenderedPath) === currentPath) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
