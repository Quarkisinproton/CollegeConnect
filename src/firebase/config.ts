import { productionConfig } from '@/config/production';

// Use production config in production, fall back to env vars in development
const isProduction = process.env.NODE_ENV === 'production';

export const firebaseConfig = isProduction ? productionConfig.firebaseConfig : {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAy-y9kXxFOd8B9jmAHJNTTTh5LHdT8L0I",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-6560732135-c4764.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-6560732135-c4764",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-6560732135-c4764.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "6560732135",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:6560732135:web:cfad20868bc45577e76e67"
};

