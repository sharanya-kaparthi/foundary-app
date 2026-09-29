import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection } from 'firebase/firestore';

// Same Firebase configuration as before — set these in .env.local (dev) and in
// your Vercel project's Environment Variables (production/preview).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const appId = process.env.NEXT_PUBLIC_APP_ID || 'foundary-app-v1';

let _app = null;
let _auth = null;
let _db = null;

// Lazily initialized, client-only. With real Next.js routes every page can be
// server-rendered, and the old trick of loading one component with
// `dynamic(..., { ssr: false })` no longer covers every page. Instead we just
// never touch the Firebase SDK until something calls this from the browser
// (AppDataContext only ever does so inside useEffect/handlers).
export function getFirebase() {
  if (typeof window === 'undefined') {
    return { app: null, auth: null, db: null };
  }
  if (!_app) {
    _app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    _auth = getAuth(_app);
    _db = getFirestore(_app);
  }
  return { app: _app, auth: _auth, db: _db };
}

// Mandatory Firebase collection paths helper — unchanged path shape.
export function getCollectionRef(collName) {
  const { db } = getFirebase();
  return collection(db, 'artifacts', appId, 'public', 'data', collName);
}
