// Using mock authentication service for Expo compatibility
// This provides Firebase-like functionality without native modules
import mockAuthService from './mockAuthService';

class FirebaseAuthService {
  constructor() {
    this.auth = mockAuthService;
    this.currentUser = null;
    this.listeners = [];
    
    // Listen for auth state changes
    this.auth.addAuthStateListener((user) => {
      this.currentUser = user;
      this.notifyListeners(user);
    });
  }

  // Add auth state listener
  addAuthStateListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of auth state changes
  notifyListeners(user) {
    this.listeners.forEach(listener => listener(user));
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Get user ID token for API calls
  async getIdToken() {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }
    return await this.currentUser.getIdToken();
  }

  // Sign in with email and password
  async signInWithEmail(email, password) {
    return await this.auth.signInWithEmail(email, password);
  }

  // Sign up with email and password
  async signUpWithEmail(email, password) {
    return await this.auth.signUpWithEmail(email, password);
  }

  // Sign in with Google
  async signInWithGoogle() {
    return await this.auth.signInWithGoogle();
  }

  // Sign in anonymously
  async signInAnonymously() {
    return await this.auth.signInAnonymously();
  }

  // Sign out
  async signOut() {
    return await this.auth.signOut();
  }

  // Send password reset email
  async sendPasswordResetEmail(email) {
    return await this.auth.sendPasswordResetEmail(email);
  }

  // Update user profile
  async updateProfile(updates) {
    return await this.auth.updateProfile(updates);
  }

  // Update user email
  async updateEmail(newEmail) {
    return await this.auth.updateEmail(newEmail);
  }

  // Update user password
  async updatePassword(newPassword) {
    return await this.auth.updatePassword(newPassword);
  }

  // Delete user account
  async deleteAccount() {
    return await this.auth.deleteAccount();
  }

  // Link email/password account with Google
  async linkWithGoogle() {
    return await this.auth.linkWithGoogle();
  }

  // Get user metadata
  getUserMetadata() {
    return this.auth.getUserMetadata();
  }
}

// Create singleton instance
const firebaseAuthService = new FirebaseAuthService();

export default firebaseAuthService;
