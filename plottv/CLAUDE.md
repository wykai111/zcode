# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- **Install dependencies**: `npm install`
- **Start development server**: `npx expo start`
- **Start dev with go mode**: `npm run dev`
- **Run Android**: `npm run android`
- **Run iOS**: `npm run ios`
- **Run Web**: `npm run web`
- **Prebuild Android**: `npm run prebuild:android`
- **Prebuild iOS**: `npm run prebuild:ios`
- **Lint**: `npm run lint`
- **Build Android AAB (Release)**: `./build-android.sh` (Auto-signs if `release.jks` exists)
- **First-time Build (Gen Key + AAB)**: `./build-android.sh --gen-keystore`
- **Build Android APK**: `./build-android.sh apk`
- **Build Android with Custom Signing**: `./build-android.sh aab --keystore ./file.jks --alias my --password pass`
- **Build iOS (Local Script)**: `./build-ios.sh`
- **EAS Build**: `eas build` (defined in `eas.json`)

## Architecture & Structure
This is an **Expo (React Native)** project using **Expo Router** for file-based routing and **TypeScript** for type safety. Project name: "PlotTV" (Streaming Application).

### Key Directories
- `app/`: Application routes and layouts (Expo Router).
  - `(tabs)/`: Tab-based navigation (Home, For You, My List, Profile).
  - `video/[id].tsx`: Video playback route.
  - `privacyPolicy.tsx`: Privacy policy page.
  - Others: `feedback.tsx`, `history.tsx`, `language.tsx`, `manageSubscription.tsx`, `myWallet.tsx`, `settings.tsx`, `store.tsx`.
- `api/`: API client configuration and endpoints.
- `components/`: Reusable UI components.
- `constants/`: Application constants (IAP, theme, etc.).
- `hooks/`: Custom React hooks (useIAP, useScreenProtection, etc.).
- `plugins/`: Custom Expo config plugins.
  - `withBundleEncryption.js`: Bundle encryption.
  - `withAndroidAbiSplit.js`: Android ABI splitting configuration.
  - `withAndroidProguard.js`: ProGuard configuration.
  - `withScreenProtection.js`: Screen recording protection.
- `utils/`: Utility functions (storage, encryption, etc.).
- `props/`: iOS provisioning profiles and certificates.

### Core Technologies
- **Framework**: Expo SDK ~54.0.32, React 19.1.0, React Native 0.81.5.
- **Routing**: expo-router ~6.0.21.
- **UI & Navigation**: @react-navigation/native (v7+), expo-linear-gradient, expo-blur.
- **Native Modules**:
  - Performance: react-native-reanimated ~4.1.1, react-native-worklets 0.5.1, react-native-nitro-modules.
  - Payments: react-native-iap ^14.7.6.
  - Video: expo-video ~3.0.15.
- **Security**: Custom bundle encryption with Native BundleDecryptor (Kotlin/Swift).

### Development Workflow
- Uses a "Continuous Native Generation" approach; native directories are volatile and managed via `npx expo prebuild`.
- **CRITICAL**: Do NOT modify files directly in `android/` or `ios/` as they are overwritten by prebuild. Use Expo plugins in `plugins/` instead.
- Android builds support ABI splitting and AAB format via `build-android.sh`.
- The new React Native architecture is enabled (`newArchEnabled=true`).