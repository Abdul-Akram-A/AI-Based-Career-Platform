import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load components
const Home = lazy(() => import('./View/Home'));
const Content = lazy(() => import('./View/Content'));

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/content" element={<Content />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
