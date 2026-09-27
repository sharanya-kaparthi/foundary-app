# Foundary

AI-powered campus Lost & Found — Next.js + Firebase.

## 1. Install

```bash
npm install
```

## 2. Set up Firebase

1. Create a project at https://console.firebase.google.com
2. Add a Web app to it, and copy the config values it gives you.
3. Enable **Authentication → Sign-in method**: turn on **Email/Password** and **Anonymous**.
4. Enable **Firestore Database** (production mode is fine — rules below cover it).
5. In the Firestore Rules tab, paste in the contents of `firestore.rules` from this repo (starter rules, see the comment in that file).

## 3. Get a Gemini API key

Create a key at https://aistudio.google.com/apikey. This key is used **server-side only** (see `pages/api/analyze.js`) so it's never exposed to the browser.

## 4. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in the Firebase values from step 2 and the Gemini key from step 3.

## 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

## 6. Deploy to Vercel

**Option A — GitHub (recommended):**
1. Push this folder to a new GitHub repo.
2. Go to https://vercel.com/new, import that repo.
3. In the import screen (or afterwards in Project Settings → Environment Variables), add every variable from `.env.local` — **including `GEMINI_API_KEY`, without the `NEXT_PUBLIC_` prefix.**
4. Deploy.

**Option B — Vercel CLI, no GitHub needed:**
```bash
npm i -g vercel
vercel
```
Follow the prompts, then add the same environment variables with:
```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# ...repeat for each variable, then:
vercel --prod
```

## What's mocked / not yet wired up

- Custodian accounts must currently be created directly in Firestore/Auth by an admin (there's no management dashboard yet — that's a later phase per the project plan).
- The Gemini model name in `pages/api/analyze.js` is `gemini-3-flash-preview` — update it if your API key doesn't have access to that model.
- Firestore rules included here are a starting point, not a final security review.
