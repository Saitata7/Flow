// src/config/firebaseInit.js
// Firebase initialization with error handling

// For now, use mock authentication to avoid native module issues
// This allows the app to run without Firebase configuration
const authObject = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    // Mock implementation - immediately call with null user
    callback(null);
    return () => {}; // Return unsubscribe function
  },
  signInAnonymously: () => Promise.resolve({ user: { uid: 'mock-user', isAnonymous: true } }),
  signInWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'mock-user' } }),
  createUserWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'mock-user' } }),
  signOut: () => Promise.resolve(),
  sendPasswordResetEmail: () => Promise.resolve(),
  updateProfile: () => Promise.resolve(),
};

// Export a function that returns the auth object (to match Firebase API)
const auth = () => authObject;

console.log('📱 Using mock Firebase authentication for development');

// Export Firebase Auth instance
export { auth };
export default auth;
