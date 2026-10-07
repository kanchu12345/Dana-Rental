// Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDuv-98HSQWvm_d8TGqgCeR0T9BtcJ1CCM",
  authDomain: "danan-rentals.firebaseapp.com",
  projectId: "danan-rentals",
  storageBucket: "danan-rentals.firebasestorage.app",
  messagingSenderId: "222043109277",
  appId: "1:222043109277:web:1c4d455cb5e5cdabb4e174",
  measurementId: "G-RLD749VSQ4"
};

// Check if Firebase keys are still placeholders
export function isFirebaseConfigured() {
  return firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY";
}
