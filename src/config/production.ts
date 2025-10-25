// Production configuration - hardcoded values for Vercel deployment
// This bypasses environment variable issues in Vercel

export const productionConfig = {
  firebaseConfig: {
    // Use the exact Web App config from Firebase Console > Project Settings > General > Your apps (Web app)
    apiKey: "AIzaSyBXNrahmCq5_CwQ9HDrcoWr-AbDEUEZVlw",
    authDomain: "studio-6560732135-c4764.firebaseapp.com",
    projectId: "studio-6560732135-c4764",
    // storageBucket can be omitted; if needed, default is <project-id>.appspot.com
    storageBucket: "studio-6560732135-c4764.appspot.com",
    messagingSenderId: "493519766207",
    appId: "1:493519766207:web:7ab5b4941abe1fbff83c0a"
  },
  backendUrl: "https://collegeconnect-backend-htrb.onrender.com"
};
