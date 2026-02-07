// Data management module using Firebase Firestore
export async function addTest(testData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };
    
    const testRef = window.db.collection(window.COLLECTIONS.TESTS).doc();
    const newTest = {
      ...testData,
      id: testRef.id,
      userId: user.uid,
      createdBy: user.email,
      createdAt: new Date().toISOString(),
    };
    
    await testRef.set(newTest);
    return { success: true, test: newTest };
  } catch (error) {
    console.error('Add test error:', error);
    return { success: false, error: "Failed to add test" };
  }
}

export async function updateTest(id, data) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };
    
    const testRef = window.db.collection(window.COLLECTIONS.TESTS).doc(id);
    const testDoc = await testRef.get();
    
    if (!testDoc.exists) {
      return { success: false, error: "Test not found" };
    }
    
    const testData = testDoc.data();
    if (testData.userId !== user.uid && user.role !== 'admin' && !user.isManager) {
      return { success: false, error: "Not authorized" };
    }
    
    await testRef.update(data);
    return { success: true };
  } catch (error) {
    console.error('Update test error:', error);
    return { success: false, error: "Failed to update test" };
  }
}

export async function deleteTest(id) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };
    
    const testRef = window.db.collection(window.COLLECTIONS.TESTS).doc(id);
    const testDoc = await testRef.get();
    
    if (!testDoc.exists) {
      return { success: false, error: "Test not found" };
    }
    
    const testData = testDoc.data();
    if (testData.userId !== user.uid && user.role !== 'admin') {
      return { success: false, error: "Not authorized" };
    }
    
    await testRef.delete();
    return { success: true };
  } catch (error) {
    console.error('Delete test error:', error);
    return { success: false, error: "Failed to delete test" };
  }
}

export async function addWarning(warningData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };
    
    const warningRef = window.db.collection(window.COLLECTIONS.WARNINGS).doc();
    const newWarning = {
      ...warningData,
      id: warningRef.id,
      userId: user.uid,
      createdBy: user.email,
      createdAt: new Date().toISOString(),
    };
    
    await warningRef.set(newWarning);
    return { success: true, warning: newWarning };
  } catch (error) {
    console.error('Add warning error:', error);
    return { success: false, error: "Failed to add warning" };
  }
}

export async function updateWarning(id, data) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };
    
    const warningRef = window.db.collection(window.COLLECTIONS.WARNINGS).doc(id);
    const warningDoc = await warningRef.get();
    
    if (!warningDoc.exists) {
      return { success: false, error: "Warning not found" };
    }
    
    const warningData = warningDoc.data();
    if (warningData.userId !== user.uid && user.role !== 'admin' && !user.isManager) {
      return { success: false, error: "Not authorized" };
    }
    
    await warningRef.update(data);
    return { success: true };
  } catch (error) {
    console.error('Update warning error:', error);
    return { success: false, error: "Failed to update warning" };
  }
}

export async function deleteWarning(id) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };
    
    const warningRef = window.db.collection(window.COLLECTIONS.WARNINGS).doc(id);
    const warningDoc = await warningRef.get();
    
    if (!warningDoc.exists) {
      return { success: false, error: "Warning not found" };
    }
    
    const warningData = warningDoc.data();
    if (warningData.userId !== user.uid && user.role !== 'admin') {
      return { success: false, error: "Not authorized" };
    }
    
    await warningRef.delete();
    return { success: true };
  } catch (error) {
    console.error('Delete warning error:', error);
    return { success: false, error: "Failed to delete warning" };
  }
}

export async function getUserTests() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    
    const snapshot = await window.db.collection(window.COLLECTIONS.TESTS)
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get user tests error:', error);
    return [];
  }
}

export async function getUserWarnings() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    
    const snapshot = await window.db.collection(window.COLLECTIONS.WARNINGS)
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get user warnings error:', error);
    return [];
  }
}

export async function getAllTests() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    
    // Only admins and managers can see all tests
    if (user.role !== 'admin' && !user.isManager) {
      return getUserTests();
    }
    
    const snapshot = await window.db.collection(window.COLLECTIONS.TESTS)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get all tests error:', error);
    return [];
  }
}

export async function getAllWarnings() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    
    // Only admins and managers can see all warnings
    if (user.role !== 'admin' && !user.isManager) {
      return getUserWarnings();
    }
    
    const snapshot = await window.db.collection(window.COLLECTIONS.WARNINGS)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get all warnings error:', error);
    return [];
  }
}

export async function getAllUsers() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return [];
    
    const snapshot = await window.db.collection(window.COLLECTIONS.USERS)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get all users error:', error);
    return [];
  }
}

export async function setUserAsManager(userId, isManager) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: "Not authorized" };
    }
    
    await window.db.collection(window.COLLECTIONS.USERS)
      .doc(userId)
      .update({
        isManager: isManager,
        role: isManager ? "manager" : "user"
      });
    
    return { success: true };
  } catch (error) {
    console.error('Set user as manager error:', error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function getUserByEmail(email) {
  try {
    const snapshot = await window.db.collection(window.COLLECTIONS.USERS)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Get user by email error:', error);
    return null;
  }
}

// Legacy functions for compatibility
export async function clearUserTests() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };
    
    const snapshot = await window.db.collection(window.COLLECTIONS.TESTS)
      .where('userId', '==', user.uid)
      .get();
    
    const batch = window.db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Clear user tests error:', error);
    return { success: false, error: "Failed to clear tests" };
  }
}

export async function clearUserWarnings() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };
    
    const snapshot = await window.db.collection(window.COLLECTIONS.WARNINGS)
      .where('userId', '==', user.uid)
      .get();
    
    const batch = window.db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Clear user warnings error:', error);
    return { success: false, error: "Failed to clear warnings" };
  }
}

// Helper function to get current user
async function getCurrentUser() {
  if (window.auth && window.auth.currentUser) {
    // Get additional user data from Firestore
    const userDoc = await window.db.collection(window.COLLECTIONS.USERS)
      .doc(window.auth.currentUser.uid)
      .get();
    
    if (userDoc.exists) {
      return {
        ...window.auth.currentUser,
        ...userDoc.data()
      };
    }
    return window.auth.currentUser;
  }
  return null;
}
