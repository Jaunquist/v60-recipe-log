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
  bindSettingsForm();
  bindPhotoFolderField();
  bindHelperInputs();
}

function bindNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const viewTitle = document.getElementById('viewTitle');

  navButtons.forEach((button) => {
    button.onclick = () => {
      const nextView = button.getAttribute('data-view') || 'dashboard';
      appState.currentView = nextView;

      navButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      document.querySelectorAll('.panel').forEach((panel) => {
        panel.classList.add('hidden');
      });

      const activePanel = document.getElementById(`view-${nextView}`);
      if (activePanel) {
        activePanel.classList.remove('hidden');
      }

      if (viewTitle) {
        const titles = {
          dashboard: 'Dashboard',
          library: 'Bean Library',
          helper: 'Recipe Helper',
          settings: 'Settings'
        };
        viewTitle.textContent = titles[nextView] || 'Dashboard';
      }
    };
  });
}

function switchView(view) {
  const navButtons = document.querySelectorAll('.nav-btn');
  const viewTitle = document.getElementById('viewTitle');
  const nextView = view || 'dashboard';

  navButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === nextView);
  });

  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.add('hidden');
  });

  const activePanel = document.getElementById(`view-${nextView}`);
  if (activePanel) {
    activePanel.classList.remove('hidden');
  }

  if (viewTitle) {
    const titles = {
      dashboard: 'Dashboard',
      library: 'Bean Library',
      helper: 'Recipe Helper',
      settings: 'Settings'
    };
    viewTitle.textContent = titles[nextView] || 'Dashboard';
  }
}

function bindSettingsForm() {
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', onSaveSettings);
  }
}

function bindPhotoFolderField() {
  const photoFolderInput = document.getElementById('photoFolder');
  if (!photoFolderInput) return;

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

function bindHelperInputs() {
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

async function bootstrapApp() {
  setStatus('Loading app...', 'info');

  try {
    const [beans, settings] = await Promise.all([
      fetchJson(`${APPS_SCRIPT_URL}?type=beans`),
      fetchJson(`${APPS_SCRIPT_URL}?type=settings`)
    ]);

    appState.beans = Array.isArray(beans) ? beans : [];
    appState.settings = normalizeSettings(settings || {});

    hydrateSettingsForm();
    renderBeanList();
    renderBeanSelect();
    renderRecipeHelper();

    setStatus('Ready.', 'success');
  } catch (error) {
    console.error(error);
    setStatus('Failed to load data from Apps Script.', 'error');
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function normalizeSettings(settings) {
  return {
    sheetUrl: settings.sheetUrl || '',
    scriptUrl: settings.scriptUrl || '',
    photoFolder: normalizeDriveFolderValue(settings.photoFolder || '')
  };
}

function hydrateSettingsForm() {
  const sheetUrlInput = document.getElementById('sheetUrl');
  const scriptUrlInput = document.getElementById('scriptUrl');
  const photoFolderInput = document.getElementById('photoFolder');

  if (sheetUrlInput) sheetUrlInput.value = appState.settings.sheetUrl || '';
  if (scriptUrlInput) scriptUrlInput.value = appState.settings.scriptUrl || '';
  if (photoFolderInput) photoFolderInput.value = appState.settings.photoFolder || '';

  updatePhotoFolderHint(appState.settings.photoFolder || '');
}

function updatePhotoFolderHint(value) {
  const hint = document.getElementById('photoFolderHint');
  if (!hint) return;

  const trimmed = String(value || '').trim();

  if (!trimmed) {
    hint.textContent = 'Paste a full Google Drive folder URL and it will auto-convert to the folder ID.';
    return;
  }

  const extracted = extractDriveFolderId(trimmed);

  if (extracted) {
    hint.textContent = `Folder ID ready: ${extracted}`;
  } else {
    hint.textContent = 'Could not detect a valid Google Drive folder ID yet.';
  }
}

async function onSaveSettings(event) {
  event.preventDefault();

  const sheetUrlInput = document.getElementById('sheetUrl');
  const scriptUrlInput = document.getElementById('scriptUrl');
  const photoFolderInput = document.getElementById('photoFolder');

  const cleanedPhotoFolder = normalizeDriveFolderValue(photoFolderInput ? photoFolderInput.value : '');

  if (photoFolderInput) {
    photoFolderInput.value = cleanedPhotoFolder;
  }

  const payload = {
    action: 'saveSettings',
    sheetUrl: sheetUrlInput ? sheetUrlInput.value.trim() : '',
    scriptUrl: scriptUrlInput ? scriptUrlInput.value.trim() : '',
    photoFolder: cleanedPhotoFolder
  };

  setStatus('Saving shared settings...', 'info');

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.status}`);
    }

    let result = {};
    try {
      result = await response.json();
    } catch (_) {}

    appState.settings = normalizeSettings({
      sheetUrl: payload.sheetUrl,
      scriptUrl: payload.scriptUrl,
      photoFolder: 
