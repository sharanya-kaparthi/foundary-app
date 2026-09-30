import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import { AppDataProvider } from '../context/AppDataContext';
import { startNavigationTracking } from '../lib/navigation';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  // Lets every Back button return to the real previous page (see lib/navigation.js).
  useEffect(() => startNavigationTracking(router.events), [router.events]);

  return (
    <AppDataProvider>
      <Component {...pageProps} />
    </AppDataProvider>
  );
}
