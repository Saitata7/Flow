import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com', // From Firebase Console
  offlineAccess: true,
});

class FirebaseAuthService {
  constructor() {
    this.auth = auth();
    this.currentUser = null;
    this.listeners = [];
    
    // Listen for auth state changes
    this.auth.onAuthStateChanged((user) => {
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
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      return {
        success: true,
        user: userCredential.user,
        token: await userCredential.user.getIdToken(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  // Sign up with email and password
  async signUpWithEmail(email, password) {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      return {
        success: true,
        user: userCredential.user,
        token: await userCredential.user.getIdToken(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const userCredential = await this.auth.signInWithCredential(googleCredential);
      
      return {
        success: true,
        user: userCredential.user,
        token: await userCredential.user.getIdToken(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  // Sign in anonymously
  async signInAnonymously() {
    try {
      const userCredential = await this.auth.signInAnonymously();
      return {
        success: true,
        user: userCredential.user,
        token: await userCredential.user.getIdToken(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      await this.auth.signOut();
      await GoogleSignin.signOut(); // Also sign out from Google
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email) {
    try {
      await this.auth.sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }
      
      await this.currentUser.updateProfile(updates);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  // Update user email
  async updateEmail(newEmail) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }
      
      await this.currentUser.updateEmail(newEmail);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  // Update user password
  async updatePassword(newPassword) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }
      
      await this.currentUser.updatePassword(newPassword);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  // Delete user account
  async deleteAccount() {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }
      
      await this.currentUser.delete();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  // Link email/password account with Google
  async linkWithGoogle() {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }

      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Link the credential to the current user
      const userCredential = await this.currentUser.linkWithCredential(googleCredential);
      
      return {
        success: true,
        user: userCredential.user,
        token: await userCredential.user.getIdToken(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  // Get user metadata
  getUserMetadata() {
    if (!this.currentUser) {
      return null;
    }

    return {
      uid: this.currentUser.uid,
      email: this.currentUser.email,
      displayName: this.currentUser.displayName,
      photoURL: this.currentUser.photoURL,
      emailVerified: this.currentUser.emailVerified,
      isAnonymous: this.currentUser.isAnonymous,
      creationTime: this.currentUser.metadata.creationTime,
      lastSignInTime: this.currentUser.metadata.lastSignInTime,
      providerData: this.currentUser.providerData,
    };
  }
}

// Create singleton instance
const firebaseAuthService = new FirebaseAuthService();

export default firebaseAuthService;
