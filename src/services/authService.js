/**
 * authService.js
 * Handles all Firebase Anonymous Authentication logic.
 * DESIGN PRINCIPLE: Never blocks UI. Never prompts the user.
 * RESILIENCE: All Firebase calls are guarded. If unconfigured, the system
 * runs entirely in session-only mode with no functionality lost.
 */
import { signInAnonymously, onAuthStateChanged, GoogleAuthProvider, linkWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const SESSION_KEY = 'roadsense_session_id';

/**
 * Generates a cryptographically random session ID as a fallback
 * when Firebase auth is unavailable (offline, slow network, etc.)
 */
const generateSessionId = () => {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const id = `session_${crypto.randomUUID()}`;
  localStorage.setItem(SESSION_KEY, id);
  return id;
};

/**
 * Returns the best available identity: Firebase UID > local session ID.
 * Never awaits — synchronous snapshot of the current auth state.
 */
export const getIdentity = () => {
  const firebaseUser = auth?.currentUser;
  if (firebaseUser) {
    return { id: firebaseUser.uid, type: 'firebase_anonymous' };
  }
  return { id: generateSessionId(), type: 'session_fallback' };
};

/**
 * Silent, background authentication — called on app mount.
 * Fire-and-forget: never awaited in the render path.
 */
export const initSilentAuth = () => {
  if (!auth) {
    console.info('[Auth] Firebase not configured — using session fallback.');
    generateSessionId(); // Ensure a session ID is ready immediately
    return;
  }

  signInAnonymously(auth)
    .then(async (credential) => {
      const { uid } = credential.user;
      if (db) {
        await setDoc(doc(db, 'users', uid), {
          created_at: serverTimestamp(),
          is_anonymous: true,
          last_seen: serverTimestamp(),
        }, { merge: true });
      }
      console.log('[Auth] Silent anonymous sign-in successful:', uid);
    })
    .catch((error) => {
      console.warn('[Auth] Silent sign-in failed, using session fallback:', error.code);
      generateSessionId();
    });
};

/**
 * Saves a report to Firestore (or local storage if offline/unconfigured).
 */
export const saveReport = async (reportData, location) => {
  const identity = getIdentity();
  const report = {
    user_id: identity.id,
    identity_type: identity.type,
    location: location,
    ai_output: reportData,
    status: 'submitted',
  };

  if (!db) {
    // No Firestore — store locally
    const pending = JSON.parse(localStorage.getItem('pending_reports') || '[]');
    pending.push({ ...report, timestamp: new Date().toISOString(), isPending: true });
    localStorage.setItem('pending_reports', JSON.stringify(pending));
    console.info('[Firestore] No DB configured, stored locally.');
    return { success: false, pending: true };
  }

  try {
    const reportRef = doc(db, 'reports', crypto.randomUUID());
    await setDoc(reportRef, { ...report, timestamp: serverTimestamp() });
    console.log('[Firestore] Report saved:', reportRef.id);
    return { success: true, reportId: reportRef.id };
  } catch (error) {
    console.warn('[Firestore] Save failed, storing locally:', error.message);
    const pending = JSON.parse(localStorage.getItem('pending_reports') || '[]');
    pending.push({ ...report, timestamp: new Date().toISOString(), isPending: true });
    localStorage.setItem('pending_reports', JSON.stringify(pending));
    return { success: false, pending: true };
  }
};

/**
 * Syncs locally-stored reports when the network is restored.
 */
export const syncPendingReports = async () => {
  if (!db) return;
  const pending = JSON.parse(localStorage.getItem('pending_reports') || '[]');
  if (pending.length === 0) return;

  console.log(`[Sync] Attempting to sync ${pending.length} pending report(s)`);
  const remaining = [];
  for (const report of pending) {
    try {
      await setDoc(doc(db, 'reports', crypto.randomUUID()), {
        ...report,
        timestamp: serverTimestamp(),
        status: 'synced_late',
      });
    } catch {
      remaining.push(report);
    }
  }
  localStorage.setItem('pending_reports', JSON.stringify(remaining));
  console.log(`[Sync] Done. ${remaining.length} still pending.`);
};

/**
 * Links the anonymous Firebase account to a Google account.
 * The UID is preserved — all existing reports are inherited automatically.
 */
export const upgradeToGoogle = async () => {
  if (!auth?.currentUser) return { success: false, error: 'Not authenticated' };

  const provider = new GoogleAuthProvider();
  try {
    const result = await linkWithPopup(auth.currentUser, provider);
    if (db) {
      await setDoc(doc(db, 'users', result.user.uid), {
        is_anonymous: false,
        email: result.user.email,
        upgraded_at: serverTimestamp(),
      }, { merge: true });
    }
    console.log('[Auth] Account upgraded to Google:', result.user.email);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('[Auth] Upgrade failed:', error.code);
    return { success: false, error };
  }
};

/**
 * Registers a reactive listener for auth state changes.
 */
export const onAuthReady = (callback) => {
  if (!auth) {
    callback(null); // Immediately signal no auth user
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
