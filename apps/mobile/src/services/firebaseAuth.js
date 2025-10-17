// Using React Native Firebase authentication service for production
import auth from '@react-native-firebase/auth';

class FirebaseAuthService {
  constructor() {
    console.log('🔥 FirebaseAuthService: Initializing with React Native Firebase...');
    
    try {
      // Use React Native Firebase directly
      this.auth = auth();
      this.currentUser = null;
      this.listeners = [];
      
      console.log('🔥 FirebaseAuthService: Firebase auth initialized:', !!this.auth);
      console.log('🔥 FirebaseAuthService: Firebase app:', !!this.auth.app);
      
      // Get current user
      this.currentUser = this.auth.currentUser;
      console.log('🔥 FirebaseAuthService: Current user:', !!this.currentUser);
      console.log('✅ FirebaseAuthService: Initialization successful');
    } catch (error) {
      console.error('❌ FirebaseAuthService: Initialization failed:', error);
      console.error('❌ FirebaseAuthService: Error message:', error.message);
      console.error('❌ FirebaseAuthService: Error stack:', error.stack);
      
      // Set fallback values
      this.auth = null;
      this.currentUser = null;
      this.listeners = [];
    }
  }

  // Add auth state listener
  addAuthStateListener(callback) {
    this.listeners.push(callback);
    
    // Use React Native Firebase auth state listener
    const unsubscribe = this.auth.onAuthStateChanged((user) => {
      console.log('🔥 FirebaseAuthService: Auth state changed:', !!user);
      this.currentUser = user;
      this.notifyListeners(user);
    });
    
    return unsubscribe;
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
    console.log('🔥 FirebaseAuthService: signInWithEmail called with React Native Firebase');
    console.log('🔥 FirebaseAuthService: email:', email);
    console.log('🔥 FirebaseAuthService: password length:', password.length);
    console.log('🔥 FirebaseAuthService: auth object:', !!this.auth);
    
    if (!this.auth) {
      console.error('❌ FirebaseAuthService: Firebase not initialized');
      return {
        success: false,
        error: 'Firebase not initialized',
        code: 'auth/not-initialized',
      };
    }
    
    try {
      console.log('🔥 FirebaseAuthService: Calling signInWithEmailAndPassword...');
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      console.log('🔥 FirebaseAuthService: Sign in successful');
      console.log('🔥 FirebaseAuthService: User:', !!userCredential.user);
      console.log('🔥 FirebaseAuthService: User UID:', userCredential.user.uid);
      console.log('🔥 FirebaseAuthService: User email:', userCredential.user.email);
      
      // Get ID token
      const token = await userCredential.user.getIdToken();
      console.log('🔥 FirebaseAuthService: Token obtained:', !!token);
      
      return {
        success: true,
        user: userCredential.user,
        token: token,
      };
    } catch (error) {
      console.error('🔥 FirebaseAuthService: Sign in failed:', error);
      console.error('🔥 FirebaseAuthService: Error message:', error.message);
      console.error('🔥 FirebaseAuthService: Error code:', error.code);
      
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
      const token = await userCredential.user.getIdToken();
      
      return {
        success: true,
        user: userCredential.user,
        token: token,
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
    console.log('🔥 FirebaseAuthService: Google sign in not implemented yet');
    return {
      success: false,
      error: 'Google sign in not implemented',
      code: 'auth/google-not-implemented',
    };
  }

  // Sign in anonymously
  async signInAnonymously() {
    try {
      const userCredential = await this.auth.signInAnonymously();
      const token = await userCredential.user.getIdToken();
      
      return {
        success: true,
        user: userCredential.user,
        token: token,
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
    console.log('🔥 FirebaseAuthService: Signing out...');
    try {
      await this.auth.signOut();
      this.currentUser = null;
      console.log('✅ FirebaseAuthService: Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('🔥 FirebaseAuthService: Sign out failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email) {
    console.log('🔥 FirebaseAuthService: Sending password reset email...');
    try {
      await this.auth.sendPasswordResetEmail(email);
      console.log('✅ FirebaseAuthService: Password reset email sent');
      return { success: true };
    } catch (error) {
      console.error('🔥 FirebaseAuthService: Password reset failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user profile
  async updateUserProfile(updates) {
    console.log('🔥 FirebaseAuthService: Updating user profile...');
    try {
      await this.currentUser.updateProfile(updates);
      console.log('✅ FirebaseAuthService: Profile updated');
      return { success: true };
    } catch (error) {
      console.error('🔥 FirebaseAuthService: Profile update failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user metadata
  getUserMetadata() {
    if (!this.currentUser) {
      return null;
    }
    return {
      creationTime: this.currentUser.metadata.creationTime,
      lastSignInTime: this.currentUser.metadata.lastSignInTime,
    };
  }
}

// Create singleton instance
console.log('🔥 Creating FirebaseAuthService singleton...');
const firebaseAuthService = new FirebaseAuthService();
console.log('🔥 FirebaseAuthService singleton created:', !!firebaseAuthService);

export default firebaseAuthService;
