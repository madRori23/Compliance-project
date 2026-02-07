import { isAuthenticated, getCurrentUser } from './auth.js';

// Route definitions
const routes = {
  '/login': renderLogin,
  '/': renderDashboard,
  '/dashboard': renderDashboard,
  '/tests': renderTests,
  '/warnings': renderWarnings,
  '/upload': renderUpload,
  '/stats': renderStats,
  '/export': renderExport,
  '/admin': renderAdmin,
  '/user-stats': renderUserStats,
  '/manager-overview': renderManagerOverview,
  '/manager-export': renderManagerExport,
  '/not-found': renderNotFound
};

// Initialize router
export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const route = Object.keys(routes).find(path => {
    const regex = new RegExp('^' + path.replace(/:\w+/g, '([^/]+)') + '$');
    return regex.test(hash);
  });
  
  if (route && routes[route]) {
    routes[route]();
  } else {
    routes['/not-found']();
  }
}

// Render functions for each route
function renderLogin() {
  if (isAuthenticated()) {
    window.location.hash = '#/dashboard';
    return;
  }
  
  document.getElementById('app').innerHTML = `
    ${getLoginPageHTML()}
  `;
  attachLoginListeners();
}

function renderDashboard() {
  if (!isAuthenticated()) {
    window.location.hash = '#/login';
    return;
  }
  
  const user = getCurrentUser();
  const isAdmin = user.role === 'admin';
  const isManager = user.isManager;
  
  document.getElementById('app').innerHTML = `
    ${getHeaderHTML()}
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
      
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        ${getStatsCardHTML('Tests Today', '12', 'text-blue-600')}
        ${getStatsCardHTML('Warnings Today', '3', 'text-orange-600')}
        ${getStatsCardHTML('Active Days', '15', 'text-green-600')}
        ${getStatsCardHTML('Total Records', '45', 'text-purple-600')}
      </div>
      
      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        ${getQuickActionCardHTML('Add New Test', '#/tests', 'Create a new compliance test', 'plus')}
        ${getQuickActionCardHTML('Add Warning', '#/warnings', 'Record a compliance warning', 'alert-triangle')}
      </div>
      
      ${isManager ? getManagerSectionHTML() : ''}
      ${isAdmin ? getAdminSectionHTML() : ''}
    </div>
  `;
}

function renderTests() {
  if (!isAuthenticated()) {
    window.location.hash = '#/login';
    return;
  }
  
  document.getElementById('app').innerHTML = `
    ${getHeaderHTML()}
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Tests</h1>
        <button onclick="window.location.hash='#/upload'" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add New Test
        </button>
      </div>
      
      <!-- Filter Section -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Start Date</label>
            <input type="date" id="filter-start-date" class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">End Date</label>
            <input type="date" id="filter-end-date" class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Network</label>
            <select id="filter-network" class="w-full border rounded px-3 py-2">
              <option value="">All Networks</option>
              <option value="MTN">MTN</option>
              <option value="Vodacom">Vodacom</option>
              <option value="Cell C">Cell C</option>
              <option value="Telkom">Telkom</option>
            </select>
          </div>
          <div class="flex items-end">
            <button onclick="filterTests()" class="w-full bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900">
              Apply Filters
            </button>
          </div>
        </div>
      </div>
      
      <!-- Tests Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody id="tests-table-body" class="bg-white divide-y divide-gray-200">
            <!-- Tests will be loaded here -->
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  loadTests();
}

function renderWarnings() {
  if (!isAuthenticated()) {
    window.location.hash = '#/login';
    return;
  }
  
  document.getElementById('app').innerHTML = `
    ${getHeaderHTML()}
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">Warnings</h1>
      <p class="text-gray-600 mb-6">Record and manage compliance warnings</p>
      
      <!-- Add Warning Form -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Add New Warning</h2>
        <form id="add-warning-form" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Date</label>
              <input type="date" id="warning-date" required class="w-full border rounded px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Type</label>
              <select id="warning-type" required class="w-full border rounded px-3 py-2">
                <option value="">Select Type</option>
                <option value="compliance">Compliance Issue</option>
                <option value="service">Service Issue</option>
                <option value="pricing">Pricing Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Recipient</label>
              <input type="text" id="warning-recipient" required class="w-full border rounded px-3 py-2" placeholder="Enter recipient name">
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Reference</label>
              <input type="text" id="warning-reference" required class="w-full border rounded px-3 py-2" placeholder="Enter reference number">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Problem Areas</label>
            <textarea id="warning-problems" required class="w-full border rounded px-3 py-2" rows="2" placeholder="Describe the problem areas"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Details</label>
            <textarea id="warning-details" required class="w-full border rounded px-3 py-2" rows="4" placeholder="Provide detailed description"></textarea>
          </div>
          <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Add Warning
          </button>
        </form>
      </div>
      
      <!-- Warnings List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody id="warnings-table-body" class="bg-white divide-y divide-gray-200">
            <!-- Warnings will be loaded here -->
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  attachWarningListeners();
  loadWarnings();
}

function renderUpload() {
  if (!isAuthenticated()) {
    window.location.hash = '#/login';
    return;
  }
  
  document.getElementById('app').innerHTML = `
    ${getHeaderHTML()}
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">Upload Test Results</h1>
      
      <div class="bg-white rounded-lg shadow p-6">
        <form id="upload-test-form" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium mb-2">Date</label>
              <input type="date" id="test-date" required class="w-full border rounded px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Type</label>
              <select id="test-type" required class="w-full border rounded px-3 py-2">
                <option value="">Select Type</option>
                <option value="Complete">Complete</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Network</label>
              <select id="test-network" required class="w-full border rounded px-3 py-2">
                <option value="">Select Network</option>
                <option value="MTN">MTN</option>
                <option value="Vodacom">Vodacom</option>
                <option value="Cell C">Cell C</option>
                <option value="Telkom">Telkom</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Result</label>
              <select id="test-result" required class="w-full border rounded px-3 py-2">
                <option value="">Select Result</option>
                <option value="Compliant">Compliant</option>
                <option value="Non-compliant">Non-compliant</option>
                <option value="Inconclusive">Inconclusive</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Description</label>
            <textarea id="test-description" required class="w-full border rounded px-3 py-2" rows="4" placeholder="Describe the test"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">File Link (Optional)</label>
            <input type="url" id="test-file-link" class="w-full border rounded px-3 py-2" placeholder="https://example.com/file">
          </div>
          <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Submit Test
          </button>
        </form>
      </div>
    </div>
  `;
  
  attachUploadListeners();
}

function renderStats() {
  if (!isAuthenticated()) {
    window.location.hash = '#/login';
    return;
  }
  
  document.getElementById('app').innerHTML = `
    ${getHeaderHTML()}
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">Statistics</h1>
      <p class="text-gray-600 mb-6">View your compliance testing statistics</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${getStatsCardHTML('Total Tests', '45', 'text-blue-600', 'Tests conducted')}
        ${getStatsCardHTML('Compliant', '38', 'text-green-600', 'Tests passed')}
        ${getStatsCardHTML('Non-compliant', '5', 'text-red-600', 'Tests failed')}
        ${getStatsCardHTML('Inconclusive', '2', 'text-gray-600', 'Tests unclear')}
        ${getStatsCardHTML('Warnings Issued', '12', 'text-orange-600', 'Total warnings')}
        ${getStatsCardHTML('Active Days', '15', 'text-purple-600', 'Days with activity')}
      </div>
    </div>
  `;
}

function renderExport() {
  if (!isAuthenticated()) {
    window.location.hash = '#/login';
    return;
  }
  
  document.getElementById('app').innerHTML = `
    ${getHeaderHTML()}
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">Export Data</h1>
      <p class="text-gray-600 mb-6">Export your test results and warnings</p>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Export Options</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onclick="exportTests()" class="bg-blue-600 text-white px-6 py-4 rounded hover:bg-blue-700 text-left">
            <div class="font-semibold mb-1">Export Tests</div>
            <div class="text-sm opacity-90">Download all test records</div>
          </button>
          <button onclick="exportWarnings()" class="bg-orange-600 text-white px-6 py-4 rounded hover:bg-orange-700 text-left">
            <div class="font-semibold mb-1">Export Warnings</div>
            <div class="text-sm opacity-90">Download all warning records</div>
          </button>
          <button onclick="exportAll()" class="bg-purple-600 text-white px-6 py-4 rounded hover:bg-purple-700 text-left">
            <div class="font-semibold mb-1">Export All Data</div>
            <div class="text-sm opacity-90">Download complete dataset</div>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderAdmin() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.hash = '#/dashboard';
    return;
  }
  
  document.getElementById('app').innerHTML = `
    ${getHeaderHTML()}
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">User Management</h2>
        <p class="text-gray-600 mb-6">Promote users to manager role</p>
        
        <div id="admin-users-table" class="overflow-x-auto">
          <!-- Users will be loaded here -->
        </div>
      </div>
    </div>
  `;
  
  loadAdminUsers();
}

function renderUserStats() {
  if (!isAuthenticated()) {
    window.location.hash = '#/login';
    return;
  }
  
  document.getElementById('app').innerHTML = `
    ${getHeaderHTML()}
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">User Statistics</h1>
      <p class="text-gray-600 mb-6">View statistics across all users</p>
      
      <div id="user-stats-content">
        <!-- User stats will be loaded here -->
      </div>
    </div>
  `;
}

function renderManagerOverview() {
  const user = getCurrentUser();
  if (!user || !user.isManager) {
    window.location.hash = '#/dashboard';
    return;
  }
  
  document.getElementById('app').innerHTML = `
    ${getHeaderHTML()}
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">Manager Overview</h1>
      <p class="text-gray-600 mb-6">View overview of all users' activities</p>
      
      <div id="manager-overview-content">
        <!-- Manager overview will be loaded here -->
      </div>
    </div>
  `;
}

function renderManagerExport() {
  const user = getCurrentUser();
  if (!user || !user.isManager) {
    window.location.hash = '#/dashboard';
    return;
  }
  
  document.getElementById('app').innerHTML = `
    ${getHeaderHTML()}
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">Manager Export</h1>
      <p class="text-gray-600 mb-6">Export data from all users</p>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Export All User Data</h2>
        <button onclick="exportAllUsersData()" class="bg-purple-600 text-white px-6 py-4 rounded hover:bg-purple-700">
          Export Complete Dataset
        </button>
      </div>
    </div>
  `;
}

function renderNotFound() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p class="text-xl text-gray-600 mb-8">Page not found</p>
        <a href="#/" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Go Home
        </a>
      </div>
    </div>
  `;
}

// Helper functions for HTML generation
function getHeaderHTML() {
  const user = getCurrentUser();
  return `
    <header class="bg-white shadow">
      <div class="container mx-auto px-6 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-blue-600">WASPA</h1>
          <nav class="flex items-center space-x-4">
            <a href="#/" class="text-gray-700 hover:text-blue-600">Dashboard</a>
            <a href="#/tests" class="text-gray-700 hover:text-blue-600">Tests</a>
            <a href="#/warnings" class="text-gray-700 hover:text-blue-600">Warnings</a>
            ${user && user.isManager ? '<a href="#/manager-overview" class="text-gray-700 hover:text-blue-600">Manager</a>' : ''}
            ${user && user.role === 'admin' ? '<a href="#/admin" class="text-gray-700 hover:text-blue-600">Admin</a>' : ''}
            <a href="#/stats" class="text-gray-700 hover:text-blue-600">Stats</a>
            <a href="#/export" class="text-gray-700 hover:text-blue-600">Export</a>
            <span class="text-gray-700">|</span>
            <span class="text-gray-700">${user ? user.name : 'User'}</span>
            <button onclick="handleLogout()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  `;
}

function getLoginPageHTML() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 class="text-3xl font-bold text-center text-blue-600 mb-8">WASPA Login</h1>
        
        <!-- Login Form -->
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <input type="email" id="login-email" required class="w-full border rounded px-3 py-2" placeholder="admin@waspa.org">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Password</label>
            <input type="password" id="login-password" required class="w-full border rounded px-3 py-2" placeholder="password">
          </div>
          <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Login
          </button>
        </form>
        
        <div id="login-error" class="mt-4 text-red-600 text-center hidden"></div>
        
        <div class="mt-6 text-center">
          <a href="#" onclick="showRegisterForm()" class="text-blue-600 hover:underline">
            Don't have an account? Register
          </a>
        </div>
        
        <!-- Register Form (hidden by default) -->
        <form id="register-form" class="space-y-4 mt-6 hidden">
          <div>
            <label class="block text-sm font-medium mb-2">Name</label>
            <input type="text" id="register-name" required class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <input type="email" id="register-email" required class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Password</label>
            <input type="password" id="register-password" required class="w-full border rounded px-3 py-2">
          </div>
          <button type="submit" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
            Register
          </button>
        </form>
        
        <div id="register-error" class="mt-4 text-red-600 text-center hidden"></div>
      </div>
    </div>
  `;
}

function getStatsCardHTML(title, value, colorClass, subtitle = '') {
  return `
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-gray-600 text-sm">${title}</p>
          <p class="text-3xl font-bold ${colorClass}">${value}</p>
          ${subtitle ? `<p class="text-gray-500 text-xs mt-1">${subtitle}</p>` : ''}
        </div>
      </div>
    </div>
  `;
}

function getQuickActionCardHTML(title, link, description, icon) {
  return `
    <div class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onclick="window.location.href='${link}'">
      <h3 class="text-xl font-semibold mb-2">${title}</h3>
      <p class="text-gray-600">${description}</p>
      <div class="mt-4 text-blue-600">→</div>
    </div>
  `;
}

function getManagerSectionHTML() {
  return `
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Manager Section</h2>
      <p class="text-gray-600 mb-4">Access all users data and reports</p>
      <div class="flex space-x-4">
        <a href="#/manager-overview" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          View Overview
        </a>
        <a href="#/manager-export" class="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900">
          Export Data
        </a>
      </div>
    </div>
  `;
}

function getAdminSectionHTML() {
  return `
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Admin Section</h2>
      <p class="text-gray-600 mb-4">Manage users and permissions</p>
      <a href="#/admin" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
        Manage Users
      </a>
    </div>
  `;
}

// Event listeners
function attachLoginListeners() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const result = await login(email, password);
    if (result.success) {
      window.location.hash = '#/dashboard';
    } else {
      const errorDiv = document.getElementById('login-error');
      errorDiv.textContent = result.error;
      errorDiv.classList.remove('hidden');
    }
  });
  
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    const result = await register(name, email, password);
    if (result.success) {
      window.location.hash = '#/dashboard';
    } else {
      const errorDiv = document.getElementById('register-error');
      errorDiv.textContent = result.error;
      errorDiv.classList.remove('hidden');
    }
  });
}

function showRegisterForm() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  loginForm.classList.toggle('hidden');
  registerForm.classList.toggle('hidden');
}

function handleLogout() {
  logout();
}

function attachUploadListeners() {
  const form = document.getElementById('upload-test-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const testData = {
      date: document.getElementById('test-date').value,
      type: document.getElementById('test-type').value,
      network: document.getElementById('test-network').value,
      result: document.getElementById('test-result').value,
      description: document.getElementById('test-description').value,
      fileLink: document.getElementById('test-file-link').value
    };
    
    const result = addTest(testData);
    if (result.success) {
      alert('Test added successfully!');
      window.location.hash = '#/tests';
    }
  });
}

function attachWarningListeners() {
  const form = document.getElementById('add-warning-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const warningData = {
      date: document.getElementById('warning-date').value,
      type: document.getElementById('warning-type').value,
      recipient: document.getElementById('warning-recipient').value,
      reference: document.getElementById('warning-reference').value,
      problemAreas: document.getElementById('warning-problems').value,
      details: document.getElementById('warning-details').value
    };
    
    const result = addWarning(warningData);
    if (result.success) {
      alert('Warning added successfully!');
      loadWarnings();
      form.reset();
    }
  });
}

async function loadTests() {
  const tests = await getUserTests();
  const tbody = document.getElementById('tests-table-body');
  
  if (tests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No tests found</td></tr>';
    return;
  }
  
  tbody.innerHTML = tests.map(test => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap">${test.date}</td>
      <td class="px-6 py-4 whitespace-nowrap">${test.type}</td>
      <td class="px-6 py-4 whitespace-nowrap">${test.network}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 py-1 rounded text-xs ${
          test.result === 'Compliant' ? 'bg-green-100 text-green-800' :
          test.result === 'Non-compliant' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }">${test.result}</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <button onclick="deleteTest('${test.id}')" class="text-red-600 hover:text-red-900">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function loadWarnings() {
  const warnings = await getUserWarnings();
  const tbody = document.getElementById('warnings-table-body');
  
  if (warnings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No warnings found</td></tr>';
    return;
  }
  
  tbody.innerHTML = warnings.map(warning => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap">${warning.date}</td>
      <td class="px-6 py-4 whitespace-nowrap">${warning.type}</td>
      <td class="px-6 py-4 whitespace-nowrap">${warning.recipient}</td>
      <td class="px-6 py-4 whitespace-nowrap">${warning.reference}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <button onclick="deleteWarning('${warning.id}')" class="text-red-600 hover:text-red-900">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function loadAdminUsers() {
  const users = await getAllUsers();
  const container = document.getElementById('admin-users-table');
  
  container.innerHTML = `
    <table class="w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        ${users.map(user => `
          <tr>
            <td class="px-6 py-4">${user.name || 'Unknown'}</td>
            <td class="px-6 py-4">${user.email}</td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 rounded text-xs ${user.isManager ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                ${user.isManager ? 'Manager' : 'User'}
              </span>
            </td>
            <td class="px-6 py-4">
              <button onclick="toggleManager('${user.uid}', ${!user.isManager})" class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                ${user.isManager ? 'Demote' : 'Promote'}
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function toggleManager(userId, makeManager) {
  if (confirm(`${makeManager ? 'Promote' : 'Demote'} user?`)) {
    setUserAsManager(userId, makeManager);
    loadAdminUsers();
  }
}

function filterTests() {
  const startDate = document.getElementById('filter-start-date').value;
  const endDate = document.getElementById('filter-end-date').value;
  const network = document.getElementById('filter-network').value;
  
  let tests = getUserTests();
  
  if (startDate) tests = tests.filter(t => t.date >= startDate);
  if (endDate) tests = tests.filter(t => t.date <= endDate);
  if (network) tests = tests.filter(t => t.network === network);
  
  const tbody = document.getElementById('tests-table-body');
  tbody.innerHTML = tests.map(test => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap">${test.date}</td>
      <td class="px-6 py-4 whitespace-nowrap">${test.type}</td>
      <td class="px-6 py-4 whitespace-nowrap">${test.network}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 py-1 rounded text-xs ${
          test.result === 'Compliant' ? 'bg-green-100 text-green-800' :
          test.result === 'Non-compliant' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }">${test.result}</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <button onclick="deleteTest('${test.id}')" class="text-red-600 hover:text-red-900">Delete</button>
      </td>
    </tr>
  `).join('');
}

function exportTests() {
  const tests = getUserTests();
  downloadJSON(tests, 'waspa_tests_export.json');
}

function exportWarnings() {
  const warnings = getUserWarnings();
  downloadJSON(warnings, 'waspa_warnings_export.json');
}

function exportAll() {
  const data = {
    tests: getUserTests(),
    warnings: getUserWarnings(),
    exportedAt: new Date().toISOString()
  };
  downloadJSON(data, 'waspa_all_data_export.json');
}

function exportAllUsersData() {
  const data = {
    tests: getAllTests(),
    warnings: getAllWarnings(),
    exportedAt: new Date().toISOString()
  };
  downloadJSON(data, 'waspa_all_users_data_export.json');
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Export functions to global scope
window.handleLogout = handleLogout;
window.showRegisterForm = showRegisterForm;
window.deleteTest = deleteTest;
window.deleteWarning = deleteWarning;
window.filterTests = filterTests;
window.toggleManager = toggleManager;
window.exportTests = exportTests;
window.exportWarnings = exportWarnings;
window.exportAll = exportAll;
window.exportAllUsersData = exportAllUsersData;
