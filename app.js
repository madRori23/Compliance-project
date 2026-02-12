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
  }

  applyDateFilter() {
  const startDate = document.getElementById('stats-start-date')?.value;
  const endDate = document.getElementById('stats-end-date')?.value;
  
  // Validate dates
  if (startDate && endDate && startDate > endDate) {
    showToast('Start date cannot be after end date', 'error');
    return;
  }
  
  this.currentState.statsStartDate = startDate || '';
  this.currentState.statsEndDate = endDate || '';
  
  this.render();
}

clearDateFilter() {
  this.currentState.statsStartDate = '';
  this.currentState.statsEndDate = '';
  this.render();
}

configureTargets() {
  showToast('Target configuration will be implemented soon', 'info');
  // You can implement a dialog for configuring targets here
}

setDatePreset(preset) {
  const today = new Date();
  let startDate = '';
  let endDate = today.toISOString().split('T')[0];
  
  switch (preset) {
    case 'today':
      startDate = endDate;
      break;
      
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      startDate = yesterday.toISOString().split('T')[0];
      endDate = startDate;
      break;
      
    case 'thisWeek':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      startDate = weekStart.toISOString().split('T')[0];
      break;
      
    case 'lastWeek':
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      startDate = lastWeekStart.toISOString().split('T')[0];
      endDate = lastWeekEnd.toISOString().split('T')[0];
      break;
      
    case 'thisMonth':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = monthStart.toISOString().split('T')[0];
      break;
      
    case 'lastMonth':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      startDate = lastMonthStart.toISOString().split('T')[0];
      endDate = lastMonthEnd.toISOString().split('T')[0];
      break;
      
    case 'thisQuarter':
      const quarter = Math.floor(today.getMonth() / 3);
      const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
      startDate = quarterStart.toISOString().split('T')[0];
      break;
  }
  
  this.currentState.statsStartDate = startDate;
  this.currentState.statsEndDate = endDate;
  this.render();
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

  async toggleUserRole(userId, makeManager) {
  if (confirm(`Are you sure you want to ${makeManager ? 'promote' : 'demote'} this user?`)) {
    try {
      await dataManager.updateUserRole(userId, makeManager);
      this.render();
    } catch (error) {
      showToast(`Failed to update user role: ${error.message}`, 'error');
    }
  }
}

async exportTests() {
  try {
    const userId = document.getElementById('export-user')?.value || 'all';
    const fromDate = document.getElementById('export-from')?.value;
    const toDate = document.getElementById('export-to')?.value;
    const network = document.getElementById('export-network')?.value;
    
    let testsToExport = dataManager.tests;
    
    // Filter by user
    if (userId !== 'all') {
      testsToExport = testsToExport.filter(test => test.userId === userId);
    }
    
    // Filter by date range
    if (fromDate) {
      testsToExport = testsToExport.filter(test => test.date >= fromDate);
    }
    if (toDate) {
      testsToExport = testsToExport.filter(test => test.date <= toDate);
    }
    
    // Filter by network
    if (network && network !== 'all') {
      testsToExport = testsToExport.filter(test => test.network === network);
    }
    
    if (testsToExport.length === 0) {
      showToast('No tests found with the selected filters', 'warning');
      return;
    }
    
    dataManager.exportToExcel(testsToExport, `tests_export_${new Date().toISOString().split('T')[0]}`);
  } catch (error) {
    showToast(`Export failed: ${error.message}`, 'error');
  }
}

async exportWarnings() {
  try {
    const userId = document.getElementById('export-user')?.value || 'all';
    const fromDate = document.getElementById('export-from')?.value;
    const toDate = document.getElementById('export-to')?.value;
    
    let warningsToExport = dataManager.warnings;
    
    // Filter by user
    if (userId !== 'all') {
      warningsToExport = warningsToExport.filter(warning => warning.userId === userId);
    }
    
    // Filter by date range
    if (fromDate) {
      warningsToExport = warningsToExport.filter(warning => warning.date >= fromDate);
    }
    if (toDate) {
      warningsToExport = warningsToExport.filter(warning => warning.date <= toDate);
    }
    
    if (warningsToExport.length === 0) {
      showToast('No warnings found with the selected filters', 'warning');
      return;
    }
    
    dataManager.exportToExcel(warningsToExport, `warnings_export_${new Date().toISOString().split('T')[0]}`);
  } catch (error) {
    showToast(`Export failed: ${error.message}`, 'error');
  }
}

async exportAllData() {
  try {
    const userId = document.getElementById('export-user')?.value || 'all';
    const fromDate = document.getElementById('export-from')?.value;
    const toDate = document.getElementById('export-to')?.value;
    const network = document.getElementById('export-network')?.value;
    
    let allData = [];
    
    // Add tests
    let testsToExport = dataManager.tests;
    if (userId !== 'all') {
      testsToExport = testsToExport.filter(test => test.userId === userId);
    }
    if (fromDate) {
      testsToExport = testsToExport.filter(test => test.date >= fromDate);
    }
    if (toDate) {
      testsToExport = testsToExport.filter(test => test.date <= toDate);
    }
    if (network && network !== 'all') {
      testsToExport = testsToExport.filter(test => test.network === network);
    }
    
    // Add warnings
    let warningsToExport = dataManager.warnings;
    if (userId !== 'all') {
      warningsToExport = warningsToExport.filter(warning => warning.userId === userId);
    }
    if (fromDate) {
      warningsToExport = warningsToExport.filter(warning => warning.date >= fromDate);
    }
    if (toDate) {
      warningsToExport = warningsToExport.filter(warning => warning.date <= toDate);
    }
    
    if (testsToExport.length === 0 && warningsToExport.length === 0) {
      showToast('No data found with the selected filters', 'warning');
      return;
    }
    
    dataManager.exportToExcel(
      [...testsToExport, ...warningsToExport], 
      `full_export_${new Date().toISOString().split('T')[0]}`
    );
  } catch (error) {
    showToast(`Export failed: ${error.message}`, 'error');
  }
}

async updateUserRole() {
  const userId = document.getElementById('promote-user')?.value;
  const action = document.getElementById('promote-action')?.value;
  
  if (!userId) {
    showToast('Please select a user', 'error');
    return;
  }
  
  const makeManager = action === 'promote';
  await this.toggleUserRole(userId, makeManager);
}

viewUserDetails(userId) {
  const user = authManager.users.find(u => u.id === userId);
  if (!user) return;
  
  const userTests = dataManager.tests.filter(t => t.userId === userId);
  const userWarnings = dataManager.warnings.filter(w => w.userId === userId);
  
  const content = `
    <div class="dialog-content max-w-2xl">
      <h2 class="text-lg font-bold text-primary mb-4">User Details: ${user.name || user.email}</h2>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h3 class="font-bold mb-1">Basic Info</h3>
            <p>Email: ${user.email}</p>
            <p>Role: ${user.isManager ? 'Manager' : 'User'}</p>
            <p>Joined: ${user.createdAt ? formatDateShort(user.createdAt) : 'Unknown'}</p>
          </div>
          <div>
            <h3 class="font-bold mb-1">Activity</h3>
            <p>Total Tests: ${userTests.length}</p>
            <p>Total Warnings: ${userWarnings.length}</p>
            <p>Last Login: ${user.lastLogin ? formatDateShort(user.lastLogin) : 'Never'}</p>
          </div>
        </div>
        
        ${userTests.length > 0 ? `
          <div>
            <h3 class="font-bold mb-2">Recent Tests</h3>
            <div class="max-h-40 overflow-y-auto">
              ${userTests.slice(0, 5).map(test => `
                <div class="p-2 border-b">
                  <div class="flex justify-between">
                    <span>${test.network} - ${test.type}</span>
                    <span class="text-sm">${formatDateShort(test.date)}</span>
                  </div>
                  <div class="text-sm">${test.result}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="flex justify-end">
          <button type="button" onclick="closeDialog()" class="btn btn-outline">Close</button>
        </div>
      </div>
    </div>
  `;
  
  showDialog(content);
}

  async render() {
    if (authManager.loading) {
      this.renderLoading();
      return;
    }
    
    if (!authManager.isAuthenticated) {
      this.renderLogin();
      return;
    }
    
    const app = document.getElementById('app');

    if (authManager.isManager() && (!authManager.users || authManager.users.length === 0)) {
    console.log('Loading users for manager...');
    try {
      // Load users
      await authManager.loadUsers();
    } catch (error) {
      console.error('Failed to load users:', error);
      showToast('Failed to load users', 'error');
      }
    }
    
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
      case 'users': return this.renderAdminTab();
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

   renderManagerOverview() {
  // Get users data (you might need to load this from your data manager)
  const allUsers = authManager.users || [];
  const managerUsers = allUsers.filter(user => user.isManager || user.role === 'manager');
  const regularUsers = allUsers.filter(user => !user.isManager && user.role !== 'manager');
  
  return `
    <div class="animate-fade-in">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="stat-card">
          <div class="stat-content">
            <h3>${allUsers.length}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-content">
            <h3>${dataManager.tests.length}</h3>
            <p>All Tests</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-content">
            <h3>${dataManager.warnings.length}</h3>
            <p>All Warnings</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-content">
            <h3>${dataManager.getActiveDays()}</h3>
            <p>Active Days</p>
          </div>
        </div>
      </div>
      
      <!-- User Management Section -->
      <div class="card">
        <div class="card-header">
          <h2>User Management</h2>
          <div class="flex gap-2">
            <input type="text" placeholder="Search by name or email..." class="search-input" id="user-search" />
            <select class="select-input" id="role-filter">
              <option value="all">All Roles</option>
              <option value="manager">Managers</option>
              <option value="user">Regular Users</option>
            </select>
          </div>
        </div>
        
        <div class="p-4">
          ${allUsers.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">👤</div>
              <p>No users found</p>
            </div>
          ` : `
            <div class="space-y-3">
              ${allUsers.map(user => `
                <div class="user-card">
                  <div class="flex items-center gap-3">
                    <div class="user-avatar">
                      ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div class="flex-1">
                      <h4 class="font-bold">${user.name || 'Unnamed User'}</h4>
                      <p class="text-sm text-muted-foreground">${user.email}</p>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="role-badge ${user.isManager ? 'manager' : 'user'}">
                          ${user.isManager ? 'Manager' : 'User'}
                        </span>
                        <span class="text-xs text-muted-foreground">
                          Last activity: ${user.lastLogin ? formatDateShort(user.lastLogin) : 'No activity'}
                        </span>
                      </div>
                    </div>
                    <div class="user-actions">
                      <button class="btn btn-sm ${user.isManager ? 'btn-destructive' : 'btn-primary'}" 
                              onclick="app.toggleUserRole('${user.id}', ${!user.isManager})">
                        ${user.isManager ? 'Demote' : 'Promote'}
                      </button>
                      <button class="btn btn-sm btn-outline" onclick="app.viewUserDetails('${user.id}')">
                        Details
                      </button>
                    </div>
                  </div>
                  <div class="user-stats mt-2 flex gap-4">
                    <span>Tests: ${dataManager.tests.filter(t => t.userId === user.id).length}</span>
                    <span>Warnings: ${dataManager.warnings.filter(w => w.userId === user.id).length}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

renderUserStatsTab() {
  // Get date filter values from currentState or defaults
  const filterStartDate = this.currentState.statsStartDate || '';
  const filterEndDate = this.currentState.statsEndDate || '';
  
  // Calculate week and month dates
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Format dates
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const monthStartStr = monthStart.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  
  // Filter data based on selected date range
  let filteredTests = dataManager.tests;
  
  if (filterStartDate) {
    filteredTests = filteredTests.filter(t => t.date >= filterStartDate);
  }
  
  if (filterEndDate) {
    filteredTests = filteredTests.filter(t => t.date <= filterEndDate);
  }
  
  // Calculate week and month tests based on filtered data
  const weekTests = filteredTests.filter(t => t.date >= weekStartStr && t.date <= todayStr);
  const monthTests = filteredTests.filter(t => t.date >= monthStartStr && t.date <= todayStr);
  
  // Calculate complete vs partial tests
  const weekComplete = weekTests.filter(t => t.type === 'Complete').length;
  const weekPartial = weekTests.filter(t => t.type === 'Partial').length;
  const monthComplete = monthTests.filter(t => t.type === 'Complete').length;
  const monthPartial = monthTests.filter(t => t.type === 'Partial').length;
  
  // Network breakdown for filtered data
  const networks = CONSTANTS.NETWORKS || ['MTN', 'Vodacom', 'Cell C', 'Telkom'];
  const networkBreakdown = networks.map(network => {
    const networkTests = filteredTests.filter(t => t.network === network);
    return {
      network,
      complete: networkTests.filter(t => t.type === 'Complete').length,
      partial: networkTests.filter(t => t.type === 'Partial').length,
      total: networkTests.length
    };
  });
  
  // Targets (you might want to store these in settings)
  const weeklyTarget = { complete: 65, partial: 85, total: 150 };
  const monthlyTarget = { complete: 260, partial: 340, total: 600 };
  
  // Calculate overall performance based on filtered data
  const totalFilteredTests = filteredTests.length;
  const totalComplete = filteredTests.filter(t => t.type === 'Complete').length;
  const totalPartial = filteredTests.filter(t => t.type === 'Partial').length;

  function countWorkingDays(startDate, endDate) {
  let count = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
}
  // Calculate filtered target based on date range
  let filteredTarget = { complete: 0, partial: 0, total: 0 };
  
  if (filterStartDate && filterEndDate) {
  const start = new Date(filterStartDate);
  const end = new Date(filterEndDate);
  
  // Count working days in the selected range
  const workingDaysInRange = countWorkingDays(start, end);
  
  // Get the current month's working days for context (optional)
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const workingDaysInMonth = countWorkingDays(firstDayOfMonth, lastDayOfMonth);
  
  // Use actual working days for proportion
  const proportion = Math.min(workingDaysInRange / workingDaysInMonth, 1);
  
  filteredTarget = {
    complete: Math.round(monthlyTarget.complete * proportion),
    partial: Math.round(monthlyTarget.partial * proportion),
    total: Math.round(monthlyTarget.total * proportion)
    };
  } else {
    // Use monthly target if no filter or use appropriate target
    filteredTarget = monthlyTarget;
  }
  
  return `
    <div class="animate-fade-in">
      <div class="card mb-6">
        <div class="card-header">
          <h2>User Statistics</h2>
          <div class="flex items-center gap-2">
            <select class="select-input" id="user-filter">
              <option value="all">All Users (Organization)</option>
              ${(authManager.users || []).map(user => `
                <option value="${user.id}">${user.name} (${user.email})</option>
              `).join('')}
            </select>
            <button class="btn btn-secondary" onclick="app.configureTargets()">Configure Targets</button>
          </div>
        </div>
        
        <div class="p-4">
          <!-- Date Filter Section -->
          <div class="mb-6 p-4 bg-secondary rounded-lg">
            <h3 class="font-bold mb-3">Date Filter</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block mb-1">From Date</label>
                <input type="date" 
                       id="stats-start-date" 
                       class="input w-full" 
                       value="${filterStartDate}"
                       max="${todayStr}" />
              </div>
              <div>
                <label class="block mb-1">To Date</label>
                <input type="date" 
                       id="stats-end-date" 
                       class="input w-full" 
                       value="${filterEndDate}"
                       max="${todayStr}"
                       min="${filterStartDate || ''}" />
              </div>
              <div class="flex items-end gap-2">
                <button class="btn btn-primary flex-1" onclick="app.applyDateFilter()">
                  Apply Filter
                </button>
                <button class="btn btn-outline" onclick="app.clearDateFilter()">
                  Clear
                </button>
              </div>
            </div>
            <div class="mt-2 text-sm text-muted-foreground">
              ${filterStartDate || filterEndDate 
                ? `Filtering: ${filterStartDate || 'Start'} to ${filterEndDate || 'End'}`
                : 'Showing all data (no date filter applied)'}
            </div>
          </div>
          
          <!-- Quick Stats -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="p-4 bg-secondary rounded-lg">
              <h3 class="text-sm font-medium mb-1">Filtered Tests</h3>
              <p class="text-2xl font-bold">${totalFilteredTests}</p>
              <p class="text-sm text-muted-foreground mt-1">
                ${totalComplete} complete, ${totalPartial} partial
              </p>
            </div>
            <div class="p-4 bg-secondary rounded-lg">
              <h3 class="text-sm font-medium mb-1">Filtered Performance</h3>
              <p class="text-2xl font-bold">${filteredTarget.total > 0 ? Math.round((totalFilteredTests / filteredTarget.total) * 100) : 0}%</p>
              <p class="text-sm text-muted-foreground mt-1">
                vs target of ${filteredTarget.total}
              </p>
            </div>
            <div class="p-4 bg-secondary rounded-lg">
              <h3 class="text-sm font-medium mb-1">This Week Tests</h3>
              <p class="text-2xl font-bold">${weekTests.length}</p>
              <p class="text-sm text-muted-foreground mt-1">
                ${weekComplete} complete, ${weekPartial} partial
              </p>
            </div>
            <div class="p-4 bg-secondary rounded-lg">
              <h3 class="text-sm font-medium mb-1">Week Performance</h3>
              <p class="text-2xl font-bold">${weeklyTarget.total > 0 ? Math.round((weekTests.length / weeklyTarget.total) * 100) : 0}%</p>
              <p class="text-sm text-muted-foreground mt-1">vs target of ${weeklyTarget.total}</p>
            </div>
          </div>
          
          <!-- Network Breakdown -->
          <div class="mb-6">
            <h3 class="font-bold mb-3">
              ${filterStartDate || filterEndDate 
                ? 'Filtered Data — Network Breakdown' 
                : `Week ${getWeekNumber(today)} — Network Breakdown`}
            </h3>
            <div class="overflow-x-auto">
              <table class="w-full table-auto">
                <thead>
                  <tr class="bg-secondary">
                    <th class="p-2 text-left">Network</th>
                    <th class="p-2 text-center">Complete Tests</th>
                    <th class="p-2 text-center">Partial Tests</th>
                    <th class="p-2 text-center">Total</th>
                    <th class="p-2 text-center">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${networkBreakdown.map(item => {
                    const percentage = totalFilteredTests > 0 ? Math.round((item.total / totalFilteredTests) * 100) : 0;
                    return `
                      <tr class="border-b">
                        <td class="p-2">${item.network}</td>
                        <td class="p-2 text-center">${item.complete}</td>
                        <td class="p-2 text-center">${item.partial}</td>
                        <td class="p-2 text-center font-bold">${item.total}</td>
                        <td class="p-2 text-center">
                          <div class="flex items-center justify-center gap-2">
                            <div class="w-16 bg-gray-200 rounded-full h-2">
                              <div class="bg-primary h-2 rounded-full" style="width: ${percentage}%"></div>
                            </div>
                            <span>${percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                  <tr class="bg-secondary font-bold">
                    <td class="p-2">Total</td>
                    <td class="p-2 text-center">${totalComplete}</td>
                    <td class="p-2 text-center">${totalPartial}</td>
                    <td class="p-2 text-center">${totalFilteredTests}</td>
                    <td class="p-2 text-center">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Target & Performance -->
          <div>
            <h3 class="font-bold mb-3">
              ${filterStartDate || filterEndDate 
                ? 'Filtered Target & Performance' 
                : 'Target & Performance'}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 bg-card rounded-lg border">
                <h4 class="font-bold mb-2">Target</h4>
                <p class="text-xl">Complete: ${filteredTarget.complete}</p>
                <p class="text-xl">Partial: ${filteredTarget.partial}</p>
                <p class="text-xl font-bold mt-2">Total: ${filteredTarget.total}</p>
                <div class="mt-2 text-sm text-muted-foreground">
                  ${filterStartDate && filterEndDate 
                    ? `Date range: ${formatDateShort(filterStartDate)} - ${formatDateShort(filterEndDate)}`
                    : 'Monthly target'}
                </div>
              </div>
              <div class="p-4 bg-card rounded-lg border">
                <h4 class="font-bold mb-2">Actual</h4>
                <p class="text-xl">Complete: ${totalComplete}</p>
                <p class="text-xl">Partial: ${totalPartial}</p>
                <p class="text-xl font-bold mt-2">Total: ${totalFilteredTests}</p>
                <div class="mt-2 text-sm text-muted-foreground">
                  ${filterStartDate && filterEndDate 
                    ? `${totalFilteredTests} tests in selected range`
                    : `${totalFilteredTests} total tests`}
                </div>
              </div>
              <div class="p-4 bg-card rounded-lg border">
                <h4 class="font-bold mb-2">Performance</h4>
                <p class="text-xl ${totalComplete >= filteredTarget.complete ? 'text-success' : 'text-destructive'}">
                  Complete: ${filteredTarget.complete > 0 ? Math.round((totalComplete / filteredTarget.complete) * 100) : 0}%
                </p>
                <p class="text-xl ${totalPartial >= filteredTarget.partial ? 'text-success' : 'text-destructive'}">
                  Partial: ${filteredTarget.partial > 0 ? Math.round((totalPartial / filteredTarget.partial) * 100) : 0}%
                </p>
                <p class="text-xl font-bold mt-2 ${totalFilteredTests >= filteredTarget.total ? 'text-success' : 'text-destructive'}">
                  Overall: ${filteredTarget.total > 0 ? Math.round((totalFilteredTests / filteredTarget.total) * 100) : 0}%
                </p>
                <div class="mt-2">
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-primary h-2 rounded-full" 
                         style="width: ${filteredTarget.total > 0 ? Math.min(Math.round((totalFilteredTests / filteredTarget.total) * 100), 100) : 0}%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Quick Date Presets -->
          <div class="mt-6 p-4 bg-secondary rounded-lg">
            <h3 class="font-bold mb-3">Quick Date Presets</h3>
            <div class="flex flex-wrap gap-2">
              <button class="btn btn-outline btn-sm" onclick="app.setDatePreset('today')">
                Today
              </button>
              <button class="btn btn-outline btn-sm" onclick="app.setDatePreset('yesterday')">
                Yesterday
              </button>
              <button class="btn btn-outline btn-sm" onclick="app.setDatePreset('thisWeek')">
                This Week
              </button>
              <button class="btn btn-outline btn-sm" onclick="app.setDatePreset('lastWeek')">
                Last Week
              </button>
              <button class="btn btn-outline btn-sm" onclick="app.setDatePreset('thisMonth')">
                This Month
              </button>
              <button class="btn btn-outline btn-sm" onclick="app.setDatePreset('lastMonth')">
                Last Month
              </button>
              <button class="btn btn-outline btn-sm" onclick="app.setDatePreset('thisQuarter')">
                This Quarter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

renderManagerExportTab() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0].replace(/-/g, '/');
  };
  
  return `
    <div class="animate-fade-in">
      <div class="card">
        <div class="card-header">
          <h2>Export User Data</h2>
          <p class="text-muted-foreground">Export test and warning records across all users or filter by specific user</p>
        </div>
        
        <div class="p-4">
          <!-- Filter Options -->
          <div class="mb-6">
            <h3 class="font-bold mb-3">Filter Options</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label class="block mb-1">Select User</label>
                <select class="select-input w-full" id="export-user">
                  <option value="all">All Users</option>
                  ${(authManager.users || []).map(user => `
                    <option value="${user.id}">${user.name} (${user.email})</option>
                  `).join('')}
                </select>
              </div>
              <div>
                <label class="block mb-1">From Date</label>
                <input type="date" class="input w-full" id="export-from" value="${formatDateForInput(firstDay)}" />
              </div>
              <div>
                <label class="block mb-1">To Date</label>
                <input type="date" class="input w-full" id="export-to" value="${formatDateForInput(lastDay)}" />
              </div>
              <div>
                <label class="block mb-1">Filter by Network</label>
                <select class="select-input w-full" id="export-network">
                  <option value="all">All Networks</option>
                  ${CONSTANTS.NETWORKS.map(network => `
                    <option value="${network}">${network}</option>
                  `).join('')}
                </select>
              </div>
            </div>
          </div>
          
          <!-- Export Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="p-4 bg-secondary rounded-lg">
              <h3 class="font-bold mb-2">Export All Tests</h3>
              <p class="text-muted-foreground mb-3">${dataManager.tests.length} test records across all users</p>
              <button class="btn btn-primary w-full" onclick="dataManager.exportTests()">Export Tests</button>
            </div>
            <div class="p-4 bg-secondary rounded-lg">
              <h3 class="font-bold mb-2">Export All Warnings</h3>
              <p class="text-muted-foreground mb-3">${dataManager.warnings.length} warning records across all users</p>
              <button class="btn btn-primary w-full" onclick="dataManager.exportWarnings()">Export Warnings</button>
            </div>
            <div class="p-4 bg-secondary rounded-lg">
              <h3 class="font-bold mb-2">Complete Report</h3>
              <p class="text-muted-foreground mb-3">Full dataset with all records</p>
              <button class="btn btn-primary w-full" onclick="dataManager.exportAllData()">Export All</button>
            </div>
          </div>
          
          <!-- Export Summary -->
          <div class="p-4 bg-card rounded-lg border">
            <h3 class="font-bold mb-3">Export Summary</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="text-center">
                <h4 class="text-3xl font-bold">${dataManager.tests.length}</h4>
                <p class="text-muted-foreground">Tests</p>
              </div>
              <div class="text-center">
                <h4 class="text-3xl font-bold">${dataManager.warnings.length}</h4>
                <p class="text-muted-foreground">Warnings</p>
              </div>
              <div class="text-center">
                <h4 class="text-3xl font-bold">${authManager.users ? authManager.users.length : 1}</h4>
                <p class="text-muted-foreground">Users</p>
              </div>
              <div class="text-center">
                <h4 class="text-sm font-bold">${authManager.currentUser?.email || 'Unknown'}</h4>
                <p class="text-muted-foreground">Exported By</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

renderAdminTab() {
  return `
    <div class="animate-fade-in">
      <div class="card">
        <div class="card-header">
          <h2>User Management</h2>
          <p class="text-muted-foreground">Promote users to manager role to give them access to all users data and reports</p>
        </div>
        
        <div class="p-4">
          <!-- Promote User Form -->
          <div class="mb-6 p-4 bg-secondary rounded-lg">
            <h3 class="font-bold mb-3">Promote User to Manager</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block mb-1">User Email</label>
                <select class="select-input w-full" id="promote-user">
                  <option value="">Select User</option>
                  ${(authManager.users || []).filter(user => !user.isManager).map(user => `
                    <option value="${user.id}">${user.email}</option>
                  `).join('')}
                </select>
              </div>
              <div>
                <label class="block mb-1">Action</label>
                <select class="select-input w-full" id="promote-action">
                  <option value="promote">Promote to Manager</option>
                  <option value="demote">Demote to User</option>
                </select>
              </div>
              <div class="flex items-end">
                <button class="btn btn-primary w-full" onclick="app.updateUserRole()">Update Role</button>
              </div>
            </div>
          </div>
          
          <!-- Users List -->
          <div>
            <h3 class="font-bold mb-3">All Users</h3>
            <div class="overflow-x-auto">
              <table class="w-full table-auto">
                <thead>
                  <tr class="bg-secondary">
                    <th class="p-2 text-left">Name</th>
                    <th class="p-2 text-left">Email</th>
                    <th class="p-2 text-left">Role</th>
                    <th class="p-2 text-left">Last Login</th>
                    <th class="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${(authManager.users || []).map(user => `
                    <tr class="border-b">
                      <td class="p-2">${user.name || 'Unnamed'}</td>
                      <td class="p-2">${user.email}</td>
                      <td class="p-2">
                        <span class="role-badge ${user.isManager ? 'manager' : 'user'}">
                          ${user.isManager ? 'Manager' : 'User'}
                        </span>
                      </td>
                      <td class="p-2">${user.lastLogin ? formatDateShort(user.lastLogin) : 'Never'}</td>
                      <td class="p-2">
                        <button class="btn btn-sm ${user.isManager ? 'btn-destructive' : 'btn-primary'}" 
                                onclick="app.toggleUserRole('${user.id}', ${!user.isManager})">
                          ${user.isManager ? 'Demote' : 'Promote'}
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

  
 renderUploadTab() {
  return `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h2>Upload Documents</h2>
      </div>
      <div class="p-4">
        <p>Upload test documents, certifications, or other files.</p>
        <div class="mt-6 space-y-4">
          <div class="upload-area">
            <div class="upload-content">
              <span class="upload-icon">📁</span>
              <p class="upload-text">Drag & drop files here</p>
              <p class="upload-subtext">or click to browse</p>
              <input type="file" class="upload-input" multiple />
            </div>
          </div>
          <div class="text-sm text-muted-foreground">
            <p>• Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
            <p>• Max file size: 10MB per file</p>
          </div>
          <button class="btn btn-primary w-full">Upload Selected Files</button>
        </div>
      </div>
    </div>
  `;
}

renderWarningsTab() {
  const today = new Date().toISOString().split('T')[0];
  
  return `
    <div class="grid-2 animate-fade-in">
      <!-- Warning Form -->
      <div class="card">
        <div class="card-header">
          <h2>Record Warning</h2>
        </div>
        
        <form id="warning-form" class="space-y-4">
          <div class="form-grid">
            <div>
              <label>Date</label>
              <input type="date" id="warning-date" value="${today}" required />
            </div>
            <div>
              <label>Warning Type</label>
              <select id="warning-type" required>
                <option value="">Select Type</option>
                ${CONSTANTS.WARNING_TYPES.map(w => `<option value="${w}">${w}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <div>
            <label>Recipient</label>
            <select id="warning-recipient" required>
                  <option value="">Select Type</option>
                  ${CONSTANTS.RECIPIENT_MEMBERS.map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>
          </div>
          
          <div>
            <label>Reference Number</label>
            <input type="text" id="warning-reference" placeholder="WA1234" pattern="^WA\d{4,}$" required />
            <div class="form-hint">Format: WA followed by numbers (e.g., WA1234)</div>
          </div>
          
          <div>
            <label>Details</label>
            <textarea id="warning-details" rows="3" placeholder="Describe the warning details..." required></textarea>
          </div>
          
          <div>
            <label>Problem Areas</label>
            <textarea id="warning-problemAreas" rows="2" placeholder="Specify problem areas..." required></textarea>
          </div>
          
          <button type="submit" class="btn btn-primary btn-block">Record Warning</button>
        </form>
      </div>
      
      <!-- Warnings List -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="card-title">Recent Warnings</h2>
          <button id="clear-warnings" class="btn btn-destructive text-sm">
            Clear All
          </button>
        </div>
        
        <div class="max-h-500 overflow-y-auto">
          ${dataManager.warnings.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">⚠️</div>
              <p>No warnings recorded yet</p>
            </div>
          ` : dataManager.warnings.map(warning => `
            <div class="warning-item">
              <div class="item-header">
                <span class="item-title">${warning.type} - ${warning.recipient}</span>
                <span class="item-date">${formatDateShort(warning.date)}</span>
              </div>
              <div class="item-reference">Ref: ${warning.reference}</div>
              <p class="item-description">${warning.details}</p>
              <div class="problem-areas">
                <strong>Problem Areas:</strong> ${warning.problemAreas}
              </div>
              <div class="item-footer">
                <div class="item-actions">
                  <button onclick="app.editWarning('${warning.id}')" class="action-btn edit">✏️ Edit</button>
                  <button onclick="app.deleteWarning('${warning.id}')" class="action-btn delete">🗑️ Delete</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

renderExportTab() {
  return `
    <div class="card animate-fade-in">
      <div class="card-header">
        <h2>Export Data</h2>
      </div>
      <div class="p-4">
        <p>Export your test and warning data for reporting.</p>
        <div class="space-y-3 mt-4">
          <button class="btn btn-primary w-full" onclick="dataManager.exportTests()">
            Export Test Data (Excel)
          </button>
          <button class="btn btn-primary w-full" onclick="dataManager.exportWarnings()">
            Export Warning Data (Excel)
          </button>
          <button class="btn btn-primary w-full" onclick="dataManager.exportAllData()">
            Export All Data (Excel)
          </button>
          <div class="export-options mt-6">
            <h3 class="font-bold mb-2">Date Range Export</h3>
            <div class="form-grid">
              <div>
                <label>From Date</label>
                <input type="date" id="export-from" class="w-full" />
              </div>
              <div>
                <label>To Date</label>
                <input type="date" id="export-to" class="w-full" />
              </div>
            </div>
            <button class="btn btn-secondary w-full mt-2" onclick="dataManager.exportDateRange()">
              Export Date Range
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

  attachFormListeners() {
    // This is handled by the global event listeners in setupGlobalEventListeners
  }

  // Global methods for inline event handlers
 async editWarning(warningId) {
  const warning = dataManager.warnings.find(w => w.id === warningId);
  if (warning) {
    this.currentState.editingWarning = warning;
    this.renderEditWarningDialog();
  }
}

async deleteWarning(warningId) {
  if (confirm('Are you sure you want to delete this warning?')) {
    try {
      await dataManager.deleteWarning(warningId);
      this.render();
    } catch (error) {
      // Error handled in dataManager
    }
  }
}

renderEditWarningDialog() {
  if (!this.currentState.editingWarning) return '';
  
  const warning = this.currentState.editingWarning;
  
  const content = `
    <div class="dialog-content max-w-lg">
      <h2 class="text-lg font-bold text-primary mb-4">Edit Warning Record</h2>
      <form id="edit-warning-form" class="space-y-4">
        <input type="hidden" id="edit-warning-id" value="${warning.id}" />
        <div class="form-grid">
          <div>
            <label>Date</label>
            <input type="date" id="edit-warning-date" value="${warning.date}" required />
          </div>
          <div>
            <label>Warning Type</label>
            <select id="edit-warning-type" required>
              <option value="">Select Type</option>
              ${CONSTANTS.WARNING_TYPES.map(w => `
                <option value="${w}" ${warning.type === w ? 'selected' : ''}>${w}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div>
          <label>Recipient</label>
          <input type="text" id="edit-warning-recipient" value="${warning.recipient}" required />
        </div>
        <div>
          <label>Reference Number</label>
          <input type="text" id="edit-warning-reference" value="${warning.reference}" pattern="^WA\d{4,}$" required />
        </div>
        <div>
          <label>Details</label>
          <textarea id="edit-warning-details" rows="3" required>${warning.details}</textarea>
        </div>
        <div>
          <label>Problem Areas</label>
          <textarea id="edit-warning-problemAreas" rows="2" required>${warning.problemAreas}</textarea>
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" onclick="closeDialog()" class="btn btn-outline">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  `;
  
  showDialog(content, () => {
    this.currentState.editingWarning = null;
  });
  
  // Attach form submit handler
  setTimeout(() => {
    const form = document.getElementById('edit-warning-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const warningData = {
          date: document.getElementById('edit-warning-date').value,
          type: document.getElementById('edit-warning-type').value,
          recipient: document.getElementById('edit-warning-recipient').value,
          reference: document.getElementById('edit-warning-reference').value,
          details: document.getElementById('edit-warning-details').value,
          problemAreas: document.getElementById('edit-warning-problemAreas').value
        };
        
        if (!warningData.reference.match(/^WA\d{4,}$/)) {
          showToast('Reference must be in format WAxxxx (e.g., WA1234)', 'error');
          return;
        }
        
        try {
          await dataManager.updateWarning(warning.id, warningData);
          closeDialog();
          this.currentState.editingWarning = null;
          this.render();
        } catch (error) {
          // Error handled in dataManager
        }
      });
    }
  }, 100);
}
  
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

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function formatDateShort(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}


function getResultColor(result) {
  switch (result.toLowerCase()) {
    case 'complete':
    case 'compliant':
    case 'passed':
      return 'result-compliant';
    case 'partial':
    case 'warning':
    case 'inconclusive':
      return 'result-inconclusive';
    case 'failed':
    case 'non-compliant':
      return 'result-non-compliant';
    default:
      return '';
  }
}

// Initialize and start the app
document.addEventListener('DOMContentLoaded', async () => {
  window.app = new WASPAApp();
  await window.app.init();

});















