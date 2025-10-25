import { productionConfig } from '@/config/production';

// ALWAYS use production config - it has the correct hardcoded values
// The env var fallback was causing issues with Vercel's env var handling
export const firebaseConfig = productionConfig.firebaseConfig;

