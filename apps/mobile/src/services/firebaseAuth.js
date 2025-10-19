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

  // Alias for test compatibility
  onAuthStateChanged(callback) {
    return this.addAuthStateListener(callback);
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

  // Get stored JWT token
  async getStoredJWTToken() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const jwtToken = await AsyncStorage.getItem('jwt_token');
      return jwtToken;
    } catch (error) {
      console.error('Error getting stored JWT token:', error);
      return null;
    }
  }

  // Store JWT token
  async storeJWTToken(jwtToken) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('jwt_token', jwtToken);
      console.log('✅ JWT token stored successfully');
    } catch (error) {
      console.error('Error storing JWT token:', error);
    }
  }

  // Convert Firebase token to JWT via API
  async getJWTTokenForAPI(firebaseToken, firebaseUser) {
    try {
      console.log('🔄 Converting Firebase token to JWT...');
      
      const apiClient = require('./apiClient').default;
      const response = await apiClient.post('/v1/auth/firebase-to-jwt', {
        firebaseToken: firebaseToken,
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }
      });
      
      if (response.data.success && response.data.jwtToken) {
        console.log('✅ Firebase token converted to JWT successfully');
        // Store the JWT token for future API calls
        await this.storeJWTToken(response.data.jwtToken);
        return response.data.jwtToken;
      } else {
        console.error('❌ JWT conversion failed:', response.data);
        throw new Error('JWT conversion failed');
      }
    } catch (error) {
      console.error('❌ Firebase to JWT conversion error:', error.message);
      throw error;
    }
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
      
      // Get Firebase ID token for API calls
      const firebaseToken = await userCredential.user.getIdToken();
      console.log('🔥 FirebaseAuthService: Firebase token obtained:', !!firebaseToken);
      console.log('✅ FirebaseAuthService: Using Firebase token directly for API calls');
      
      // Store Firebase token for API calls
      await this.storeJWTToken(firebaseToken);
      
      return {
        success: true,
        user: userCredential.user,
        token: firebaseToken, // Use Firebase token directly
        firebaseToken: firebaseToken,
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
      
      // Get Firebase ID token for API calls
      const firebaseToken = await userCredential.user.getIdToken();
      console.log('✅ FirebaseAuthService: Using Firebase token directly for API calls');
      
      // Store Firebase token for API calls
      await this.storeJWTToken(firebaseToken);
      
      return {
        success: true,
        user: userCredential.user,
        token: firebaseToken, // Use Firebase token directly
        firebaseToken: firebaseToken,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  // Alias for test compatibility
  async createUserWithEmail(email, password) {
    return await this.signUpWithEmail(email, password);
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

  // Alias for test compatibility
  async updateProfile(updates) {
    return await this.updateUserProfile(updates);
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

// Export both default and named export for compatibility
export { firebaseAuthService as firebaseAuth };
export default firebaseAuthService;
