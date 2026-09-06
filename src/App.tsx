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
