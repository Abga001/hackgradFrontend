import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { authService } from "./apiService";

// Your Firebase configuration
// Replace these values with your actual Firebase project details
const firebaseConfig = {
    apiKey: "AIzaSyAamzUkXGmru4E1TRMSubUKS6PwEru2Zoo",

    authDomain: "hackgradchat.firebaseapp.com",
  
    projectId: "hackgradchat",
  
    storageBucket: "hackgradchat.firebasestorage.app",
  
    messagingSenderId: "597738346064",
  
    appId: "1:597738346064:web:e3fea523f9e8388eb3a355",
  
    //measurementId: "G-G5FZZ2KC57"
  
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