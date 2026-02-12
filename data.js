class DataManager {
  constructor() {
    this.tests = [];
    this.warnings = [];
    this.listeners = [];
    this.unsubscribeTests = null;
    this.unsubscribeWarnings = null;
  }

  async init() {
    try {
      // Set up real-time listeners
      await this.setupTestsListener();
      await this.setupWarningsListener();
      console.log('✅ DataManager initialized with real-time listeners');
    } catch (error) {
      console.error('❌ DataManager initialization failed:', error);
    }
  }

  setupTestsListener() {
    if (this.unsubscribeTests) {
      this.unsubscribeTests();
    }

    const userId = authManager.currentUser?.uid;
    if (!userId) return;

    let query = window.db.collection(window.COLLECTIONS.TESTS)
      .orderBy('date', 'desc')
      

    // Non-managers can only see their own tests
    if (!authManager.isManager()) {
      query = query.where('userId', '==', userId);
    }

    this.unsubscribeTests = query.onSnapshot(
      (snapshot) => {
        this.tests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        this.notifyListeners();
      },
      (error) => {
        console.error('Tests listener error:', error);
        showToast('Failed to load tests', 'error');
      }
    );
  }

  setupWarningsListener() {
    if (this.unsubscribeWarnings) {
      this.unsubscribeWarnings();
    }

    const userId = authManager.currentUser?.uid;
    if (!userId) return;

    let query = window.db.collection(window.COLLECTIONS.WARNINGS)
      .orderBy('date', 'desc')
      

    // Non-managers can only see their own warnings
    if (!authManager.isManager()) {
      query = query.where('userId', '==', userId);
    }

    this.unsubscribeWarnings = query.onSnapshot(
      (snapshot) => {
        this.warnings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        this.notifyListeners();
      },
      (error) => {
        console.error('Warnings listener error:', error);
        showToast('Failed to load warnings', 'error');
      }
    );
  }

  // ============ CRUD OPERATIONS - TESTS ============

  async addTest(testData) {
    try {
      showLoading();
      
      const newTest = {
        ...testData,
        userId: authManager.currentUser.uid,
        createdBy: authManager.currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await window.db.collection(window.COLLECTIONS.TESTS).add(newTest);
      
      showToast('Test recorded successfully!', 'success');
      return docRef.id;
    } catch (error) {
      console.error('Error adding test:', error);
      showToast('Failed to record test', 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  async updateTest(testId, testData) {
    try {
      showLoading();
      
      await window.db.collection(window.COLLECTIONS.TESTS).doc(testId).update({
        ...testData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      showToast('Test updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating test:', error);
      showToast('Failed to update test', 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  async deleteTest(testId) {
    try {
      showLoading();
      
      await window.db.collection(window.COLLECTIONS.TESTS).doc(testId).delete();
      
      showToast('Test deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting test:', error);
      showToast('Failed to delete test', 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  // ============ CRUD OPERATIONS - WARNINGS ============

  async addWarning(warningData) {
    try {
      showLoading();
      
      const newWarning = {
        ...warningData,
        userId: authManager.currentUser.uid,
        createdBy: authManager.currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await window.db.collection(window.COLLECTIONS.WARNINGS).add(newWarning);
      
      showToast('Warning recorded successfully!', 'success');
      return docRef.id;
    } catch (error) {
      console.error('Error adding warning:', error);
      showToast('Failed to record warning', 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  async updateWarning(warningId, warningData) {
    try {
      showLoading();
      
      await window.db.collection(window.COLLECTIONS.WARNINGS).doc(warningId).update({
        ...warningData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      showToast('Warning updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating warning:', error);
      showToast('Failed to update warning', 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  async deleteWarning(warningId) {
    try {
      showLoading();
      
      await window.db.collection(window.COLLECTIONS.WARNINGS).doc(warningId).delete();
      
      showToast('Warning deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting warning:', error);
      showToast('Failed to delete warning', 'error');
      throw error;
    } finally {
      hideLoading();
    }
  }

  // ============ UTILITY FUNCTIONS ============

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  getTests() {
    return this.tests;
  }

  getWarnings() {
    return this.warnings;
  }

  cleanup() {
    if (this.unsubscribeTests) {
      this.unsubscribeTests();
    }
    if (this.unsubscribeWarnings) {
      this.unsubscribeWarnings();
    }
  }


// ============ EXPORT FUNCTIONS ============
formatTestsForExport(tests) {
  return tests.map(test => ({
    'Date': test.date || '',
    'Type': test.type || '',
    'Network': test.network || '',
    'Description': (test.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    'Result': test.result || '',
    'File Link': test.fileLink || '',
    'Created By': test.createdBy || '',
    'Created At': test.createdAt ? this.formatTimestamp(test.createdAt) : ''
  }));
}

formatWarningsForExport(warnings) {
  return warnings.map(warning => ({
    'Date': warning.date || '',
    'Warning Type': warning.type || '',
    'Recipient': warning.recipient || '',
    'Reference': warning.reference || '',
    'Details': (warning.details || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    'Problem Areas': (warning.problemAreas || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    'Created By': warning.createdBy || '',
    'Created At': warning.createdAt ? this.formatTimestamp(warning.createdAt) : ''
  }));
}

createSummaryData(tests, warnings) {
  // Calculate summary statistics
  const totalTests = tests.length;
  const totalWarnings = warnings.length;
  const completeTests = tests.filter(t => t.type === 'Complete' || t.result === 'Complete' || t.result === 'Compliant').length;
  const partialTests = tests.filter(t => t.type === 'Partial' || t.result === 'Partial').length;
  const nonCompliantTests = tests.filter(t => t.result === 'Non-compliant' || t.result === 'Failed').length;
  
  // Get unique users
  const uniqueUsers = new Set();
  tests.forEach(t => { if (t.userId) uniqueUsers.add(t.userId); });
  warnings.forEach(w => { if (w.userId) uniqueUsers.add(w.userId); });
  
  // Date range
  const allDates = [...tests.map(t => t.date), ...warnings.map(w => w.date)].filter(d => d);
  const earliestDate = allDates.length ? allDates.sort()[0] : 'N/A';
  const latestDate = allDates.length ? allDates.sort()[allDates.length - 1] : 'N/A';
  
  return [
    { 'Metric': 'Report Generated', 'Value': new Date().toLocaleString() },
    { 'Metric': 'Total Tests', 'Value': totalTests },
    { 'Metric': 'Total Warnings', 'Value': totalWarnings },
    { 'Metric': 'Complete Tests', 'Value': completeTests },
    { 'Metric': 'Partial Tests', 'Value': partialTests },
    { 'Metric': 'Non-Compliant Tests', 'Value': nonCompliantTests },
    { 'Metric': 'Unique Users', 'Value': uniqueUsers.size },
    { 'Metric': 'Date Range', 'Value': `${earliestDate} to ${latestDate}` },
    { 'Metric': '', 'Value': '' },
    { 'Metric': 'NETWORK BREAKDOWN', 'Value': '' },
    ...this.getNetworkBreakdown(tests),
    { 'Metric': '', 'Value': '' },
    { 'Metric': 'WARNING TYPES', 'Value': '' },
    ...this.getWarningTypeBreakdown(warnings)
  ];
}

getNetworkBreakdown(tests) {
  const networks = {};
  tests.forEach(test => {
    const network = test.network || 'Unknown';
    networks[network] = (networks[network] || 0) + 1;
  });
  
  return Object.entries(networks).map(([network, count]) => ({
    'Metric': `  ${network}`,
    'Value': count
  }));
}

getWarningTypeBreakdown(warnings) {
  const types = {};
  warnings.forEach(warning => {
    const type = warning.type || 'Unknown';
    types[type] = (types[type] || 0) + 1;
  });
  
  return Object.entries(types).map(([type, count]) => ({
    'Metric': `  ${type}`,
    'Value': count
  }));
}

formatTimestamp(timestamp) {
  if (!timestamp) return '';
  
  // Handle Firestore timestamp
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000).toLocaleString();
  }
  
  // Handle Date object
  if (timestamp instanceof Date) {
    return timestamp.toLocaleString();
  }
  
  // Handle string date
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString();
    }
    return timestamp;
  }
  
  return String(timestamp);
}

getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// UI feedback methods
showExportSuccess(message) {
  showToast(message, 'success');
}

showExportError(message) {
  showToast(message, 'error');
}

recordExport() {
  // Log export activity or update metrics
  console.log(`Export completed at ${new Date().toISOString()}`);
}

async exportTests() {
  try {
    showLoading();
    
    const tests = dataManager.getTests();
    
    if (tests.length === 0) {
      this.showExportError('No test records found to export.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(this.formatTestsForExport(tests));
    const workbook = XLSX.utils.book_new();
    
    // Set column widths - updated to include file link column
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 15 }, // Type
      { wch: 10 }, // Network
      { wch: 40 }, // Description
      { wch: 15 }, // Result
      { wch: 50 }, // File Link
      { wch: 20 }, // Created By
      { wch: 20 }  // Created At
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Tests");
    XLSX.writeFile(workbook, `WASPA_Tests_${this.getCurrentDate()}.xlsx`);
    
    this.recordExport();
    this.showExportSuccess(`${tests.length} test records exported successfully!`);
  } catch (error) {
    console.error('Error exporting tests:', error);
    this.showExportError('Failed to export tests. Please try again.');
  } finally {
    hideLoading();
  }
}

async exportWarnings() {
  try {
    showLoading();
    
    const warnings = dataManager.getWarnings();
    
    if (warnings.length === 0) {
      this.showExportError('No warning records found to export.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(this.formatWarningsForExport(warnings));
    const workbook = XLSX.utils.book_new();
    
    // Set column widths for warnings
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 20 }, // Warning Type
      { wch: 30 }, // Recipient
      { wch: 15 }, // Reference
      { wch: 50 }, // Details
      { wch: 50 }, // Problem Areas
      { wch: 20 }, // Created By
      { wch: 20 }  // Created At
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Warnings");
    XLSX.writeFile(workbook, `WASPA_Warnings_${this.getCurrentDate()}.xlsx`);
    
    this.recordExport();
    this.showExportSuccess(`${warnings.length} warning records exported successfully!`);
  } catch (error) {
    console.error('Error exporting warnings:', error);
    this.showExportError('Failed to export warnings. Please try again.');
  } finally {
    hideLoading();
  }
}

async exportAllData() {
  try {
    showLoading();
    
    const tests = dataManager.getTests();
    const warnings = dataManager.getWarnings();

    if (tests.length === 0 && warnings.length === 0) {
      this.showExportError('No data found to export.');
      return;
    }

    const workbook = XLSX.utils.book_new();
    
    // Tests sheet
    if (tests.length > 0) {
      const testsWorksheet = XLSX.utils.json_to_sheet(this.formatTestsForExport(tests));
      testsWorksheet['!cols'] = [
        { wch: 12 }, { wch: 15 }, { wch: 10 }, 
        { wch: 40 }, { wch: 15 }, { wch: 50 },
        { wch: 20 }, { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(workbook, testsWorksheet, "Tests");
    }
    
    // Warnings sheet
    if (warnings.length > 0) {
      const warningsWorksheet = XLSX.utils.json_to_sheet(this.formatWarningsForExport(warnings));
      warningsWorksheet['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 30 }, 
        { wch: 15 }, { wch: 50 }, { wch: 50 }, 
        { wch: 20 }, { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(workbook, warningsWorksheet, "Warnings");
    }
    
    // Summary sheet
    const summaryData = this.createSummaryData(tests, warnings);
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [
      { wch: 25 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");

    XLSX.writeFile(workbook, `WASPA_Complete_Report_${this.getCurrentDate()}.xlsx`);
    
    this.recordExport();
    this.showExportSuccess('Complete report exported successfully!');
  } catch (error) {
    console.error('Error exporting all data:', error);
    this.showExportError('Failed to export data. Please try again.');
  } finally {
    hideLoading();
  }


// Initialize global instance
let dataManager;

try {
    dataManager = new DataManager();
    window.dataManager = dataManager;
    console.log('✅ DataManager instance created');
} catch (error) {
    console.error('❌ DataManager creation failed:', error);
}
  

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (window.authManager && window.authManager.isAuthenticated) {
    window.dataManager.init();
  }
});

