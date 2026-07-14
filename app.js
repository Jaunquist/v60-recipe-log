const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYBxl1qUzFWUiPppkUFbTa_o56fhKx6PFZ-Xz3yoec4woUdalKYnd159LhoaLwq8t8Cw/exec';

const appState = {
  beans: [],
  settings: {
    sheetUrl: '',
    scriptUrl: '',
    photoFolder: ''
  },
  currentHelperBeanId: '',
  currentView: 'dashboard'
};

document.addEventListener('DOMContentLoaded', async () => {
  bindEvents();
  switchView('dashboard');
  await bootstrapApp();
});

function bindEvents() {
  bindNavigation();

  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', onSaveSettings);
  }

  const photoFolderInput = document.getElementById('photoFolder');
  if (photoFolderInput) {
    photoFolderInput.addEventListener('paste', () => {
      requestAnimationFrame(() => {
        const cleaned = normalizeDriveFolderValue(photoFolderInput.value);
        photoFolderInput.value = cleaned;
        updatePhotoFolderHint(cleaned);
      });
    });

    photoFolderInput.addEventListener('blur', () => {
      const cleaned = normalizeDriveFolderValue(photoFolderInput.value);
      photoFolderInput.value = cleaned;
      updatePhotoFolderHint(cleaned);
    });

    photoFolderInput.addEventListener('input', () => {
      updatePhotoFolderHint(photoFolderInput.value.trim());
    });
  }

  const helperBeanSelect = document.getElementById('helperBeanSelect');
  if (helperBeanSelect) {
    helperBeanSelect.addEventListener('change', (event) => {
      appState.currentHelperBeanId = event.target.value;
      renderRecipeHelper();
    });
  }

  const helperDose = document.getElementById('helperDose');
  const helperRatio = document.getElementById('helperRatio');
  const helperTarget = document.getElementById('helperTarget');
  const helperMethod = document.getElementById('helperMethod');

  [helperDose, helperRatio, helperTarget, helperMethod].forEach((el) => {
    if (el) {
      el.addEventListener('input', renderRecipeHelper);
      el.addEventListener('change', renderRecipeHelper);
    }
  });
}

function bindNavigation() {
  const navButtons 
