import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'dummy_api_key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'dummy.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dummy',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'dummy.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'dummy',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'dummy'
};

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

let app: FirebaseApp | null = null;
let auth: Auth | any;

if (!USE_MOCKS && import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key') {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  // Proporcionar un mock básico para evitar que la app explote
  app = null;
  auth = {
    currentUser: null,
    onAuthStateChanged: (cb: any) => { cb({ uid: 'mock-user-123', email: 'mock@example.com', getIdToken: async () => 'mock-token' }); return () => {}; }
  } as any;
}

export { auth };
