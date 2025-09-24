// src/services/mockAuthService.js
// Mock authentication service that simulates Firebase functionality
// This works without native modules and provides real-time auth state

class MockAuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    this.isInitialized = false;
    
    // Simulate initialization delay
    setTimeout(() => {
      this.isInitialized = true;
      this.notifyListeners(this.currentUser);
    }, 1000);
  }

  // Add auth state listener
  addAuthStateListener(callback) {
    this.listeners.push(callback);
    
    // If already initialized, call immediately
    if (this.isInitialized) {
      callback(this.currentUser);
    }
    
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
    return this.currentUser.token;
  }

  // Sign in with email and password
  async signInWithEmail(email, password) {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Basic validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (!email.includes('@')) {
        throw new Error('Invalid email format');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Create mock user
      const user = {
        uid: `user_${Date.now()}`,
        email: email,
        displayName: email.split('@')[0],
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        token: `mock_token_${Date.now()}`,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        providerData: [{
          providerId: 'password',
          uid: email,
          displayName: email.split('@')[0],
          email: email,
        }],
      };

      this.currentUser = user;
      this.notifyListeners(user);
      
      return {
        success: true,
        user: user,
        token: user.token,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'auth/invalid-credentials',
      };
    }
  }

  // Sign up with email and password
  async signUpWithEmail(email, password) {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Basic validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (!email.includes('@')) {
        throw new Error('Invalid email format');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Create mock user
      const user = {
        uid: `user_${Date.now()}`,
        email: email,
        displayName: email.split('@')[0],
        photoURL: null,
        emailVerified: false,
        isAnonymous: false,
        token: `mock_token_${Date.now()}`,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        providerData: [{
          providerId: 'password',
          uid: email,
          displayName: email.split('@')[0],
          email: email,
        }],
      };

      this.currentUser = user;
      this.notifyListeners(user);
      
      return {
        success: true,
        user: user,
        token: user.token,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'auth/email-already-in-use',
      };
    }
  }

  // Sign in with Google (simulated)
  async signInWithGoogle() {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create mock Google user
      const user = {
        uid: `google_user_${Date.now()}`,
        email: 'user@gmail.com',
        displayName: 'Google User',
        photoURL: 'https://via.placeholder.com/150',
        emailVerified: true,
        isAnonymous: false,
        token: `google_token_${Date.now()}`,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        providerData: [{
          providerId: 'google.com',
          uid: 'google_user_123',
          displayName: 'Google User',
          email: 'user@gmail.com',
          photoURL: 'https://via.placeholder.com/150',
        }],
      };

      this.currentUser = user;
      this.notifyListeners(user);
      
      return {
        success: true,
        user: user,
        token: user.token,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'auth/popup-closed-by-user',
      };
    }
  }

  // Sign in anonymously
  async signInAnonymously() {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create mock anonymous user
      const user = {
        uid: `anon_${Date.now()}`,
        email: null,
        displayName: 'Guest User',
        photoURL: null,
        emailVerified: false,
        isAnonymous: true,
        token: `anon_token_${Date.now()}`,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        providerData: [],
      };

      this.currentUser = user;
      this.notifyListeners(user);
      
      return {
        success: true,
        user: user,
        token: user.token,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'auth/network-request-failed',
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.currentUser = null;
      this.notifyListeners(null);
      
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
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email format');
      }
      
      // Simulate sending email
      console.log(`Password reset email sent to: ${email}`);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'auth/invalid-email',
      };
    }
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update user data
      if (updates.displayName) {
        this.currentUser.displayName = updates.displayName;
      }
      if (updates.photoURL) {
        this.currentUser.photoURL = updates.photoURL;
      }
      
      this.notifyListeners(this.currentUser);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'auth/requires-recent-login',
      };
    }
  }

  // Update user email
  async updateEmail(newEmail) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!newEmail || !newEmail.includes('@')) {
        throw new Error('Invalid email format');
      }
      
      this.currentUser.email = newEmail;
      this.notifyListeners(this.currentUser);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'auth/invalid-email',
      };
    }
  }

  // Update user password
  async updatePassword(newPassword) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'auth/weak-password',
      };
    }
  }

  // Delete user account
  async deleteAccount() {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.currentUser = null;
      this.notifyListeners(null);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'auth/requires-recent-login',
      };
    }
  }

  // Link email/password account with Google
  async linkWithGoogle() {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add Google provider to existing user
      this.currentUser.providerData.push({
        providerId: 'google.com',
        uid: 'google_user_123',
        displayName: 'Google User',
        email: 'user@gmail.com',
        photoURL: 'https://via.placeholder.com/150',
      });
      
      this.notifyListeners(this.currentUser);
      
      return {
        success: true,
        user: this.currentUser,
        token: this.currentUser.token,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'auth/provider-already-linked',
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
const mockAuthService = new MockAuthService();

export default mockAuthService;
