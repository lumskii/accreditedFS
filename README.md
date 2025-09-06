# Accredited Financial Services — UI Skeleton

This repo contains a Vite + React + TypeScript skeleton implementing the components you supplied, updated for modern React/TypeScript usage and Tailwind CSS.

Quick start

1. Install dependencies

```bash
npm install
# Accredited Financial Services — UI Skeleton

This repository contains a Vite + React + TypeScript frontend skeleton built with Tailwind CSS and modular components.

Quick start

1) Install dependencies

```bash
npm install
```

2) Start dev server

```bash
npm run dev
```

Development notes
- Tailwind: configured in `tailwind.config.js` and imported in `src/index.css`.
- Icons: `lucide-react`.
- Source files: `src/` and `src/components/`.

Firebase integration (local setup)

1. Create a Firebase project at https://console.firebase.google.com/ and enable Hosting, Realtime Database, and Analytics.
2. Add a web app and copy the Firebase config values.
3. Create a `.env.local` file in the project root with the following (example):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

4. The project includes a small `src/firebase.ts` helper (if you add it) to initialize the modular Firebase SDK using those env vars. Keep `.env.local` out of Git (it is in `.gitignore`).

Realtime Database usage
- Use the modular `firebase/database` functions in `src/firebase.ts`.
- Example: read/writes wrapped in small helper functions exported from `src/firebase.ts`.

Publishing (Firebase Hosting)

1. Install the Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Login and init:

```bash
firebase login
firebase init hosting
```

Choose the site you created and set the public directory to `dist` (the Vite build output). When asked to configure as a single-page app, answer `yes`.

3. Build and deploy

```bash
npm run build
firebase deploy --only hosting
```

Environment & security
- Use Vite env vars prefixed with `VITE_` for client-side values. Keep any server-only secrets (API keys with privileged access) in a secure server or Cloud Functions, not in client code.

Development workflow suggestions
- Keep components small and testable.
- Add unit tests with Vitest or React Testing Library.
- Add E2E tests with Playwright or Cypress for critical flows.

If you'd like, I can:
- Add `src/firebase.ts` implementing initialization + simple helpers for Realtime Database and Analytics.
- Install `firebase` into `package.json` and run `npm install`.
- Add a demo write/read to the Realtime DB behind a simple UI in the app.

Tell me which of the above you'd like me to do next and I'll implement it.
