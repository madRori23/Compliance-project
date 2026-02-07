import { initRouter } from './router.js';
import { initAuth } from './auth.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Wait for Firebase to initialize
  const checkFirebase = setInterval(() => {
    if (window.firebase && window.db && window.auth) {
      clearInterval(checkFirebase);
      initAuth();
      initRouter();
    }
  }, 100);
  
  // Fallback in case Firebase doesn't initialize
  setTimeout(() => {
    if (!window.firebase) {
      console.warn('Firebase not initialized, using fallback');
      initAuth();
      initRouter();
    }
  }, 3000);
});
