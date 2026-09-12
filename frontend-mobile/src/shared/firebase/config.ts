import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'dummy_api_key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'dummy.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dummy',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'dummy.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'dummy',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'dummy'
};

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

let app: FirebaseApp | null = null;
let auth: Auth | any;

if (!USE_MOCKS && import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'dummy_api_key') {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  // Mock fallback para desarrollo local fluido
  app = null;
  auth = {
    currentUser: {
      uid: 'socio-demo-123',
      email: 'carlos.socio@ejemplo.com',
      displayName: 'Carlos Martínez'
    },
    onAuthStateChanged: (cb: any) => {
      cb({
        uid: 'socio-demo-123',
        email: 'carlos.socio@ejemplo.com',
        displayName: 'Carlos Martínez',
        getIdToken: async () => 'mock-socio-token'
      });
      return () => {};
    }
  } as any;
}

export { auth };
