Technical Overview: Wortschatz
This document provides a comprehensive technical summary of the Wortschatz German learning application. It is designed to guide development, maintenance, and future feature integration, specifically focusing on the React Native and Expo ecosystem.

1. Application Architecture
The application follows a local-first, offline-capable architecture using modern React Native patterns.

State Management:
Library: Zustand (^5.0.8).
Usage: Manages global application state such as user progress, daily goals, game stats (lives, score), and settings.
Persistence: Uses persist middleware with @react-native-async-storage/async-storage to save state across app restarts.
Navigation:
Library: Expo Router (~6.0.15).
Structure: File-based routing located in src/app. Uses a directory-based structure (e.g., (tabs)) to define navigation stacks and tab bars automatically.
Design Pattern:
Modular Component Structure: UI components are separated into src/components.
Repository Pattern: Database interactions are abstracted in src/db/repository.ts, separating data logic from UI components.
2. Technology Stack
Frontend
Framework: React Native (v0.81.5) with Expo SDK 54.
Language: TypeScript (Strict typing enabled).
UI Library: Tamagui (^1.138.1) for styled components and responsive design.
Architecture: New Architecture (Fabric/TurboModules) is enabled ("newArchEnabled": true in app.json).
Backend & Data
Backend: None (Serverless/Local). The application operates entirely on the device.
Database: SQLite via expo-sqlite (~16.0.9).
Schema: Relational data model with tables for words, lessons, scenarios, and phrases.
Storage: Local file system database.
Key-Value Storage: @react-native-async-storage/async-storage is used for lightweight state persistence (Zustand store). react-native-mmkv is installed but appears to be secondary or reserved for high-performance needs.
Data Synchronization: Currently, there is no remote synchronization. Data lives and dies on the device. Backup/Restore would require manual implementation (e.g., exporting the SQLite file).
3. Core Components & Expo Usage
Core Modules
Learning/Flashcards: Core logic for displaying words and tracking mastery.
Quiz/Game Mode: Interactive game logic managed via Zustand (quizLives, score).
Progress Tracking: Daily goal tracking and persistence.
Critical Expo Modules
The application relies heavily on the Expo ecosystem for native capabilities:

expo-av: Used for audio playback (pronunciations).
expo-speech: Text-to-Speech (TTS) functionality for phrases/words.
expo-haptics: Haptic feedback for user interactions (success/fail states).
expo-file-system: Access to local files (assets, database).
expo-sqlite: Core database engine.
expo-font: Custom font loading.
Build Workflow
Current State: The project contains android directories, indicating it has been Prebuilt (CNG - Continuous Native Generation).
Workflow: Expo Managed Workflow (with Prebuild) is the recommended approach. You can modify native code, but ideally, you should use Config Plugins in app.json to maintain native configurations so they persist across npx expo prebuild commands.
4. Code Standards & Maintenance
Code Quality
Linting: ESLint is configured with eslint-config-expo. This ensures adherence to React Native and Expo best practices (e.g., dependency arrays in hooks, import ordering).
Formatting: Likely relying on Prettier (standard in Expo setups), though explicit config was not detailed.
Testing Strategy
Current Status: No automated testing framework (Jest/Enzyme) is currently active or configured in package.json scripts.
Recommendation:
Unit Tests: Install jest-expo and @testing-library/react-native for component and utility testing.
E2E Tests: Consider Maestro or Detox for critical user flows (e.g., completing a quiz).
5. Integration of New Native Features
When adding features requiring native code (e.g., Bluetooth, Custom Camera, AR):

Search for Expo Modules: First, check the Expo Directory for existing Expo modules (e.g., expo-camera, expo-ble). These work out-of-the-box.
Config Plugins (Recommended):
If a library requires native setup (modifying AndroidManifest.xml or Info.plist), look for a Config Plugin.
Add it to the plugins array in app.json.
Run npx expo prebuild to regenerate native folders.
Custom Native Code (CNG):
If no plugin exists, you can write a local Config Plugin to automate the native changes.
Avoid manually editing android/ or ios/ folders directly if possible, as these changes can be lost if you reset the project.
Development Build:
For any new native module, you cannot use the standard "Expo Go" app.
You must build a Development Client:
npx expo run:android
# or
npx expo run:ios
This creates a custom version of Expo Go containing your specific native libraries.