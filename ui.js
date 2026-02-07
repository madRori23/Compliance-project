// scripts/ui.js
// UI Helper Functions
function showLoading() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    spinner.style.display = 'flex';
  }
}

function hideLoading() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    spinner.style.display = 'none';
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Remove toast after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 5000);
}

function showDialog(content, onClose = null) {
  const container = document.getElementById('dialog-container');
  const dialog = document.createElement('div');
  dialog.className = 'dialog-overlay';
  dialog.innerHTML = content;
  
  container.appendChild(dialog);
  
  // Close on background click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      closeDialog();
    }
  });
  
  // Close function
  window.closeDialog = () => {
    dialog.remove();
    if (onClose) onClose();
  };
}

function closeDialog() {
  const dialog = document.querySelector('.dialog-overlay');
  if (dialog) {
    dialog.remove();
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getResultColor(result) {
  switch (result) {
    case 'Compliant': return 'text-success';
    case 'Non-compliant': return 'text-destructive';
    case 'Inconclusive': return 'text-warning';
    default: return 'text-foreground';
  }
}

function getWarningTypeLabel(value) {
  const type = CONSTANTS.WARNING_TYPES.find(t => t.value === value);
  return type ? type.label : value;
}

// Export functions for use in HTML event handlers
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.showDialog = showDialog;
window.closeDialog = closeDialog;
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
window.getResultColor = getResultColor;
window.getWarningTypeLabel = getWarningTypeLabel;