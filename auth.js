// Authentication module using Firebase
let currentUser = null;

export async function getCurrentUser() {
  if (window.auth && window.auth.currentUser) {
    // Get additional user data from Firestore
    const userDoc = await window.db.collection(window.COLLECTIONS.USERS)
      .doc(window.auth.currentUser.uid)
      .get();
    
    if (userDoc.exists) {
      currentUser = {
        ...window.auth.currentUser,
        ...userDoc.data()
      };
    } else {
      currentUser = window.auth.currentUser;
    }
    return currentUser;
  }
  return null;
}

export function isAuthenticated() {
  return window.auth && window.auth.currentUser !== null;
}

export async function login(email, password) {
  try {
    showLoading();
    const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
    
    // Get user data from Firestore
    const userDoc = await window.db.collection(window.COLLECTIONS.USERS)
      .doc(userCredential.user.uid)
      .get();
    
    let userData = {};
    if (userDoc.exists) {
      userData = userDoc.data();
    }
    
    // Update last login
    await window.db.collection(window.COLLECTIONS.USERS)
      .doc(userCredential.user.uid)
      .set({
        ...userData,
        lastLogin: new Date().toISOString(),
        email: userCredential.user.email
      }, { merge: true });
    
    currentUser = {
      ...userCredential.user,
      ...userData
    };
    
    hideLoading();
    return { success: true, user: currentUser };
  } catch (error) {
    hideLoading();
    console.error('Login error:', error);
    return { 
      success: false, 
      error: getFirebaseAuthError(error.code) 
    };
  }
}

export async function register(name, email, password) {
  try {
    showLoading();
    
    // Create user in Firebase Auth
    const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
    
    // Create user document in Firestore
    const userData = {
      uid: userCredential.user.uid,
      email: email,
      name: name,
      role: "user",
      isManager: false,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    
    await window.db.collection(window.COLLECTIONS.USERS)
      .doc(userCredential.user.uid)
      .set(userData);
    
    currentUser = {
      ...userCredential.user,
      ...userData
    };
    
    hideLoading();
    return { success: true, user: currentUser };
  } catch (error) {
    hideLoading();
    console.error('Registration error:', error);
    return { 
      success: false, 
      error: getFirebaseAuthError(error.code) 
    };
  }
}

export async function logout() {
  try {
    await window.auth.signOut();
    currentUser = null;
    window.location.hash = '#/login';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export function initAuth() {
  // Listen for auth state changes
  if (window.auth) {
    window.auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await window.db.collection(window.COLLECTIONS.USERS)
          .doc(user.uid)
          .get();
        
        if (userDoc.exists) {
          currentUser = {
            ...user,
            ...userDoc.data()
          };
        }
        
        // If on login page and authenticated, redirect to dashboard
        if (window.location.hash === '#/login') {
          window.location.hash = '#/dashboard';
        }
      } else {
        currentUser = null;
        // If not on login page and not authenticated, redirect to login
        if (window.location.hash !== '#/login') {
          window.location.hash = '#/login';
        }
      }
    });
  }
}

// Helper function to translate Firebase auth error codes
function getFirebaseAuthError(code) {
  const errors = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'This email is already registered',
    'auth/weak-password': 'Password is too weak',
    'auth/operation-not-allowed': 'Operation not allowed',
    'auth/too-many-requests': 'Too many attempts. Please try again later'
  };
  return errors[code] || 'Authentication failed. Please try again.';
}

// Add loading functions if they don't exist in window
window.showLoading = window.showLoading || function() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) spinner.style.display = 'flex';
};

window.hideLoading = window.hideLoading || function() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) spinner.style.display = 'none';
};