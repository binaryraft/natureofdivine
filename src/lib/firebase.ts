
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Check if all required environment variables are set
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  console.error("Firebase config environment variables are not set. Please check your .env file. The app may not function correctly.");
}


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
    try {
        enableIndexedDbPersistence(db)
          .catch((err) => {
            if (err.code == 'failed-precondition') {
              console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.code == 'unimplemented') {
              console.warn('The current browser does not support all of the features required to enable persistence.');
            }
          });
    } catch(e) {
        console.error("Error enabling Firestore persistence:", e);
    }
}
