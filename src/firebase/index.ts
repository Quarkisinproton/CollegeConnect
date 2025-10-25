'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
      console.log('[Firebase] Initialized via App Hosting environment');
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      // Debug: Log the config being used (masked for security)
      console.log('[Firebase] Using config:', {
        apiKey: firebaseConfig.apiKey.substring(0, 10) + '...',
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        appId: firebaseConfig.appId.substring(0, 20) + '...'
      });
      firebaseApp = initializeApp(firebaseConfig);
      console.log('[Firebase] Initialized with hardcoded config');
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  // Connect to emulators in development
  if (process.env.NODE_ENV === 'development') {
    // Connect to Firestore emulator
    try {
      // Check if already connected to avoid errors
      if (!(firestore as any)._persistenceKey?.includes('localhost')) {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
        console.log('Connected to Firestore emulator at localhost:8080');
      }
    } catch (e) {
      console.warn('Could not connect to Firestore emulator:', e);
    }
    
    // Note: Auth emulator is not available via gcloud SDK
    // Using real Firebase Auth for anonymous sign-in (works without emulator)
  }

  return {
    firebaseApp,
    auth,
    firestore
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
