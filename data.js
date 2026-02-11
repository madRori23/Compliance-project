// scripts/data.js
class DataManager {
  constructor() {
    this.tests = [];
    this.warnings = [];
    this.users = [];
    this.settings = {};
  }

  async loadInitialData() {
    try {
      showLoading();
      
      // Load tests
      const testsSnapshot = await window.db.collection(window.COLLECTIONS.TESTS)
        .orderBy('date', 'desc')
        .get();
      
      this.tests = testsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Load warnings
      const warningsSnapshot = await window.db.collection(window.COLLECTIONS.WARNINGS)
        .orderBy('date', 'desc')
        .get();
      
      this.warnings = warningsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Load users (only for managers)
      if (window.authManager.isManager()) {
        const usersSnapshot = await window.db.collection(window.COLLECTIONS.USERS).get();
        this.users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      hideLoading();
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
      hideLoading();
    }
  }

  async addTest(testData) {
    try {
      showLoading();
      
      const testWithMeta = {
        ...testData,
        userId: window.authManager.currentUser.uid,
        createdBy: window.authManager.currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await window.db.collection(window.COLLECTIONS.TESTS).add(testWithMeta);
      
      this.tests.unshift({
        id: docRef.id,
        ...testWithMeta
      });

      showToast('Test record added successfully!', 'success');
      return docRef.id;
    } catch (error) {
      console.error('Error adding test:', error);
      showToast('Failed to add test record', 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  async updateTest(testId, testData) {
    try {
      showLoading();
      
      const updateData = {
        ...testData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await window.db.collection(window.COLLECTIONS.TESTS).doc(testId).update(updateData);
      
      // Update local data
      const index = this.tests.findIndex(t => t.id === testId);
      if (index !== -1) {
        this.tests[index] = { ...this.tests[index], ...updateData };
      }

      showToast('Test record updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating test:', error);
      showToast('Failed to update test record', 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  async deleteTest(testId) {
    try {
      showLoading();
      
      await window.db.collection(window.COLLECTIONS.TESTS).doc(testId).delete();
      
      // Remove from local data
      this.tests = this.tests.filter(t => t.id !== testId);
      
      showToast('Test record deleted', 'success');
    } catch (error) {
      console.error('Error deleting test:', error);
      showToast('Failed to delete test record', 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  async addWarning(warningData) {
    try {
      showLoading();
      
      const warningWithMeta = {
        ...warningData,
        userId: window.authManager.currentUser.uid,
        createdBy: window.authManager.currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await window.db.collection(window.COLLECTIONS.WARNINGS).add(warningWithMeta);
      
      this.warnings.unshift({
        id: docRef.id,
        ...warningWithMeta
      });

      showToast('Warning record added successfully!', 'success');
      return docRef.id;
    } catch (error) {
      console.error('Error adding warning:', error);
      showToast('Failed to add warning record', 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  async updateWarning(warningId, warningData) {
    try {
      showLoading();
      
      const updateData = {
        ...warningData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await window.db.collection(window.COLLECTIONS.WARNINGS).doc(warningId).update(updateData);
      
      // Update local data
      const index = this.warnings.findIndex(w => w.id === warningId);
      if (index !== -1) {
        this.warnings[index] = { ...this.warnings[index], ...updateData };
      }

      showToast('Warning record updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating warning:', error);
      showToast('Failed to update warning record', 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  async deleteWarning(warningId) {
    try {
      showLoading();
      
      await window.db.collection(window.COLLECTIONS.WARNINGS).doc(warningId).delete();
      
      // Remove from local data
      this.warnings = this.warnings.filter(w => w.id !== warningId);
      
      showToast('Warning record deleted', 'success');
    } catch (error) {
      console.error('Error deleting warning:', error);
      showToast('Failed to delete warning record', 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  async updateUserRole(userId, isManager) {
    try {
      showLoading();
      
      await window.db.collection(window.COLLECTIONS.USERS).doc(userId).update({
        isManager: isManager,
        role: isManager ? 'manager' : 'user',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update local data
      const index = this.users.findIndex(u => u.id === userId);
      if (index !== -1) {
        this.users[index].isManager = isManager;
        this.users[index].role = isManager ? 'manager' : 'user';
      }

      showToast(`User ${isManager ? 'promoted to manager' : 'demoted to user'}`, 'success');
    } catch (error) {
      console.error('Error updating user role:', error);
      showToast('Failed to update user role', 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  getFilteredTests(startDate, endDate, network) {
    let filtered = this.tests;
    
    if (startDate) {
      filtered = filtered.filter(t => t.date >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(t => t.date <= endDate);
    }
    
    if (network) {
      filtered = filtered.filter(t => t.network === network);
    }
    
    return filtered;
  }

  getFilteredWarnings(startDate, endDate) {
    let filtered = this.warnings;
    
    if (startDate) {
      filtered = filtered.filter(w => w.date >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(w => w.date <= endDate);
    }
    
    return filtered;
  }

  getTestsToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.tests.filter(t => t.date === today);
  }

  getWarningsToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.warnings.filter(w => w.date === today);
  }

  getActiveDays() {
    const dates = new Set(this.tests.map(t => t.date));
    return dates.size;
  }

     getActiveUsersToday() {
    const today = new Date().toISOString().split('T')[0];
    
    // Create a set to track unique active users
    const activeUsers = new Set();
    
    // Check tests created today
    const todayTests = this.tests.filter(test => test.date === today);
    todayTests.forEach(test => {
      if (test.createdBy) {
        activeUsers.add(test.createdBy);
      } else if (test.userId) {
        activeUsers.add(test.userId);
      }
    });
    
    // Check warnings created today
    const todayWarnings = this.warnings.filter(warning => warning.date === today);
    todayWarnings.forEach(warning => {
      if (warning.createdBy) {
        activeUsers.add(warning.createdBy);
      } else if (warning.userId) {
        activeUsers.add(warning.userId);
      }
    });
    
    // If no specific user data, check recipients in warnings
    if (activeUsers.size === 0) {
      todayWarnings.forEach(warning => {
        if (warning.recipient) {
          activeUsers.add(warning.recipient);
        }
      });
    }
    
    return Array.from(activeUsers);
  }

  // Export functions
  exportToExcel(data, filename) {
  if (data.length === 0) {
    showToast('No data to export', 'error');
    return;
  }

  // Create worksheet data
  const worksheetData = [
    Object.keys(data[0]), // Headers
    ...data.map(row => Object.values(row).map(value => {
      if (value === null || value === undefined) return '';
      if (value instanceof Date) return value.toLocaleDateString();
      if (typeof value === 'object') return JSON.stringify(value);
      return value;
    }))
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Style the header row (optional)
  ws['!cols'] = Object.keys(data[0]).map(() => ({ wch: 20 })); // Set column width
  
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const excelBlob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  // Download file
  const url = URL.createObjectURL(excelBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('Export completed!', 'success');
}
// Create global data manager instance

window.dataManager = new DataManager();




