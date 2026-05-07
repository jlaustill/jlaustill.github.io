import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import BlogList from './pages/blog/BlogList';
import BlogPost from './pages/blog/BlogPost';
import CompoundTurboCalculator from './pages/turbo-calculator/CompoundTurboCalculator';

const KfaTranslator = lazy(() => import('./pages/kfa/KfaTranslator'));
const KfaRaven = lazy(() => import('./pages/kfa/examples/KfaRaven'));

const App = () => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:postNumber" element={<BlogPost />} />
        <Route path="/turbo-calculator" element={<CompoundTurboCalculator />} />
        <Route
          path="/kfa"
          element={
            <Suspense
              fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              }
            >
              <KfaTranslator />
            </Suspense>
          }
        />
        <Route
          path="/kfa/examples/raven"
          element={
            <Suspense
              fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              }
            >
              <KfaRaven />
            </Suspense>
          }
        />
      </Routes>
    </AppLayout>
  );
};

export default App;
