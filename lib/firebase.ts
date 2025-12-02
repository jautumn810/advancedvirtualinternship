import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { Auth, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization to prevent blocking initial page load
let app: FirebaseApp | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;
let googleProviderInstance: InstanceType<typeof GoogleAuthProvider> | null = null;

function getApp(): FirebaseApp | null {
  // Check if Firebase config is available first
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase configuration is missing. Please set NEXT_PUBLIC_FIREBASE_* environment variables.');
    return null;
  }

  if (!app) {
    if (!getApps().length) {
      try {
        app = initializeApp(firebaseConfig);
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        return null;
      }
    } else {
      app = getApps()[0];
    }
  }
  return app;
}

export function getAuthInstance(): ReturnType<typeof getAuth> | null {
  const appInstance = getApp();
  if (!appInstance) {
    return null;
  }
  if (!authInstance) {
    authInstance = getAuth(appInstance);
  }
  return authInstance;
}

export function getDbInstance(): ReturnType<typeof getFirestore> | null {
  const appInstance = getApp();
  if (!appInstance) {
    return null;
  }
  if (!dbInstance) {
    dbInstance = getFirestore(appInstance);
  }
  return dbInstance;
}

export function getGoogleProvider(): InstanceType<typeof GoogleAuthProvider> {
  if (!googleProviderInstance) {
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({ prompt: 'select_account' });
  }
  return googleProviderInstance;
}

// Export lazy getters that return actual instances
// This ensures compatibility with Firebase functions that expect real instances
// while still allowing lazy initialization
let _auth: ReturnType<typeof getAuth> | null = null;
let _db: ReturnType<typeof getFirestore> | null = null;

export const auth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_target, prop) {
    if (!_auth) {
      _auth = getAuthInstance();
      if (!_auth) {
        return () => {
          console.warn('Firebase Auth is not initialized. Please configure Firebase environment variables.');
        };
      }
    }
    const value = _auth[prop as keyof typeof _auth];
    if (typeof value === 'function') {
      return value.bind(_auth);
    }
    return value;
  }
});

export const db = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_target, prop) {
    if (!_db) {
      _db = getDbInstance();
      if (!_db) {
        return () => {
          console.warn('Firebase Firestore is not initialized. Please configure Firebase environment variables.');
        };
      }
    }
    const value = _db[prop as keyof typeof _db];
    if (typeof value === 'function') {
      return value.bind(_db);
    }
    return value;
  }
});

export const googleProvider = getGoogleProvider();
export default getApp() || ({} as FirebaseApp);

