/**
 * vitest.setup.js
 * Global test setup — mocks Vite's import.meta.env for unit tests.
 */
import { vi } from 'vitest';

// Provide safe mock values for all VITE_ environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_GEMINI_API_KEY: 'test-api-key',
    VITE_FIREBASE_API_KEY: '',
    VITE_FIREBASE_AUTH_DOMAIN: '',
    VITE_FIREBASE_PROJECT_ID: '',
    VITE_FIREBASE_STORAGE_BUCKET: '',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '',
    VITE_FIREBASE_APP_ID: '',
    VITE_FIREBASE_MEASUREMENT_ID: '',
  },
  writable: true,
});
