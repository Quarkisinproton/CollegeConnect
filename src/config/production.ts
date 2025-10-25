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

// Debug: Log config in production to verify it's being loaded (remove after fixing)
if (typeof window !== 'undefined') {
  console.log('[ProductionConfig] Firebase config loaded:', {
    apiKey: productionConfig.firebaseConfig.apiKey.substring(0, 10) + '...',
    authDomain: productionConfig.firebaseConfig.authDomain,
    projectId: productionConfig.firebaseConfig.projectId,
    appId: productionConfig.firebaseConfig.appId.substring(0, 20) + '...'
  });
}
