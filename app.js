// scripts/app.js
class WASPAApp {
  constructor() {
    this.currentState = {
      dashboardView: 'user',
      userTab: 'tests',
      managerTab: 'overview',
      showRegisterForm: false,
      editingTest: null,
      editingWarning: null
    };

    renderManagerOverview() {
    return `
      <div class="card animate-fade-in">
        <div class="card-header">
          <h2>Manager Overview</h2>
        </div>
        <div class="p-4">
          <p>Manager overview content will go here.</p>
          <p>This would include team stats, recent activity, etc.</p>
          <div class="mt-4 p-3 bg-secondary rounded">
            <h3 class="text-lg font-bold mb-2">Quick Stats:</h3>
            <ul class="space-y-1">
              <li>Total Users: ${authManager.users ? authManager.users.length : 'Loading...'}</li>
              <li>Total Tests: ${dataManager.tests.length}</li>
              <li>Total Warnings: ${dataManager.warnings.length}</li>
              <li>Active Today: ${dataManager.getActiveUsersToday().length}</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  renderManagerExportTab() {
    return `
      <div class="card animate-fade-in">
        <div class="card-header">
          <h2>Export Manager Reports</h2>
        </div>
        <div class="p-4">
          <p>Export comprehensive reports for management.</p>
          <div class="space-y-3 mt-4">
            <button class="btn btn-primary w-full">Export All Test Data (CSV)</button>
            <button class="btn btn-primary w-full">Export Warning Reports (PDF)</button>
            <button class="btn btn-primary w-full">Export User Activity Logs</button>
            <button class="btn btn-primary w-full">Generate Monthly Summary</button>
          </div>
        </div>
      </div>
    `;
  }

  renderAdminTab() {
    return `
      <div class="card animate-fade-in">
        <div class="card-header">
          <h2>Admin Controls</h2>
        </div>
        <div class="p-4">
          <p>Administrative functions for managing the system.</p>
          <div class="space-y-3 mt-4">
            <button class="btn btn-destructive w-full">Reset All Test Data</button>
            <button class="btn btn-destructive w-full">Clear All Warnings</button>
            <button class="btn btn-secondary w-full">Manage User Permissions</button>
            <button class="btn btn-secondary w-full">System Settings</button>
          </div>
        </div>
      </div>
    `;
  }

  renderUserStatsTab() {
    return `
      <div class="card animate-fade-in">
        <div class="card-header">
          <h2>User Statistics</h2>
        </div>
        <div class="p-4">
          <p>Detailed statistics and analytics for users.</p>
          <div class="mt-4 grid grid-cols-2 gap-4">
            <div class="p-3 bg-secondary rounded">
              <h3 class="font-bold">Performance</h3>
              <p class="text-2xl mt-2">85%</p>
            </div>
            <div class="p-3 bg-secondary rounded">
              <h3 class="font-bold">Completion Rate</h3>
              <p class="text-2xl mt-2">92%</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  }


  async init() {
    try {
      // Initialize Firebase connection
      await testFirebaseConnection();
      
      // Initialize auth manager
      await authManager.init();
      
      // Listen for auth changes and render
      this.render();
      
      // Set up global event handlers
      this.setupGlobalEventListeners();
      
      console.log('✅ WASPA App initialized');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      this.renderLogin();
    }
  }

  setupGlobalEventListeners() {
    // Delegate click events
    document.addEventListener('click', async (e) => {
      // Tab navigation
      if (e.target.classList.contains('user-tab')) {
        this.currentState.userTab = e.target.dataset.tab;
        this.render();
      }
      
      if (e.target.classList.contains('manager-tab')) {
        this.currentState.managerTab = e.target.dataset.tab;
        this.render();
      }
      
      // View switching
      if (e.target.id === 'switch-to-user') {
        this.currentState.dashboardView = 'user';
        this.currentState.userTab = 'tests';
        this.render();
      }
      
      if (e.target.id === 'switch-to-manager') {
        this.currentState.dashboardView = 'manager';
        this.currentState.managerTab = 'overview';
        this.render();
      }
      
      // Logout
      if (e.target.id === 'logout-btn') {
        await authManager.logout();
        this.currentState.showRegisterForm = false;
        this.renderLogin();
      }
      
      // Register/Login toggle
      if (e.target.id === 'show-register') {
        this.currentState.showRegisterForm = true;
        this.renderLogin();
      }
      
      if (e.target.id === 'show-login') {
        this.currentState.showRegisterForm = false;
        this.renderLogin();
      }
      
      // Clear buttons
      if (e.target.id === 'clear-tests') {
        if (confirm('Are you sure you want to clear all test records?')) {
          // In a real app, you would delete from Firebase
          showToast('This feature requires Firebase integration', 'warning');
        }
      }
      
      if (e.target.id === 'clear-warnings') {
        if (confirm('Are you sure you want to clear all warning records?')) {
          // In a real app, you would delete from Firebase
          showToast('This feature requires Firebase integration', 'warning');
        }
      }
    });
    
    // Form submissions
    document.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (e.target.id === 'login-form') {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
          await authManager.login(email, password);
          // Auth state change will trigger re-render
        } catch (error) {
          // Error handled in authManager
        }
      }
      
      if (e.target.id === 'register-form') {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;
        
        if (password !== confirm) {
          showToast('Passwords do not match', 'error');
          return;
        }
        
        try {
          await authManager.register(name, email, password);
          // Auth state change will trigger re-render
        } catch (error) {
          // Error handled in authManager
        }
      }
      
      if (e.target.id === 'test-form') {
        const testData = {
          date: document.getElementById('test-date').value,
          type: document.getElementById('test-type').value,
          network: document.getElementById('test-network').value,
          description: document.getElementById('test-description').value,
          result: document.getElementById('test-result').value,
          fileLink: document.getElementById('test-fileLink').value || ''
        };
        
        // Validate
        if (!testData.date || !testData.type || !testData.network || !testData.description || !testData.result) {
          showToast('Please fill in all required fields', 'error');
          return;
        }
        
        try {
          await dataManager.addTest(testData);
          this.render();
        } catch (error) {
          // Error handled in dataManager
        }
      }
      
      if (e.target.id === 'warning-form') {
        const warningData = {
          date: document.getElementById('warning-date').value,
          type: document.getElementById('warning-type').value,
          recipient: document.getElementById('warning-recipient').value,
          reference: document.getElementById('warning-reference').value,
          details: document.getElementById('warning-details').value,
          problemAreas: document.getElementById('warning-problemAreas').value
        };
        
        // Validate
        if (!warningData.date || !warningData.type || !warningData.recipient || 
            !warningData.reference || !warningData.details || !warningData.problemAreas) {
          showToast('Please fill in all fields', 'error');
          return;
        }
        
        if (!warningData.reference.match(/^WA\d{4,}$/)) {
          showToast('Reference must be in format WAxxxx (e.g., WA1234)', 'error');
          return;
        }
        
        try {
          await dataManager.addWarning(warningData);
          this.render();
        } catch (error) {
          // Error handled in dataManager
        }
      }
    });
  }

  render() {
    if (authManager.loading) {
      this.renderLoading();
      return;
    }
    
    if (!authManager.isAuthenticated) {
      this.renderLogin();
      return;
    }
    
    const app = document.getElementById('app');
    app.innerHTML = this.renderDashboard();
    
    // Load data if needed
    if (dataManager.tests.length === 0) {
      dataManager.loadInitialData();
    }
    
    // Attach form listeners for dynamic content
    this.attachFormListeners();
  }

  renderLoading() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="spinner mx-auto mb-4"></div>
          <p class="text-muted-foreground">Loading...</p>
        </div>
      </div>
    `;
  }

  renderLogin() {
    const app = document.getElementById('app');
    
    if (this.currentState.showRegisterForm) {
      app.innerHTML = this.renderRegisterForm();
    } else {
      app.innerHTML = this.renderLoginForm();
    }
  }

  renderLoginForm() {
    return `
      <div class="auth-container">
        <div class="auth-card animate-fade-in">
          <div class="auth-header">
            <h1 class="auth-title">WASPA</h1>
            <p class="auth-subtitle">Employee System</p>
          </div>
          
          <form id="login-form" class="auth-form">
            <div>
              <label for="login-email">Work Email</label>
              <input type="email" id="login-email" placeholder="name@waspa.org" required />
            </div>
            
            <div>
              <label for="login-password">Password</label>
              <input type="password" id="login-password" placeholder="Enter your password" required />
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">Login</button>
          </form>
          
          <div class="demo-credentials">
            <h3>Demo Login:</h3>
            <p>Email: admin@waspa.org (Manager)</p>
            <p>Email: user@waspa.org (Regular User)</p>
            <p class="mt-1">Password: password</p>
          </div>
          
          <div class="auth-switch">
            <p>
              Don't have an account? 
              <button id="show-register" type="button">Register here</button>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  renderRegisterForm() {
    return `
      <div class="auth-container">
        <div class="auth-card animate-fade-in">
          <div class="auth-header">
            <h1 class="auth-title">WASPA</h1>
            <p class="auth-subtitle">Employee System</p>
          </div>
          
          <form id="register-form" class="auth-form">
            <div>
              <label for="reg-name">Full Name</label>
              <input type="text" id="reg-name" placeholder="Enter your full name" required />
            </div>
            
            <div>
              <label for="reg-email">Work Email</label>
              <input type="email" id="reg-email" placeholder="name@waspa.org" required />
            </div>
            
            <div>
              <label for="reg-password">Password</label>
              <input type="password" id="reg-password" placeholder="Create a password" required minlength="6" />
            </div>
            
            <div>
              <label for="reg-confirm">Confirm Password</label>
              <input type="password" id="reg-confirm" placeholder="Confirm your password" required />
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">Register</button>
          </form>
          
          <div class="demo-credentials">
            <h3>Demo Users:</h3>
            <p>• admin@waspa.org (Manager)</p>
            <p>• user@waspa.org (Regular User)</p>
            <p class="mt-1">Password: password</p>
          </div>
          
          <div class="auth-switch">
            <p>
              Already have an account? 
              <button id="show-login" type="button">Login here</button>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  renderDashboard() {
    const isManager = authManager.isManager();
    
    return `
      ${this.renderHeader()}
      <main class="container mx-auto px-4 pb-8">
        ${isManager && this.currentState.dashboardView === 'manager' 
          ? this.renderManagerDashboard() 
          : this.renderUserDashboard()
        }
      </main>
      ${this.renderEditDialogs()}
    `;
  }

  renderHeader() {
    const isManager = authManager.isManager();
    const userData = authManager.currentUserData || {};
    
    return `
      <header class="header">
        <div class="header-content">
          <div class="logo-section">
            <div>
              <h1 class="logo">WASPA</h1>
              <span class="logo-subtitle">Employee System</span>
            </div>
            
            ${isManager ? `
              <div class="view-switcher sm:d-flex">
                <button id="switch-to-user" class="${this.currentState.dashboardView === 'user' ? 'active' : ''}">
                  My Dashboard
                </button>
                <button id="switch-to-manager" class="${this.currentState.dashboardView === 'manager' ? 'active' : ''}">
                  Manager View
                </button>
              </div>
            ` : ''}
          </div>
          
          <div class="user-info">
            <div class="user-details hidden sm:d-block">
              <p class="user-name">${userData.name || 'User'}</p>
              <p class="user-email">${authManager.currentUser?.email || ''}</p>
            </div>
            <button id="logout-btn" class="btn btn-destructive">Logout</button>
          </div>
        </div>
        
        ${isManager ? `
          <div class="mobile-view-switcher sm:d-none">
            <button id="switch-to-user" class="${this.currentState.dashboardView === 'user' ? 'active' : ''}">
              My Dashboard
            </button>
            <button id="switch-to-manager" class="${this.currentState.dashboardView === 'manager' ? 'active' : ''}">
              Manager View
            </button>
          </div>
        ` : ''}
      </header>
    `;
  }

  renderUserDashboard() {
    return `
      ${this.renderStatsSection()}
      <nav class="tabs">
        ${CONSTANTS.USER_TABS.map(tab => `
          <button class="user-tab tab-button ${this.currentState.userTab === tab.id ? 'active' : ''}" 
                  data-tab="${tab.id}">
            ${tab.label}
          </button>
        `).join('')}
      </nav>
      ${this.renderUserTabContent()}
    `;
  }

  renderManagerDashboard() {
    return `
      <div class="manager-header">
        <h2>Manager Dashboard</h2>
        <p>Manage users, view activity across the organization, and export reports</p>
      </div>
      
      <nav class="tabs">
        ${CONSTANTS.MANAGER_TABS.map(tab => `
          <button class="manager-tab tab-button ${this.currentState.managerTab === tab.id ? 'active' : ''}" 
                  data-tab="${tab.id}">
            ${tab.label}
          </button>
        `).join('')}
      </nav>
      ${this.renderManagerTabContent()}
    `;
  }

  renderStatsSection() {
    const testsToday = dataManager.getTestsToday().length;
    const warningsToday = dataManager.getWarningsToday().length;
    const totalTests = dataManager.tests.length;
    const activeDays = dataManager.getActiveDays();
    
    return `
      <section class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">🧪</span>
            <div class="stat-content">
              <h3>${testsToday}</h3>
              <p>Tests Today</p>
            </div>
          </div>
          
          <div class="stat-card">
            <span class="stat-icon">⚠️</span>
            <div class="stat-content">
              <h3>${warningsToday}</h3>
              <p>Warnings Today</p>
            </div>
          </div>
          
          <div class="stat-card">
            <span class="stat-icon">📊</span>
            <div class="stat-content">
              <h3>${totalTests}</h3>
              <p>Total Tests</p>
            </div>
          </div>
          
          <div class="stat-card">
            <span class="stat-icon">📅</span>
            <div class="stat-content">
              <h3>${activeDays}</h3>
              <p>Active Days</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderUserTabContent() {
    switch (this.currentState.userTab) {
      case 'tests': return this.renderTestsTab();
      case 'upload': return this.renderUploadTab();
      case 'warnings': return this.renderWarningsTab();
      case 'export': return this.renderExportTab();
      default: return this.renderTestsTab();
    }
  }

  renderManagerTabContent() {
    switch (this.currentState.managerTab) {
      case 'overview': return this.renderManagerOverview();
      case 'stats': return this.renderUserStatsTab();
      case 'export': return this.renderManagerExportTab();
      case 'admin': return this.renderAdminTab();
      default: return this.renderManagerOverview();
    }
  }

  renderTestsTab() {
    const today = new Date().toISOString().split('T')[0];
    
    return `
      <div class="grid-2 animate-fade-in">
        <!-- Form -->
        <div class="card">
          <div class="card-header">
            <h2>Record Manual Test</h2>
          </div>
          
          <form id="test-form" class="space-y-4">
            <div class="form-grid">
              <div>
                <label>Date</label>
                <input type="date" id="test-date" value="${today}" required />
              </div>
              <div>
                <label>Test Type</label>
                <select id="test-type" required>
                  <option value="">Select Type</option>
                  ${CONSTANTS.TEST_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>
            </div>
            
            <div>
              <label>Network</label>
              <select id="test-network" required>
                <option value="">Manual Test Network</option>
                ${CONSTANTS.NETWORKS.map(n => `<option value="${n}">${n}</option>`).join('')}
              </select>
            </div>
            
            <div>
              <label>Description</label>
              <textarea id="test-description" rows="3" placeholder="Describe the test performed..." required></textarea>
            </div>
            
            <div>
              <label>Result</label>
              <select id="test-result" required>
                <option value="">Select Result</option>
                ${CONSTANTS.TEST_RESULTS.map(r => `<option value="${r}">${r}</option>`).join('')}
              </select>
            </div>
            
            <div>
              <label>🔗 File Link (Optional)</label>
              <input type="url" id="test-fileLink" placeholder="https://drive.google.com/file/..." />
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">Add Test Record</button>
          </form>
        </div>
        
        <!-- List -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">Recent Tests</h2>
            <button id="clear-tests" class="btn btn-destructive text-sm">
              Clear All
            </button>
          </div>
          
          <div class="max-h-500 overflow-y-auto">
            ${dataManager.tests.length === 0 ? `
              <div class="empty-state">
                <div class="empty-icon">🧪</div>
                <p>No tests recorded yet</p>
              </div>
            ` : dataManager.tests.map(test => `
              <div class="test-item">
                <div class="item-header">
                  <span class="item-title">${test.network} - ${test.type} Test</span>
                  <span class="item-date">${formatDateShort(test.date)}</span>
                </div>
                <p class="item-description">${test.description}</p>
                ${test.fileLink ? `
                  <a href="${test.fileLink}" target="_blank" class="text-sm text-primary hover:underline">
                    🔗 View Attached File
                  </a>
                ` : ''}
                <div class="item-footer">
                  <span class="result-badge ${getResultColor(test.result)}">
                    ${test.result}
                  </span>
                  <div class="item-actions">
                    <button onclick="app.editTest('${test.id}')" class="action-btn edit">✏️ Edit</button>
                    <button onclick="app.deleteTest('${test.id}')" class="action-btn delete">🗑️ Delete</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ... (Other render methods for warnings, upload, export, manager views would follow the same pattern)

  attachFormListeners() {
    // This is handled by the global event listeners in setupGlobalEventListeners
  }

  // Global methods for inline event handlers
  async editTest(testId) {
    const test = dataManager.tests.find(t => t.id === testId);
    if (test) {
      this.currentState.editingTest = test;
      this.renderEditTestDialog();
    }
  }

  async deleteTest(testId) {
    if (confirm('Are you sure you want to delete this test?')) {
      try {
        await dataManager.deleteTest(testId);
        this.render();
      } catch (error) {
        // Error handled in dataManager
      }
    }
  }

  renderEditTestDialog() {
    if (!this.currentState.editingTest) return '';
    
    const test = this.currentState.editingTest;
    
    const content = `
      <div class="dialog-content max-w-lg">
        <h2 class="text-lg font-bold text-primary mb-4">Edit Test Record</h2>
        <form id="edit-test-form" class="space-y-4">
          <input type="hidden" id="edit-test-id" value="${test.id}" />
          <div class="form-grid">
            <div>
              <label>Date</label>
              <input type="date" id="edit-test-date" value="${test.date}" required />
            </div>
            <div>
              <label>Test Type</label>
              <select id="edit-test-type" required>
                <option value="">Select Type</option>
                ${CONSTANTS.TEST_TYPES.map(t => `
                  <option value="${t}" ${test.type === t ? 'selected' : ''}>${t}</option>
                `).join('')}
              </select>
            </div>
          </div>
          <div>
            <label>Network</label>
            <select id="edit-test-network" required>
              <option value="">Select Network</option>
              ${CONSTANTS.NETWORKS.map(n => `
                <option value="${n}" ${test.network === n ? 'selected' : ''}>${n}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label>Description</label>
            <textarea id="edit-test-description" rows="3" required>${test.description}</textarea>
          </div>
          <div>
            <label>Result</label>
            <select id="edit-test-result" required>
              <option value="">Select Result</option>
              ${CONSTANTS.TEST_RESULTS.map(r => `
                <option value="${r}" ${test.result === r ? 'selected' : ''}>${r}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label>File Link (Optional)</label>
            <input type="url" id="edit-test-fileLink" value="${test.fileLink || ''}" />
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" onclick="closeDialog()" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    `;
    
    showDialog(content, () => {
      this.currentState.editingTest = null;
    });
    
    // Attach form submit handler
    setTimeout(() => {
      const form = document.getElementById('edit-test-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const testData = {
            date: document.getElementById('edit-test-date').value,
            type: document.getElementById('edit-test-type').value,
            network: document.getElementById('edit-test-network').value,
            description: document.getElementById('edit-test-description').value,
            result: document.getElementById('edit-test-result').value,
            fileLink: document.getElementById('edit-test-fileLink').value || ''
          };
          
          try {
            await dataManager.updateTest(test.id, testData);
            closeDialog();
            this.currentState.editingTest = null;
            this.render();
          } catch (error) {
            // Error handled in dataManager
          }
        });
      }
    }, 100);
  }

  renderEditDialogs() {
    return '';
  }
}

// Initialize and start the app
document.addEventListener('DOMContentLoaded', async () => {
  window.app = new WASPAApp();
  await window.app.init();

});
