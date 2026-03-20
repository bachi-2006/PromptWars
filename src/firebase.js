// Firebase configuration — replace with your values from the Firebase Console.
// If not yet configured, the app falls back to anonymous session mode gracefully.
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Only initialize if all required config keys are present
const isConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

let app = null, db = null, storage = null, auth = null, analytics = null;

if (isConfigured) {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    // Analytics is only supported in browser environments
    isSupported().then(yes => {
      if (yes) {
        analytics = getAnalytics(app);
        console.log('[Firebase] Analytics initialized');
      }
    });
    console.log('[Firebase] Initialized successfully');
  } catch (e) {
    console.warn('[Firebase] Initialization failed, running in offline mode:', e.message);
  }
} else {
  console.info('[Firebase] Not configured — running in session-only mode. Set VITE_FIREBASE_* env vars to enable cloud features.');
}

export { db, storage, auth, analytics };
export default app;
