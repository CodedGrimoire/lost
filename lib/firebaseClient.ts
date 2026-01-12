"use client";

import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

const rawConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(rawConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length) {
  throw new Error(
    `Missing Firebase client config for: ${missingKeys.join(", ")}`,
  );
}

const firebaseConfig: FirebaseOptions = {
  apiKey: rawConfig.apiKey!,
  authDomain: rawConfig.authDomain!,
  projectId: rawConfig.projectId!,
  appId: rawConfig.appId!,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
