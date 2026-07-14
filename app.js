const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYBxl1qUzFWUiPppkUFbTa_o56fhKx6PFZ-Xz3yoec4woUdalKYnd159LhoaLwq8t8Cw/exec';

const appState = {
  beans: [],
  settings: {
    sheetUrl: '',
    scriptUrl: '',
    photoFolder: ''
  },
  currentHelperBeanId: '',
  currentHelperMode: '',
  currentView: 'dashboard',
  addBeanPhoto: {
    file: null,
    base64: '',
    mimeType: '',
    fileName: '',
    photoUrl: '',
    photoDriveId: ''
  },
  generatedRecipes: null
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
  bindAddBeanModal();
}

function bindNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');

  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextView = button.getAttribute('data-view') || 'dashboard';
      appState.currentView = nextView;
      switchView(nextView);
    });
  });
}

function switchView(view) {
  const navButtons = document.querySelectorAll('.nav-btn');
  const viewTitle = document.getElementById('viewTitle');
  const nextView = view || 'dashboard';

  navButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === nextView);
  });

  document.querySelectorAll('.content > .panel').forEach((panel) => {
    panel.classList.add('hidden');
  });

  const activePanel = document.getElementById(`view-${nextView}`);
  if (activePanel) activePanel.classList.remove('hidden');

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
  if (settingsForm) settingsForm.addEventListener('submit', onSaveSettings);
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
      const bean = getBeanById(appState.currentHelperBeanId);
      appState.currentHelperMode = getDefaultModeForBean(bean);
      renderRecipeHelper();
    });
  }
}

function bindAddBeanModal() {
  const openBtn = document.getElementById('openAddBeanBtn');
  const closeBtn = document.getElementById('closeAddBeanBtn');
  const modal = document.getElementById('addBeanModal');
  const addBeanForm = document.getElementById('addBeanForm');
  const researchBtn = document.getElementById('researchBeanBtn');
  const generateBtn = document.getElementById('generateRecipeBtn');
  const beanPhoto = document.getElementById('beanPhoto');

  if (openBtn) openBtn.addEventListener('click', openAddBeanModal);
  if (closeBtn) closeBtn.addEventListener('click', closeAddBeanModal);

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target.matches('[data-close-add-bean="true"]')) {
        closeAddBeanModal();
      }
    });
  }

  if (beanPhoto) beanPhoto.addEventListener('change', onBeanPhotoChange);
  if (researchBtn) researchBtn.addEventListener('click', onResearchBean);
  if (generateBtn) generateBtn.addEventListener('click', onGenerateRecipe);
  if (addBeanForm) addBeanForm.addEventListener('submit', onSaveBean);
}

async function bootstrapApp() {
  setStatus('Loading app...', 'info');

  try {
    const [beansResponse, settingsResponse] = await Promise.all([
      fetchJson(`${APPS_SCRIPT_URL}?type=beans`),
      fetchJson(`${APPS_SCRIPT_URL}?type=settings`)
    ]);

    appState.beans = Array.isArray(beansResponse?.data) ? beansResponse.data : [];
    appState.settings = normalizeSettings(settingsResponse?.data || {});

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
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function postJson(payload) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`POST failed: ${response.status}`);

  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Request failed.');
  return result;
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
  hint.textContent = extracted
    ? `Folder ID ready: ${extracted}`
    : 'Could not detect a valid Google Drive folder ID yet.';
}

async function onSaveSettings(event) {
  event.preventDefault();

  const sheetUrlInput = document.getElementById('sheetUrl');
  const scriptUrlInput = document.getElementById('scriptUrl');
  const photoFolderInput = document.getElementById('photoFolder');

  const cleanedPhotoFolder = normalizeDriveFolderValue(photoFolderInput ? photoFolderInput.value : '');
  if (photoFolderInput) photoFolderInput.value = cleanedPhotoFolder;

  const payload = {
    action: 'saveSettings',
    sheetUrl: sheetUrlInput ? sheetUrlInput.value.trim() : '',
    scriptUrl: scriptUrlInput ? scriptUrlInput.value.trim() : '',
    photoFolder: cleanedPhotoFolder
  };

  setStatus('Saving shared settings...', 'info');

  try {
    const result = await postJson(payload);
    appState.settings = normalizeSettings(result?.data || payload);
    hydrateSettingsForm();
    setStatus('Shared settings saved for all devices.', 'success');
  } catch (error) {
    console.error(error);
    setStatus('Failed to save shared settings.', 'error');
  }
}

function renderBeanList() {
  const beanList = document.getElementById('beanList');
  if (!beanList) return;

  if (!appState.beans.length) {
    beanList.innerHTML = '<div class="bean-card">No beans found yet. Add your first bean.</div>';
    return;
  }

  beanList.innerHTML = appState.beans.map((bean) => {
    const title = escapeHtml(bean.name || bean.bean || 'Untitled Bean');
    const roaster = bean.roaster ? `<div class="bean-card__meta"><strong>Roaster:</strong> ${escapeHtml(bean.roaster)}</div>` : '';
    const origin = bean.origin ? `<div class="bean-card__origin">${formatOriginWithFlag(bean.origin)}</div>` : '';
    const process = bean.process ? `<div class="bean-card__meta"><strong>Process:</strong> ${escapeHtml(bean.process)}</div>` : '';
    const notes = bean.notes ? `<div class="bean-card__meta"><strong>Notes:</strong> ${escapeHtml(bean.notes)}</div>` : '';
    const image = bean.photo_url ? `<img class="bean-card__image" src="${escapeHtml(bean.photo_url)}" alt="${escapeHtml(title)} photo" loading="lazy" />` : '';
    const modes = renderBeanModesLine(bean);

    return `
      <div class="bean-card">
        <div class="bean-card__header">
          <div class="bean-card__title">${title}</div>
          ${origin}
        </div>
        ${roaster}
        ${process}
        ${notes}
        ${modes}
        ${image}
      </div>
    `;
  }).join('');
}

function renderBeanModesLine(bean) {
  const modes = Array.isArray(bean.recommended_modes) ? bean.recommended_modes : [];
  if (!modes.length) return '';

  const labels = modes.map((mode) => {
    if (mode === 'iced') return 'Iced / Summer';
    if (mode === 'hot') return 'Hot';
    return mode;
  }).join(', ');

  return `<div class="bean-card__meta"><strong>Recipes:</strong> ${escapeHtml(labels)}</div>`;
}

function renderBeanSelect() {
  const select = document.getElementById('helperBeanSelect');
  if (!select) return;

  const previousValue = appState.currentHelperBeanId || '';

  select.innerHTML = [
    '<option value="">Select bean</option>',
    ...appState.beans.map((bean) => {
      const id = bean.id || bean.name || bean.bean || '';
      const label = formatBeanLabel(bean);
      return `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`;
    })
  ].join('');

  const exists = appState.beans.some((bean) => String(bean.id || bean.name || bean.bean || '') === String(previousValue));
  appState.currentHelperBeanId = exists ? previousValue : '';
  select.value = appState.currentHelperBeanId;

  const selectedBean = getBeanById(appState.currentHelperBeanId);
  appState.currentHelperMode = getDefaultModeForBean(selectedBean);
}

function renderRecipeHelper() {
  const summary = document.getElementById('helperBeanSummary');
  const output = document.getElementById('helperOutput');
  const bean = getBeanById(appState.currentHelperBeanId);

  if (summary) {
    if (bean) {
      const parts = [`<strong>${escapeHtml(bean.name || bean.bean || 'Untitled Bean')}</strong>`];
      if (bean.roaster) parts.push(escapeHtml(bean.roaster));
      if (bean.origin) parts.push(formatOriginWithFlag(bean.origin));
      if (bean.process) parts.push(escapeHtml(bean.process));
      summary.innerHTML = parts.join(' · ');
    } else {
      summary.textContent = 'Select a bean to see its summary.';
    }
  }

  renderHelperModeToggle(bean);

  if (!output) return;

  if (!bean) {
    output.innerHTML = '<div class="helper-placeholder">Select a bean to view its saved recipe.</div>';
    return;
  }

  const recipe = getRecipeForMode(bean, appState.currentHelperMode);

  if (!recipe) {
    output.innerHTML = '<div class="helper-placeholder">No saved recipe for the selected mode.</div>';
    return;
  }

  output.innerHTML = renderRecipeCardHtml(recipe, bean.recipe_notes || '', appState.currentHelperMode);
}

function renderHelperModeToggle(bean) {
  const wrap = document.getElementById('helperModeToggleWrap');
  const container = document.getElementById('helperModeToggle');

  if (!wrap || !container) return;

  const modes = Array.isArray(bean?.recommended_modes) ? bean.recommended_modes : [];

  if (!modes.length) {
    wrap.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  wrap.classList.remove('hidden');

  container.innerHTML = modes.map((mode) => {
    const label = mode === 'iced' ? 'Iced / Summer' : 'Hot';
    const active = appState.currentHelperMode === mode ? 'active' : '';
    return `<button type="button" class="mode-pill ${active}" data-helper-mode="${escapeHtml(mode)}">${escapeHtml(label)}</button>`;
  }).join('');

  container.querySelectorAll('[data-helper-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.currentHelperMode = button.getAttribute('data-helper-mode') || '';
      renderRecipeHelper();
    });
  });
}

function getRecipeForMode(bean, mode) {
  if (!bean || !mode) return null;
  if (mode === 'hot') return bean.hot_recipe || null;
  if (mode === 'iced') return bean.iced_recipe || null;
  return null;
}

function getDefaultModeForBean(bean) {
  if (!bean) return '';
  const modes = Array.isArray(bean.recommended_modes) ? bean.recommended_modes : [];
  if (bean.default_mode && modes.includes(bean.default_mode)) return bean.default_mode;
  if (modes.includes('hot')) return 'hot';
  return modes[0] || '';
}

function renderRecipeCardHtml(recipe, notes, mode) {
  const noteLine = notes ? `<div class="recipe-note">${escapeHtml(notes)}</div>` : '';
  const iceLine = recipe.ice_g ? `<div class="helper-step"><strong>Ice</strong> — ${escapeHtml(String(recipe.ice_g))} g</div>` : '';
  const modeLabel = mode === 'iced' ? 'Iced / Summer' : 'Hot';

  return `
    ${noteLine}
    <div class="helper-grid">
      <div class="helper-metric">
        <div class="helper-metric__label">Mode</div>
        <div class="helper-metric__value">${escapeHtml(modeLabel)}</div>
      </div>
      <div class="helper-metric">
        <div class="helper-metric__label">Device</div>
        <div class="helper-metric__value">${escapeHtml(recipe.device || 'V60')}</div>
      </div>
      <div class="helper-metric">
        <div class="helper-metric__label">Dose</div>
        <div class="helper-metric__value">${escapeHtml(String(recipe.dose_g || ''))} g</div>
      </div>
      <div class="helper-metric">
        <div class="helper-metric__label">Water</div>
        <div class="helper-metric__value">${escapeHtml(String(recipe.water_g || ''))} g</div>
      </div>
      <div class="helper-metric">
        <div class="helper-metric__label">Temperature</div>
        <div class="helper-metric__value">${escapeHtml(String(recipe.temp_c || ''))} °C</div>
      </div>
      <div class="helper-metric">
        <div class="helper-metric__label">Target Time</div>
        <div class="helper-metric__value">${escapeHtml(String(recipe.target_time || ''))}</div>
      </div>
    </div>

    <div class="helper-steps">
      ${iceLine}
      ${recipe.grind ? `<div class="helper-step"><strong>Grind</strong> — ${escapeHtml(recipe.grind)}</div>` : ''}
      ${recipe.pours ? `<div class="helper-step"><strong>Pours</strong> — ${escapeHtml(recipe.pours)}</div>` : ''}
      ${recipe.recipe_style ? `<div class="helper-step"><strong>Style</strong> — ${escapeHtml(recipe.recipe_style)}</div>` : ''}
      ${recipe.taste_summary ? `<div class="helper-step"><strong>Taste Goal</strong> — ${escapeHtml(recipe.taste_summary)}</div>` : ''}
    </div>
  `;
}

function openAddBeanModal() {
  document.getElementById('addBeanModal')?.classList.remove('hidden');
}

function closeAddBeanModal() {
  document.getElementById('addBeanModal')?.classList.add('hidden');
}

async function onBeanPhotoChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const previewWrap = document.getElementById('beanPhotoPreviewWrap');
  const preview = document.getElementById('beanPhotoPreview');

  const dataUrl = await fileToDataUrl(file);
  const base64 = String(dataUrl).split(',')[1] || '';

  appState.addBeanPhoto = {
    file,
    base64,
    mimeType: file.type || 'image/jpeg',
    fileName: file.name || `bean-photo-${Date.now()}.jpg`,
    photoUrl: '',
    photoDriveId: ''
  };

  if (preview && previewWrap) {
    preview.src = dataUrl;
    previewWrap.classList.remove('hidden');
  }
}

async function ensurePhotoUploadedForBeanForm(beanData) {
  if (appState.addBeanPhoto.base64 && !appState.addBeanPhoto.photoUrl) {
    setStatus('Uploading bean photo...', 'info');

    const uploadResult = await postJson({
      action: 'uploadBeanPhoto',
      photoFolder: appState.settings.photoFolder,
      imageBase64: appState.addBeanPhoto.base64,
      mimeType: appState.addBeanPhoto.mimeType,
      fileName: appState.addBeanPhoto.fileName
    });

    const uploaded = uploadResult.data || {};
    appState.addBeanPhoto.photoUrl = uploaded.photoUrl || '';
    appState.addBeanPhoto.photoDriveId = uploaded.fileId || '';
  }

  beanData.photo_url = appState.addBeanPhoto.photoUrl || beanData.photo_url || '';
  beanData.photo_drive_id = appState.addBeanPhoto.photoDriveId || beanData.photo_drive_id || '';

  return beanData;
}

async function onResearchBean() {
  try {
    setStatus('Preparing bean research...', 'info');

    let beanData = collectBeanFormData();
    beanData = await ensurePhotoUploadedForBeanForm(beanData);

    setStatus('Researching bean details with AI...', 'info');

    const result = await postJson({
      action: 'researchBean',
      beanData
    });

    const researched = result.data || {};
    const bean = researched.bean || {};

    fillBeanForm(bean);
    appState.generatedRecipes = null;
    resetRecipeResultArea();

    const researchStatus = document.getElementById('researchStatus');
    if (researchStatus) {
      researchStatus.textContent = `Research complete via ${researched.provider || 'AI'} ${researched.model ? `(${researched.model})` : ''}. Review and edit the bean details before generating recipe.`;
    }

    setStatus('Bean research complete.', 'success');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Failed to research bean.', 'error');
  }
}

async function onGenerateRecipe() {
  try {
    let beanData = collectBeanFormData();
    beanData = await ensurePhotoUploadedForBeanForm(beanData);

    setStatus('Generating recipe options...', 'info');

    const result = await postJson({
      action: 'generateRecipe',
      beanData
    });

    appState.generatedRecipes = result.data || {};
    renderGeneratedRecipeResult();

    const notes = document.getElementById('recipeNotes');
    if (notes) {
      notes.textContent = appState.generatedRecipes.recommendation_notes || 'Recipe generation complete.';
    }

    setStatus('Recipe generation complete.', 'success');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Failed to generate recipe.', 'error');
  }
}

function renderGeneratedRecipeResult() {
  const wrap = document.getElementById('recipeModeToggleWrap');
  const toggle = document.getElementById('recipeModeToggle');
  const preview = document.getElementById('researchRecipePreview');

  if (!wrap || !toggle || !preview) return;

  const recipeData = appState.generatedRecipes;
  const modes = Array.isArray(recipeData?.recommended_modes) ? recipeData.recommended_modes : [];

  if (!modes.length) {
    wrap.classList.add('hidden');
    toggle.innerHTML = '';
    preview.innerHTML = '<div class="helper-placeholder">No valid recipe recommendation returned.</div>';
    return;
  }

  wrap.classList.remove('hidden');
  const defaultMode = recipeData.default_mode && modes.includes(recipeData.default_mode)
    ? recipeData.default_mode
    : (modes.includes('hot') ? 'hot' : modes[0]);

  appState.generatedRecipes.default_mode = defaultMode;

  toggle.innerHTML = modes.map((mode) => {
    const label = mode === 'iced' ? 'Iced / Summer' : 'Hot';
    const active = defaultMode === mode ? 'active' : '';
    return `<button type="button" class="mode-pill ${active}" data-generated-mode="${escapeHtml(mode)}">${escapeHtml(label)}</button>`;
  }).join('');

  const renderSelected = (mode) => {
    appState.generatedRecipes.default_mode = mode;
    toggle.querySelectorAll('[data-generated-mode]').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-generated-mode') === mode);
    });

    const recipe = mode === 'iced'
      ? appState.generatedRecipes.iced_recipe
      : appState.generatedRecipes.hot_recipe;

    preview.innerHTML = recipe
      ? renderRecipeCardHtml(recipe, appState.generatedRecipes.recommendation_notes || '', mode)
      : '<div class="helper-placeholder">No recipe available for this mode.</div>';
  };

  toggle.querySelectorAll('[data-generated-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      renderSelected(button.getAttribute('data-generated-mode') || '');
    });
  });

  renderSelected(defaultMode);
}

async function onSaveBean(event) {
  event.preventDefault();

  try {
    let beanData = collectBeanFormData();
    beanData = await ensurePhotoUploadedForBeanForm(beanData);

    if (!appState.generatedRecipes || !Array.isArray(appState.generatedRecipes.recommended_modes) || !appState.generatedRecipes.recommended_modes.length) {
      throw new Error('Please generate recipe first before saving the bean.');
    }

    beanData.source = 'app';
    beanData.research_status = 'researched';

    setStatus('Saving bean...', 'info');

    const result = await postJson({
      action: 'saveBean',
      beanData,
      recipeData: appState.generatedRecipes
    });

    const savedBean = result?.data?.bean;
    if (savedBean) {
      const existingIndex = appState.beans.findIndex((item) => String(item.id) === String(savedBean.id));
      if (existingIndex > -1) {
        appState.beans[existingIndex] = savedBean;
      } else {
        appState.beans.unshift(savedBean);
      }

      appState.currentHelperBeanId = savedBean.id;
      appState.currentHelperMode = getDefaultModeForBean(savedBean);

      renderBeanList();
      renderBeanSelect();
      renderRecipeHelper();
    }

    resetAddBeanForm();
    closeAddBeanModal();
    switchView('library');
    setStatus('Bean saved successfully.', 'success');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Failed to save bean.', 'error');
  }
}

function collectBeanFormData() {
  return {
    bean: document.getElementById('beanName')?.value.trim() || '',
    name: document.getElementById('beanName')?.value.trim() || '',
    roaster: document.getElementById('beanRoaster')?.value.trim() || '',
    origin_country: document.getElementById('beanOriginCountry')?.value.trim() || '',
    origin_region: document.getElementById('beanOriginRegion')?.value.trim() || '',
    purchase_country: document.getElementById('beanPurchaseCountry')?.value.trim() || '',
    purchase_city: document.getElementById('beanPurchaseCity')?.value.trim() || '',
    variety: document.getElementById('beanVariety')?.value.trim() || '',
    process: document.getElementById('beanProcess')?.value.trim() || '',
    roast: document.getElementById('beanRoast')?.value.trim() || '',
    notes: document.getElementById('beanNotes')?.value.trim() || '',
    initial_notes: document.getElementById('beanInitialNotes')?.value.trim() || '',
    photo_url: appState.addBeanPhoto.photoUrl || '',
    photo_drive_id: appState.addBeanPhoto.photoDriveId || ''
  };
}

function fillBeanForm(bean) {
  if (bean.bean) document.getElementById('beanName').value = bean.bean;
  if (bean.roaster) document.getElementById('beanRoaster').value = bean.roaster;
  if (bean.origin_country) document.getElementById('beanOriginCountry').value = bean.origin_country;
  if (bean.origin_region) document.getElementById('beanOriginRegion').value = bean.origin_region;
  if (bean.purchase_country) document.getElementById('beanPurchaseCountry').value = bean.purchase_country;
  if (bean.purchase_city) document.getElementById('beanPurchaseCity').value = bean.purchase_city;
  if (bean.variety) document.getElementById('beanVariety').value = bean.variety;
  if (bean.process) document.getElementById('beanProcess').value = bean.process;
  if (bean.roast) document.getElementById('beanRoast').value = bean.roast;
  if (bean.notes) document.getElementById('beanNotes').value = bean.notes;
  if (bean.initial_notes) document.getElementById('beanInitialNotes').value = bean.initial_notes;
}

function resetRecipeResultArea() {
  const notes = document.getElementById('recipeNotes');
  const wrap = document.getElementById('recipeModeToggleWrap');
  const toggle = document.getElementById('recipeModeToggle');
  const preview = document.getElementById('researchRecipePreview');

  if (notes) notes.textContent = 'No recipe generated yet.';
  if (wrap) wrap.classList.add('hidden');
  if (toggle) toggle.innerHTML = '';
  if (preview) preview.innerHTML = '<div class="helper-placeholder">Generate a recipe after confirming bean details.</div>';
}

function resetAddBeanForm() {
  const form = document.getElementById('addBeanForm');
  if (form) form.reset();

  appState.addBeanPhoto = {
    file: null,
    base64: '',
    mimeType: '',
    fileName: '',
    photoUrl: '',
    photoDriveId: ''
  };

  appState.generatedRecipes = null;

  const previewWrap = document.getElementById('beanPhotoPreviewWrap');
  const preview = document.getElementById('beanPhotoPreview');
  const researchStatus = document.getElementById('researchStatus');

  if (preview) preview.src = '';
  if (previewWrap) previewWrap.classList.add('hidden');
  if (researchStatus) researchStatus.textContent = 'No AI research yet.';

  resetRecipeResultArea();
}

function getBeanById(id) {
  return appState.beans.find(
    (bean) => String(bean.id || bean.name || bean.bean || '') === String(id || '')
  ) || null;
}

function formatBeanLabel(bean) {
  const name = bean.name || bean.bean || 'Untitled Bean';
  const roaster = bean.roaster ? ` — ${bean.roaster}` : '';
  const origin = bean.origin ? ` (${plainOriginWithFlag(bean.origin)})` : '';
  return `${name}${roaster}${origin}`;
}

function formatOriginWithFlag(origin) {
  if (!origin) return '';
  const code = inferCountryCode(origin);
  const flag = code ? countryCodeToFlag(code) : '';
  const text = escapeHtml(origin);
  return flag
    ? `<span class="origin-flag" aria-hidden="true">${flag}</span> <span>${text}</span>`
    : `<span>${text}</span>`;
}

function plainOriginWithFlag(origin) {
  if (!origin) return '';
  const code = inferCountryCode(origin);
  const flag = code ? countryCodeToFlag(code) : '';
  return flag ? `${flag} ${origin}` : origin;
}

function inferCountryCode(origin) {
  if (!origin) return '';

  const normalized = origin.trim().toLowerCase();
  const map = {
    ethiopia: 'ET',
    kenya: 'KE',
    rwanda: 'RW',
    burundi: 'BI',
    uganda: 'UG',
    tanzania: 'TZ',
    colombia: 'CO',
    brazil: 'BR',
    peru: 'PE',
    bolivia: 'BO',
    ecuador: 'EC',
    guatemala: 'GT',
    honduras: 'HN',
    'el salvador': 'SV',
    elsalvador: 'SV',
    nicaragua: 'NI',
    'costa rica': 'CR',
    costarica: 'CR',
    panama: 'PA',
    mexico: 'MX',
    indonesia: 'ID',
    sumatra: 'ID',
    java: 'ID',
    sulawesi: 'ID',
    bali: 'ID',
    yemen: 'YE',
    india: 'IN',
    vietnam: 'VN',
    laos: 'LA',
    thailand: 'TH',
    myanmar: 'MM',
    china: 'CN',
    taiwan: 'TW',
    japan: 'JP',
    philippines: 'PH',
    'papua new guinea': 'PG',
    papuanewguinea: 'PG',
    png: 'PG'
  };

  if (map[normalized]) return map[normalized];

  const compact = normalized.replace(/[^a-z]/g, '');
  if (map[compact]) return map[compact];

  for (const key of Object.keys(map)) {
    if (normalized.includes(key)) return map[key];
  }

  return '';
}

function countryCodeToFlag(code) {
  const cc = String(code || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return '';
  return String.fromCodePoint(...[...cc].map((char) => char.charCodeAt(0) + 127397));
}

function normalizeDriveFolderValue(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const extracted = extractDriveFolderId(trimmed);
  return extracted || trimmed;
}

function extractDriveFolderId(value) {
  const input = String(value || '').trim();
  if (!input) return '';

  if (/^[a-zA-Z0-9_-]{15,}$/.test(input)) return input;

  const folderMatch = input.match(/\/folders\/([a-zA-Z0-9_-]{15,})/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  const genericMatch = input.match(/([a-zA-Z0-9_-]{15,})/);
  if (genericMatch && genericMatch[1]) return genericMatch[1];

  return '';
}

function setStatus(message, type = 'info') {
  const el = document.getElementById('appStatus');
  if (!el) return;
  el.textContent = message;
  el.dataset.status = type;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
