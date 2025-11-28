# RetroStream - Spotify-Style Music App

A full-featured music streaming application with a retro aesthetic, built with Next.js 14, Firebase, and Tailwind CSS.

## Features

- 🎵 **Global Player**: Persistent bottom player with queue, seek, and volume controls.
- 📻 **Ad System**: Non-skippable ads play after every 30 minutes of listening (unless Admin).
- 🔐 **Authentication**: Firebase Auth with Admin roles.
- 🕵️ **Hidden Manager**: Secure `/duniyakapapa` route for uploading tracks and managing ads.
- 🎨 **Retro UI**: Custom design system with vinyl/tape aesthetics.
- 📱 **Responsive**: Works on desktop and mobile.

## Setup Instructions

### 1. Firebase Setup
1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication** (Email/Password provider).
3. Enable **Firestore Database** (Start in test mode or production mode).
4. Enable **Storage**.
5. Go to Project Settings -> General -> Your apps -> Web app. Copy the config.
6. Create a `.env.local` file (or use `.env.example` as reference) and fill in the values:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   ...
   ```
7. Go to Project Settings -> Service Accounts -> Generate new private key. Save as `serviceAccount.json` in the root (for local dev) or copy the content for Vercel env vars.

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Run Locally
```bash
npm run dev
```

### 4. Admin Setup
1. Sign up a new user in the app (`/signup`).
2. Run the admin creation script to make that user an admin:
   ```bash
   # Get the UID from Firebase Console -> Authentication
   npm run create-admin <YOUR_UID>
   ```
3. Access the hidden manager at `http://localhost:3000/duniyakapapa`.
4. Enter the unlock code: `KhudRakhLe*1` (or whatever you set in `.env`).

### 5. Deploying Security Rules
Install Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore storage
# Select 'use existing files' and point to firebase/firestore.rules and firebase/storage.rules
firebase deploy --only firestore:rules,storage
```

### 6. Vercel Deployment
1. Push to GitHub.
2. Import project in Vercel.
3. Add all Environment Variables from `.env.example`.
   - For `FIREBASE_SERVICE_ACCOUNT_KEY`, paste the entire JSON content of your service account file.
4. Deploy!

## Testing Checklist
- [ ] **Sign Up/Login**: Create a user.
- [ ] **Upload**: Go to `/duniyakapapa`, unlock, and upload an MP3 + Cover.
- [ ] **Playback**: Go to Home, click Play. Verify audio works and player appears.
- [ ] **Ad System**: 
    - Manually set `localStorage.setItem('cumulativeListeningSeconds', '1795')` in console.
    - Play a track and wait 5 seconds.
    - Verify ad plays next (if ads exist in DB).
- [ ] **Search**: Type in the search bar.

## Project Structure
- `/app`: Next.js App Router pages.
- `/components`: Reusable UI components.
- `/context`: Global state (Auth, Player).
- `/lib`: Firebase init and types.
- `/scripts`: Admin and seed scripts.
