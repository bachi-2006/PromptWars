# RoadSense AI – Todo

## ✅ Completed

### Phase 1: Branding & Core UI
- [x] Rebrand from WitnessSave → RoadSense AI
- [x] Panic-safe UX with large CTAs and minimal friction
- [x] Glassmorphic darkmode UI with Framer Motion animations

### Phase 2: AI Extraction (Gemini)
- [x] Live Gemini API integration (`gemini-3.1-pro-preview`)
- [x] Tiered fallback: pro-preview → 2.0-flash → 1.5-flash → mock
- [x] Structured JSON schema extraction with urgency levels
- [x] Hybrid urgency engine (`urgencyEngine.js`) with rule overrides

### Phase 3: Data Capture
- [x] GPS auto-detection + timestamp
- [x] Voice capturing indicator (Mic pulsing)
- [x] "Stop & Extract Details" → Gemini analysis

### Phase 4: Report UI
- [x] Structured incident report with confidence score
- [x] Urgency badge (HIGH / CRITICAL / LOW) color-coded
- [x] AI tags: Vehicles, Injuries, Road condition, Helmet detection
- [x] Vehicle card grid with plate blurring

### Phase 5: Privacy & Sharing
- [x] Privacy Filter toggle (blur plates/faces)
- [x] Privacy Consent Modal before sharing
- [x] Emergency First Aid instructions screen

### Phase 6: Anonymous Auth System
- [x] Firebase Anonymous Auth (silent, non-blocking)
- [x] Session fallback when Firebase is offline/unconfigured
- [x] Report saved to Firestore (with offline localStorage fallback)
- [x] Auto-sync pending reports when network restores
- [x] "Sign in to save" slide-up upgrade prompt (post-report)
- [x] Google account linking (UID preserved, reports carried over)
- [x] Firestore security rules (`firestore.rules`)

### Phase 7: Environment & Security
- [x] All API keys in `.env` (never hardcoded in source)
- [x] `.gitignore` updated to exclude `.env` and `.firebase/`
- [x] `.env.example` for onboarding new developers
- [x] Firebase Analytics connected

---

## ⏳ Pending (Manual step required)

- [ ] **Enable Anonymous Sign-In** in Firebase Console
  → https://console.firebase.google.com/project/prompt--wars/authentication/providers
- [ ] Deploy Firestore security rules (`firestore.rules`) via `firebase deploy --only firestore:rules`

---

## 🔮 Future Enhancements

- [ ] Real camera/microphone capture (replace simulation)
- [ ] Image upload to Gemini for real scene analysis
- [ ] Push notifications via Firebase Cloud Messaging
- [ ] Admin dashboard for emergency responders
