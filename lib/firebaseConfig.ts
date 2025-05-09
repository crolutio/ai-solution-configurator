// lib/firebaseConfig.ts
import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
// Import types and function for Analytics
import { getAnalytics, Analytics } from "firebase/analytics";


// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App
let app: FirebaseApp;
if (!getApps().length) {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof FirebaseOptions]);

  if (missingKeys.length > 0) {
    console.error(`Firebase initialization failed: Missing required environment variables: ${missingKeys.join(', ')}`);
    // Consider if you want to throw here or just log, throwing stops the app if config is bad
    throw new Error("Missing Firebase environment variables");
  }

  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Get Firebase services
const db: Firestore = getFirestore(app);

// Initialize Analytics only on the client side
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}


export { db, analytics }; // Export db and analytics