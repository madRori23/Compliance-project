// scripts/auth.js
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.loading = true;
    this.users = [];
  }

  async init() {
    try {
      // Listen for auth state changes
      window.auth.onAuthStateChanged(async (user) => {
        if (user) {
          this.currentUser = user;
          this.isAuthenticated = true;
          
          // Get additional user data from Firestore
          await this.fetchUserData(user.uid);
        } else {
          this.currentUser = null;
          this.isAuthenticated = false;
        }
        this.loading = false;
        
        // Trigger render
        if (window.app) {
          window.app.render();
        }
      });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.loading = false;
    }
  }

  async fetchUserData(userId) {
    try {
      const userDoc = await window.db.collection(window.COLLECTIONS.USERS).doc(userId).get();
      if (userDoc.exists) {
        this.currentUserData = userDoc.data();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  async login(email, password) {
    try {
      showLoading();
      const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
      
      // Update last login
      await window.db.collection(window.COLLECTIONS.USERS).doc(userCredential.user.uid).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      showToast('Login successful!', 'success');
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      let message = 'Invalid email or password';
      
      if (error.code === 'auth/user-not-found') {
        message = 'No user found with this email';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later';
      }
      
      showToast(message, 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  async register(name, email, password) {
    try {
      showLoading();
      
      // Create user in Firebase Auth
      const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
      
      // Create user document in Firestore
      const userData = {
        uid: userCredential.user.uid,
        email: email,
        name: name,
        isManager: false,
        role: 'user',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await window.db.collection(window.COLLECTIONS.USERS).doc(userCredential.user.uid).set(userData);
      
      showToast('Account created successfully!', 'success');
      return userCredential.user;
    } catch (error) {
      console.error('Registration error:', error);
      let message = 'Registration failed';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email already in use';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      }
      
      showToast(message, 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  async logout() {
    try {
      await window.auth.signOut();
      showToast('Logged out successfully', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Logout failed', 'error');
    }
  }

  isManager() {
    return this.currentUserData?.isManager || this.currentUserData?.role === 'manager' || this.currentUserData?.role === 'admin';
  }
}

// Create global auth instance

window.authManager = new AuthManager();
