import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import BlogList from './pages/blog/BlogList';
import BlogPost from './pages/blog/BlogPost';
import CompoundTurboCalculator from './pages/utils/CompoundTurboCalculator';

const App = () => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:postNumber" element={<BlogPost />} />
        <Route
          path="/utils/compound-turbo-calculator"
          element={<CompoundTurboCalculator />}
        />
      </Routes>
    </AppLayout>
  );
};

export default App;
