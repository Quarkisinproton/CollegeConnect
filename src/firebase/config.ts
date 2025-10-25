import { productionConfig } from '@/config/production';

// Use production config in production, fall back to env vars in development
const isProduction = process.env.NODE_ENV === 'production';

export const firebaseConfig = isProduction ? productionConfig.firebaseConfig : {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBXNrahmCq5_CwQ9HDrcoWr-AbDEUEZVlw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-6560732135-c4764.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-6560732135-c4764",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-6560732135-c4764.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "493519766207",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:493519766207:web:7ab5b4941abe1fbff83c0a"
};

