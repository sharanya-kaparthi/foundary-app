import dynamic from 'next/dynamic';

// Firebase Auth/Firestore only work in the browser, so this is loaded
// client-side only (no server-side rendering) to avoid build errors.
const FoundaryApp = dynamic(() => import('../components/FoundaryApp'), { ssr: false });

export default function Home() {
  return <FoundaryApp />;
}
