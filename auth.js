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

  async loadUsers() {
  if (!this.isManager()) {
    console.log('Not a manager, skipping user load');
    return;
  }
  
  try {
    console.log('Loading users from Firebase...');
    
    // Get users collection from Firebase
    const usersSnapshot = await window.db.collection(window.COLLECTIONS.USERS).get();
    
    this.users = usersSnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        id: doc.id,
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'user',
        isManager: userData.isManager || userData.role === 'manager' || false,
        lastLogin: userData.lastLogin || null,
        createdAt: userData.createdAt || null,
        updatedAt: userData.updatedAt || null
      };
    });
    
    console.log(`Loaded ${this.users.length} users:`, this.users);

    } catch (error) {
    console.error('Error loading users:', error);
    showToast('Failed to load users', 'error');
    this.users = [];
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

  async updateUserRole(userId, makeManager) {
  try {
    if (typeof showLoading === 'function') showLoading();
    
    // Update in Firestore
    await window.db.collection(window.COLLECTIONS.USERS).doc(userId).update({
      isManager: makeManager,
      role: makeManager ? 'manager' : 'user',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Update in local cache
    if (this.users) {
      var userIndex = this.users.findIndex(function(u) { return u.id === userId; });
      if (userIndex !== -1) {
        this.users[userIndex].isManager = makeManager;
        this.users[userIndex].role = makeManager ? 'manager' : 'user';
      }
    }
    
    // If updating current user, update currentUser object
    if (this.currentUser && this.currentUser.uid === userId) {
      this.currentUser.isManager = makeManager;
      this.currentUser.role = makeManager ? 'manager' : 'user';
    }
    
    if (typeof showToast === 'function') {
      showToast(`User ${makeManager ? 'promoted to manager' : 'demoted to user'} successfully!`, 'success');
    }
    
    // Trigger re-render
    if (window.app && typeof window.app.render === 'function') {
      window.app.render();
    }
    
  } catch (error) {
    console.error('Error updating user role:', error);
    if (typeof showToast === 'function') {
      showToast('Failed to update user role', 'error');
    }
    throw error;
  } finally {
    if (typeof hideLoading === 'function') hideLoading();
  }
}
}

// Create global auth instance

window.authManager = new AuthManager();



