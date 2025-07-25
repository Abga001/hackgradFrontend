import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { authService } from "./apiService";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Function to authenticate with Firebase
export const authenticateWithFirebase = async () => {
  try {
    console.log("Starting Firebase authentication process");
    const firebaseToken = await authService.getFirebaseToken();
    console.log("Firebase token received successfully");
    
    try {
      await signInWithCustomToken(auth, firebaseToken);
      console.log("Firebase authentication successful");
      return true;
    } catch (authError) {
      console.error("Firebase authentication error:", authError.code, authError.message);
      alert(`Firebase authentication failed: ${authError.message}`);
      return false;
    }
  } catch (tokenError) {
    console.error("Error getting Firebase token:", tokenError);
    alert(`Failed to get Firebase token: ${tokenError.message || "Unknown error"}`);
    return false;
  }
};

export { db, auth };