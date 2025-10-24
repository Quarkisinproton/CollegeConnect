// Production configuration - hardcoded values for Vercel deployment
// This bypasses environment variable issues in Vercel

export const productionConfig = {
  firebaseConfig: {
    apiKey: "AIzaSyAy-y9kXxFOd8B9jmAHJNTTTh5LHdT8L0I",
    authDomain: "studio-6560732135-c4764.firebaseapp.com",
    projectId: "studio-6560732135-c4764",
    storageBucket: "studio-6560732135-c4764.firebasestorage.app",
    messagingSenderId: "6560732135",
    appId: "1:6560732135:web:cfad20868bc45577e76e67"
  },
  backendUrl: "https://collegeconnect-backend-htrb.onrender.com"
};
