# LifeVault

> **Your life. Organized.**
>
> You enter it once. LifeVault remembers it for you.

---

## What is LifeVault?

LifeVault is a personal life organization and memory system for Android and iOS. It helps you store, understand, and act on your most important personal information — documents, receipts, expenses, payments, vehicles, assets, warranties, insurance, and more.

Unlike a document storage app, LifeVault **understands** your information, creates smart reminders, provides AI-powered search, and puts you back in control of the details that matter.

Your data lives in your own Google Drive and Google Sheets — LifeVault never stores your files on third-party servers.

---

## Screenshots

> Phase 1 — UI Foundation (Demo Data)

| Splash | Login | Today |
|--------|-------|-------|
| *Coming* | *Coming* | *Coming* |

| Vault | Money | Profile |
|-------|-------|---------|
| *Coming* | *Coming* | *Coming* |

---

## Features (Phase 1 — UI Foundation)

- ✅ Premium white/light design system
- ✅ LifeVault logomark and branding
- ✅ Splash screen with animation
- ✅ Login screen (mock — Phase 1 only)
- ✅ Today dashboard with spending, alerts, and recent items
- ✅ Vault screen with categories and search
- ✅ Money screen with expenses, payments, and analytics
- ✅ Profile screen with settings
- ✅ Add menu (bottom sheet with 8 add options)
- ✅ AI assistant (mock responses — Phase 1)
- ✅ Reminders screen
- ✅ Vehicles screen with status pills
- ✅ Assets screen
- ✅ Bottom navigation with FAB
- ✅ Mock data (clearly separated)
- ✅ Complete TypeScript type system

---

## Architecture

```
LifeVault/
├── mobile/                  React Native app (Android + iOS)
│   ├── android/             Android native project
│   ├── ios/                 iOS native project
│   ├── src/
│   │   ├── components/      Reusable UI components
│   │   ├── screens/         All application screens
│   │   │   ├── Splash/
│   │   │   ├── Login/
│   │   │   ├── Today/
│   │   │   ├── Vault/
│   │   │   ├── Money/
│   │   │   ├── Profile/
│   │   │   ├── AI/
│   │   │   ├── AddMenu/
│   │   │   ├── Reminders/
│   │   │   ├── Vehicles/
│   │   │   └── Assets/
│   │   ├── navigation/      Navigation and tab bar
│   │   ├── theme/           Design system tokens
│   │   ├── types/           TypeScript interfaces
│   │   ├── mock/            Phase 1 demo data (separated)
│   │   └── utils/           Helper functions
│   ├── App.tsx              Root component
│   └── index.js             RN entry point
│
├── server/                  Backend (Phase 3+)
│   ├── src/
│   │   └── index.ts         Express server placeholder
│   └── .env.example         Environment variable template
│
├── README.md
└── .gitignore
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.76 |
| Language | TypeScript (strict) |
| Navigation | React Navigation v6 |
| Animations | React Native Reanimated 3 |
| Storage (Phase 2+) | AsyncStorage → Local DB |
| Cloud Storage (Phase 3+) | Google Drive |
| Structured Data (Phase 3+) | Google Sheets |
| Auth (Phase 3+) | Google Sign-In / OAuth |
| OCR (Phase 4+) | Google Vision API (via server) |
| AI (Phase 4/8+) | Gemini (via server) |
| Backend | Node.js + Express + TypeScript |

---

## Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ Complete | UI/UX foundation, all screens, design system, mock data |
| Phase 2 | ⏳ Pending | Local data model, offline cache, CRUD |
| Phase 3 | ⏳ Pending | Google Auth, Drive, Sheets integration |
| Phase 4 | ⏳ Pending | Documents, OCR, AI extraction |
| Phase 5 | ⏳ Pending | Money, expenses, payments, analytics |
| Phase 6 | ⏳ Pending | Reminders, notifications, Calendar |
| Phase 7 | ⏳ Pending | Vehicles, assets, record relationships |
| Phase 8 | ⏳ Pending | AI assistant, share-to-LifeVault, sync engine |
| Phase 9 | ⏳ Pending | Testing, security, optimization, release |

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- React Native development environment ([official guide](https://reactnative.dev/docs/environment-setup))
- Android Studio (for Android)
- Xcode (for iOS — macOS only)
- JDK 17+

### Mobile App

```bash
cd mobile
npm install
npx react-native start          # Start Metro bundler
npx react-native run-android    # Run on Android
npx react-native run-ios        # Run on iOS (macOS only)
```

### TypeScript Check

```bash
cd mobile
npx tsc --noEmit
```

### Server (Phase 3+)

```bash
cd server
npm install
cp .env.example .env
# Fill in .env with your credentials
npm run dev
```

---

## Environment Variables

All sensitive configuration lives in `server/.env` (never committed).

See [`server/.env.example`](server/.env.example) for required variables.

**Never put API keys, OAuth secrets, or credentials in the mobile app.**

---

## Security Notes

- API keys and secrets are **server-side only** — never in the mobile bundle
- Google OAuth token exchange happens **server-side**
- User data is stored in the **user's own Google Drive and Sheets**
- LifeVault does not maintain a central user database
- Local device storage uses encrypted storage (Phase 2+)
- The user can disconnect Google and delete all LifeVault data at any time

---

## Known Limitations (Phase 1)

- Google authentication is **not yet connected** (mock only)
- Google Drive / Sheets integration is **not yet implemented**
- OCR and AI extraction are **not yet implemented**
- Push notifications are **not yet scheduled**
- Background sync is **not yet implemented**
- All data is **demo/mock data only**
- Android and iOS native projects need scaffolding via `react-native init`

---

## Future Roadmap

- Phase 2: Full offline-first local database
- Phase 3: Real Google account integration
- Phase 4: Document scanning with AI understanding
- Phase 5: Complete money management
- Phase 6: Smart notification system
- Phase 7: Vehicle and asset lifecycle management
- Phase 8: Natural language AI assistant
- Phase 9: Production-ready release

---

## Contributing

This is a private project under active development. Contributions are not yet open.

---

## License

Proprietary — All rights reserved.

---

*LifeVault — Your life. Organized.*
