import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Home from '../app/page';
import { SandboxPage } from '../components/sandbox/sandbox-page';
import '../app/globals.css';

function AppRouter() {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (currentPath === '/sandbox' || currentPath.startsWith('/sandbox')) {
    return <SandboxPage onBackToAtlas={() => navigateTo('/')} />;
  }

  return <Home />;
}

createRoot(document.getElementById('root')!).render(<AppRouter />);
