const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMNB7D2p_qCWhvTulP9GY274aSkJPxr-7l8YGkVFj3hPYlISysdNfAw0ndFYNNII4-gw/exec';

const COUNTRY_OPTIONS = [
  "Afghanistan","Åland Islands","Albania","Algeria","American Samoa","Andorra","Angola","Anguilla","Antarctica","Antigua and Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan",
  "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bonaire, Sint Eustatius and Saba","Bosnia and Herzegovina","Botswana","Bouvet Island","Brazil","British Indian Ocean Territory","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi",
  "Cabo Verde","Cambodia","Cameroon","Canada","Cayman Islands","Central African Republic","Chad","Chile","China","Christmas Island","Cocos (Keeling) Islands","Colombia","Comoros","Congo","Congo, Democratic Republic of the","Cook Islands","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Curaçao","Cyprus","Czechia",
  "Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Falkland Islands (Malvinas)","Faroe Islands","Fiji","Finland","France","French Guiana","French Polynesia","French Southern Territories",
  "Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guadeloupe","Guam","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Heard Island and McDonald Islands","Holy See","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan",
  "Kazakhstan","Kenya","Kiribati","Korea, Democratic People's Republic of","Korea, Republic of","Kuwait","Kyrgyzstan","Lao People's Democratic Republic","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
  "Macao","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Martinique","Mauritania","Mauritius","Mayotte","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar",
  "Namibia","Nauru","Nepal","Netherlands","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","Niue","Norfolk Island","North Macedonia","Northern Mariana Islands","Norway","Oman",
  "Pakistan","Palau","Palestine, State of","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Pitcairn","Poland","Portugal","Puerto Rico","Qatar","Réunion","Romania","Russian Federation","Rwanda",
  "Saint Barthélemy","Saint Helena, Ascension and Tristan da Cunha","Saint Kitts and Nevis","Saint Lucia","Saint Martin (French part)","Saint Pierre and Miquelon","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Sint Maarten (Dutch part)","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Georgia and the South Sandwich Islands","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Svalbard and Jan Mayen","Sweden","Switzerland","Syrian Arab Republic",
  "Taiwan, Province of China","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tokelau","Tonga","Trinidad and Tobago","Tunisia","Türkiye","Turkmenistan","Turks and Caicos Islands","Tuvalu",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States Minor Outlying Islands","United States of America","Uruguay","Uzbekistan","Vanuatu","Venezuela","Viet Nam","Virgin Islands (British)","Virgin Islands (U.S.)","Wallis and Futuna","Western Sahara","Yemen","Zambia","Zimbabwe"
];

const appState = {
  beans: [],
  settings: { sheetUrl: '', scriptUrl: '', photoFolder: '' },
  currentView: 'library',
  draftTags: [],
  selectedLibraryTag: '',
  librarySearchTerm: '',
  expandedBeans: {},
  uploadedPhoto: {
    fileId: '',
    fileName: '',
    driveLink: '',
    previewDataUrl: '',
    photoText: '',
    ocrStatus: 'not_run'
  },
  recipeResult: null,
  recipeStyle: 'hot',
  modalMode: 'create',
  editingBeanId: ''
};

document.addEventListener('DOMContentLoaded', async () => {
  bindEvents();
  hydrateCountryDatalist();
  switchView('library');
  await bootstrapApp();
});

function bindEvents() {
  bindNavigation();
  bindSettingsForm();
  bindPhotoFolderField();
  bindAddBeanModal();
  bindLibrarySearch();
  bindHelper();
  bindGlobalFormProtection();
}

function bindGlobalFormProtection() {
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id === 'settings-form' || form.id === 'addBeanForm') return;
    event.preventDefault();
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (!button.hasAttribute('type')) button.setAttribute('type', 'button');
  });
}

function bindNavigation() {
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const targetView = button.getAttribute('data-view');
      if (!targetView) return;
      event.preventDefault();
      switchView(targetView);
    });
  });
}

function switchView(view) {
  appState.currentView = view || 'library';

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === appState.currentView);
  });

  document.querySelectorAll('.content > .panel').forEach((panel) => {
    panel.classList.add('hidden');
  });

  const activePanel = document.getElementById(`view-${appState.currentView}`);
  if (activePanel) activePanel.classList.remove('hidden');

  const viewTitle = document.getElementById('viewTitle');
  if (viewTitle) {
    const titles = { library: 'Bean Library', helper: 'Recipe Helper', settings: 'Settings' };
    viewTitle.textContent = titles[appState.currentView] || 'Bean Library';
  }
}

async function bootstrapApp() {
  try {
    setAppStatus('Loading settings and beans…', 'info');
    await loadSettings();
    await loadBeans();
    setAppStatus('App ready.', 'success');
  } catch (error) {
    console.error(error);
    setAppStatus(error.message || 'Failed to load app.', 'error');
  }
}

async function loadSettings() {
  try {
    const response = await fetchJson(`${resolveScriptUrl()}?type=settings`);
    const data = response.data || {};

    appState.settings = {
      sheetUrl: data.sheetUrl || '',
      scriptUrl: data.scriptUrl || '',
      photoFolder: data.photoFolder || ''
    };
  } catch (error) {
    console.warn('Settings load failed, using defaults.', error);
    appState.settings = {
      sheetUrl: '',
      scriptUrl: APPS_SCRIPT_URL,
      photoFolder: ''
    };
  }

  setValue('sheetUrl', appState.settings.sheetUrl);
  setValue('scriptUrl', appState.settings.scriptUrl || APPS_SCRIPT_URL);
  setValue('photoFolder', appState.settings.photoFolder);
  updatePhotoFolderHint(appState.settings.photoFolder);
}

async function loadBeans() {
  try {
    const response = await fetchJson(`${resolveScriptUrl()}?type=beans`);
    appState.beans = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.warn('Bean load failed.', error);
    appState.beans = [];
  }

  renderBeanList();
  renderTagFilters();
  renderHelperBeanOptions();
}

function bindSettingsForm() {
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) settingsForm.addEventListener('submit', onSaveSettings);
}

async function onSaveSettings(event) {
  event.preventDefault();

  const payload = {
    action: 'saveSettings',
    sheetUrl: getValue('sheetUrl'),
    scriptUrl: getValue('scriptUrl'),
    photoFolder: getValue('photoFolder')
  };

  const response = await fetchJson(resolveScriptUrl(), {
    method: 'POST',
    body: payload
  });

  appState.settings = response.data || appState.settings;
  setValue('scriptUrl', appState.settings.scriptUrl || APPS_SCRIPT_URL);
  updatePhotoFolderHint(appState.settings.photoFolder || '');
  setAppStatus('Settings saved.', 'success');
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

  photoFolderInput.addEventListener('change', () => {
    const cleaned = normalizeDriveFolderValue(photoFolderInput.value);
    photoFolderInput.value = cleaned;
    updatePhotoFolderHint(cleaned);
  });
}

function updatePhotoFolderHint(value) {
  const hint = document.getElementById('photoFolderHint');
  if (!hint) return;
  hint.textContent = value
    ? `Using folder ID: ${value}`
    : 'Paste a full Google Drive folder URL and it will auto-convert to the folder ID.';
}

function normalizeDriveFolderValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const match = raw.match(/\/folders\/([a-zA-Z0-9_-]{15,})/);
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9_-]{15,}$/.test(raw)) return raw;
  const generic = raw.match(/([a-zA-Z0-9_-]{15,})/);
  return generic && generic[1] ? generic[1] : raw;
}

function bindLibrarySearch() {
  const searchInput = document.getElementById('beanSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    appState.librarySearchTerm = String(searchInput.value || '').trim().toLowerCase();
    renderBeanList();
    renderTagFilters();
  });
}

function bindHelper() {
  const helperBeanSelect = document.getElementById('helperBeanSelect');
  const generateRecipeBtn = document.getElementById('generateRecipeBtn');

  if (helperBeanSelect) {
    helperBeanSelect.addEventListener('change', () => {
      const id = helperBeanSelect.value;
      const bean = appState.beans.find((item) => item.id === id) || null;
      renderHelperBeanSummary(bean);
      clearRecipeOutput();
    });
  }

  if (generateRecipeBtn) {
    generateRecipeBtn.addEventListener('click', onGenerateRecipe);
  }
}

async function onGenerateRecipe() {
  const beanId = getValue('helperBeanSelect');
  if (!beanId) {
    setRecipeStatus('Select a bean first.', true);
    return;
  }

  const bean = appState.beans.find((item) => item.id === beanId);
  if (!bean) {
    setRecipeStatus('Selected bean not found.', true);
    return;
  }

  setRecipeStatus('Generating recipe…');

  try {
    const response = await fetchJson(resolveScriptUrl(), {
      method: 'POST',
      body: {
        action: 'generateRecipe',
        beanData: bean
      }
    });

    appState.recipeResult = response.data || null;
    appState.recipeStyle = (appState.recipeResult && appState.recipeResult.defaultStyle) || 'hot';
    renderRecipeRecommendation();
    setRecipeStatus('Recipe generated.');
  } catch (error) {
    console.error(error);
    setRecipeStatus(error.message || 'Failed to generate recipe.', true);
  }
}

function renderRecipeRecommendation() {
  const output = document.getElementById('helperOutput');
  const toggle = document.getElementById('recipeStyleToggle');
  if (!output || !toggle) return;

  const result = appState.recipeResult;
  if (!result || !result.recipes) {
    clearRecipeOutput();
    return;
  }

  const styles = Array.isArray(result.availableStyles) ? result.availableStyles : ['hot'];
  const activeStyle = appState.recipeStyle && styles.includes(appState.recipeStyle) ? appState.recipeStyle : styles[0];
  appState.recipeStyle = activeStyle;

  if (styles.length > 1) {
    toggle.classList.remove('hidden');
    toggle.innerHTML = styles.map((style) => {
      const label = style === 'iced_half_shaken' ? 'Iced (half shaken)' : 'Hot';
      return `<button type="button" class="recipe-style-btn ${style === activeStyle ? 'active' : ''}" data-style="${escapeHtml(style)}">${escapeHtml(label)}</button>`;
    }).join('');

    toggle.querySelectorAll('[data-style]').forEach((button) => {
      button.addEventListener('click', () => {
        appState.recipeStyle = button.getAttribute('data-style') || 'hot';
        renderRecipeRecommendation();
      });
    });
  } else {
    toggle.classList.add('hidden');
    toggle.innerHTML = '';
  }

  const recipe = result.recipes[activeStyle];
  if (!recipe) {
    output.innerHTML = `<div class="helper-placeholder">No recipe available for this style.</div>`;
    return;
  }

  const metrics = buildRecipeMetrics(recipe);

  output.innerHTML = `
    <div class="recipe-block">
      <div class="recipe-why"><strong>${escapeHtml(recipe.label || 'Recipe')}:</strong> ${escapeHtml(recipe.why || '')}</div>
      <div class="recipe-metrics">
        ${metrics.map((metric) => `
          <div class="recipe-metric">
            <div class="recipe-metric__label">${escapeHtml(metric.label)}</div>
            <div class="recipe-metric__value">${escapeHtml(metric.value)}</div>
          </div>
        `).join('')}
      </div>
      <div class="recipe-section">
        <h3>Pours</h3>
        <div class="recipe-list">
          ${(recipe.pours || []).map((step) => `<div class="recipe-step">${escapeHtml(step)}</div>`).join('')}
        </div>
      </div>
      <div class="recipe-section">
        <h3>Expected notes</h3>
        <div class="recipe-step">${escapeHtml(recipe.expected_notes || '—')}</div>
      </div>
    </div>
  `;
}

function buildRecipeMetrics(recipe) {
  const metrics = [
    { label: 'Grind', value: recipe.grind || '—' },
    { label: 'Dose', value: recipe.dose_g ? `${recipe.dose_g} g` : '—' },
    { label: 'Temp', value: recipe.water_temp_c ? `${recipe.water_temp_c}°C` : '—' },
    { label: 'Time', value: recipe.target_time || '—' },
    { label: 'Ratio', value: recipe.ratio || '—' },
    { label: 'Water', value: recipe.water_total_g ? `${recipe.water_total_g} g total` : '—' }
  ];

  if (recipe.hot_water_g || recipe.brew_ice_g) {
    metrics.push({ label: 'Split', value: `${recipe.hot_water_g || 0} g hot / ${recipe.brew_ice_g || 0} g ice` });
  }

  return metrics;
}

function clearRecipeOutput() {
  appState.recipeResult = null;
  appState.recipeStyle = 'hot';

  const output = document.getElementById('helperOutput');
  const toggle = document.getElementById('recipeStyleToggle');

  if (toggle) {
    toggle.classList.add('hidden');
    toggle.innerHTML = '';
  }

  if (output) {
    output.innerHTML = `<div class="helper-placeholder">Generate a recipe to see grind size, pours, time, and expected notes.</div>`;
  }
}

function setRecipeStatus(message, isError = false) {
  const el = document.getElementById('recipeStatus');
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? '#991b1b' : '';
}

function renderHelperBeanOptions() {
  const select = document.getElementById('helperBeanSelect');
  if (!select) return;

  const currentValue = select.value;
  select.innerHTML = `<option value="">Select bean</option>` + appState.beans.map((bean) => {
    const label = [bean.bean || bean.name, bean.roaster].filter(Boolean).join(' — ');
    return `<option value="${escapeHtml(bean.id)}">${escapeHtml(label || 'Untitled Bean')}</option>`;
  }).join('');

  if (appState.beans.some((bean) => bean.id === currentValue)) {
    select.value = currentValue;
  }
}

function renderHelperBeanSummary(bean) {
  const el = document.getElementById('helperBeanSummary');
  if (!el) return;

  if (!bean) {
    el.textContent = 'Select a bean to see its summary.';
    return;
  }

  const origin = bean.origin || [bean.origin_country, bean.origin_region].filter(Boolean).join(' · ');
  const tags = Array.isArray(bean.tags) ? bean.tags.join(', ') : '';

  el.innerHTML = `
    <div><strong>${escapeHtml(bean.bean || bean.name || 'Untitled Bean')}</strong></div>
    <div>${escapeHtml(bean.roaster || 'Unknown roaster')}</div>
    <div>${escapeHtml(origin || 'Origin not set')}</div>
    <div>${escapeHtml(bean.process || 'Process unknown')} · ${escapeHtml(bean.roast || 'Roast unknown')}</div>
    <div>${escapeHtml(tags || 'No tags')}</div>
  `;
}

function renderBeanList() {
  const list = document.getElementById('beanList');
  if (!list) return;

  const beans = getFilteredBeans();
  if (!beans.length) {
    list.innerHTML = `<div class="helper-placeholder">No beans found.</div>`;
    return;
  }

  list.innerHTML = beans.map((bean) => {
    const isOpen = !!appState.expandedBeans[bean.id];
    const country = bean.origin_country || 'Unknown';
    const detailsId = `bean-details-${bean.id}`;
    const notes = bean.notes || 'No notes';
    const roast = bean.roast || '—';

    return `
      <details class="bean-library-item" ${isOpen ? 'open' : ''} data-bean-id="${escapeHtml(bean.id)}">
        <summary class="bean-summary-btn" aria-controls="${escapeHtml(detailsId)}">
          <div class="bean-summary-grid">
            <div class="bean-summary-cell name-cell">
              <div class="bean-summary-label">Name</div>
              <div class="bean-summary-value bean-summary-name">${escapeHtml(bean.bean || bean.name || 'Untitled Bean')}</div>
            </div>
            <div class="bean-summary-cell">
              <div class="bean-summary-label">Country</div>
              <div class="bean-summary-value">${escapeHtml(country)}</div>
            </div>
            <div class="bean-summary-cell">
              <div class="bean-summary-label">Roaster</div>
              <div class="bean-summary-value">${escapeHtml(bean.roaster || '—')}</div>
            </div>
            <div class="bean-summary-cell roast-cell">
              <div class="bean-summary-label">Roast</div>
              <div class="bean-summary-value">${escapeHtml(roast)}</div>
            </div>
            <div class="bean-summary-cell notes-cell">
              <div class="bean-summary-label">Notes</div>
              <div class="bean-summary-value">${escapeHtml(notes)}</div>
            </div>
            <div class="expand-icon" aria-hidden="true">⌄</div>
          </div>
        </summary>

        <div class="bean-details" id="${escapeHtml(detailsId)}">
          <div class="bean-detail-grid">
            ${renderDetailCell('Origin', bean.origin || '—')}
            ${renderDetailCell('Region', bean.origin_region || '—')}
            ${renderDetailCell('Process', bean.process || '—')}
            ${renderDetailCell('Roast', bean.roast || '—')}
            ${renderDetailCell('Variety', bean.variety || '—')}
            ${renderDetailCell('Altitude', bean.altitude || '—')}
            ${renderDetailCell('Producer', bean.producer || '—')}
            ${renderDetailCell('Farm', bean.farm || '—')}
            ${renderDetailCell('Purchased in', bean.purchase_country || '—')}
            ${renderDetailCell('Tags', (bean.tags || []).join(', ') || '—')}
          </div>

          <div class="bean-notes-block">
            <div class="bean-detail-title">Full notes</div>
            <div class="bean-detail-card">${escapeHtml(bean.notes || 'No notes saved.')}</div>
          </div>

          <div class="bean-details-actions">
            <button type="button" class="open-helper-btn" data-bean-id="${escapeHtml(bean.id)}">Open in Recipe Helper</button>
            <button type="button" class="edit-bean-btn" data-bean-id="${escapeHtml(bean.id)}">Edit bean</button>
            <button type="button" class="delete-bean-btn btn-danger" data-bean-id="${escapeHtml(bean.id)}">Delete bean</button>
          </div>
        </div>
      </details>
    `;
  }).join('');

  bindBeanLibraryInteractions();
}

function renderDetailCell(label, value) {
  return `
    <div class="bean-detail-card">
      <div class="bean-detail-title">${escapeHtml(label)}</div>
      <div class="bean-detail-value">${escapeHtml(value)}</div>
    </div>
  `;
}

function bindBeanLibraryInteractions() {
  document.querySelectorAll('.bean-library-item').forEach((details) => {
    details.addEventListener('toggle', () => {
      const beanId = details.getAttribute('data-bean-id') || '';
      appState.expandedBeans[beanId] = details.open;
    });
  });

  document.querySelectorAll('.open-helper-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const beanId = button.getAttribute('data-bean-id') || '';
      switchView('helper');
      setValue('helperBeanSelect', beanId);
      const bean = appState.beans.find((item) => item.id === beanId) || null;
      renderHelperBeanSummary(bean);
      clearRecipeOutput();
    });
  });

  document.querySelectorAll('.edit-bean-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const beanId = button.getAttribute('data-bean-id') || '';
      const bean = appState.beans.find((item) => item.id === beanId);
      if (bean) openEditBeanModal(bean);
    });
  });

  document.querySelectorAll('.delete-bean-btn').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const beanId = button.getAttribute('data-bean-id') || '';
      const bean = appState.beans.find((item) => item.id === beanId);
      if (!bean) return;

      const confirmed = window.confirm(`Delete "${bean.bean || bean.name || 'this bean'}"? This cannot be undone.`);
      if (!confirmed) return;

      try {
        await fetchJson(resolveScriptUrl(), {
          method: 'POST',
          body: {
            action: 'deleteBean',
            beanId
          }
        });

        delete appState.expandedBeans[beanId];
        if (getValue('helperBeanSelect') === beanId) {
          setValue('helperBeanSelect', '');
          renderHelperBeanSummary(null);
          clearRecipeOutput();
        }

        await loadBeans();
        setAppStatus('Bean deleted.', 'success');
      } catch (error) {
        console.error(error);
        setAppStatus(error.message || 'Failed to delete bean.', 'error');
      }
    });
  });
}

function getFilteredBeans() {
  let beans = [...appState.beans];

  if (appState.selectedLibraryTag) {
    beans = beans.filter((bean) => Array.isArray(bean.tags) && bean.tags.includes(appState.selectedLibraryTag));
  }

  if (appState.librarySearchTerm) {
    beans = beans.filter((bean) => {
      const haystack = [
        bean.bean, bean.name, bean.roaster, bean.origin_country, bean.origin_region,
        bean.notes, bean.tags_text, bean.process, bean.variety, bean.roast
      ].join(' ').toLowerCase();

      return haystack.includes(appState.librarySearchTerm);
    });
  }

  return beans;
}

function renderTagFilters() {
  const bar = document.getElementById('tagFilterBar');
  if (!bar) return;

  const counts = new Map();
  getFilteredBeansForCounts().forEach((bean) => {
    (bean.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });

  const tags = Array.from(counts.keys()).sort();
  const chips = [
    `<button type="button" class="tag-filter-chip ${appState.selectedLibraryTag ? '' : 'active'}" data-tag="">All</button>`
  ].concat(tags.map((tag) => {
    const active = appState.selectedLibraryTag === tag ? 'active' : '';
    return `<button type="button" class="tag-filter-chip ${active}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)} <span class="tag-filter-count">${counts.get(tag)}</span></button>`;
  }));

  bar.innerHTML = chips.join('');
  bar.querySelectorAll('[data-tag]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.selectedLibraryTag = button.getAttribute('data-tag') || '';
      renderBeanList();
      renderTagFilters();
    });
  });
}

function getFilteredBeansForCounts() {
  if (!appState.librarySearchTerm) return appState.beans;

  return appState.beans.filter((bean) => {
    const haystack = [
      bean.bean, bean.name, bean.roaster, bean.origin_country, bean.origin_region,
      bean.notes, bean.tags_text, bean.process, bean.variety, bean.roast
    ].join(' ').toLowerCase();

    return haystack.includes(appState.librarySearchTerm);
  });
}

function bindAddBeanModal() {
  const openBtn = document.getElementById('openAddBeanBtn');
  const closeBtn = document.getElementById('closeAddBeanBtn');
  const modal = document.getElementById('addBeanModal');
  const uploadBtn = document.getElementById('uploadPhotoBtn');
  const researchBtn = document.getElementById('researchBeanBtn');
  const addBeanForm = document.getElementById('addBeanForm');
  const tagInput = document.getElementById('beanTagInput');

  if (openBtn) openBtn.addEventListener('click', () => openCreateBeanModal());
  if (closeBtn) closeBtn.addEventListener('click', closeAddBeanModal);

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target && event.target.getAttribute('data-close-add-bean') === 'true') {
        closeAddBeanModal();
      }
    });
  }

  if (uploadBtn) uploadBtn.addEventListener('click', onUploadPhoto);
  if (researchBtn) researchBtn.addEventListener('click', onResearchBean);
  if (addBeanForm) addBeanForm.addEventListener('submit', onSaveBean);

  if (tagInput) {
    tagInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        addDraftTag(tagInput.value);
        tagInput.value = '';
      }
    });

    tagInput.addEventListener('blur', () => {
      if (tagInput.value.trim()) {
        addDraftTag(tagInput.value);
        tagInput.value = '';
      }
    });
  }
}

function openCreateBeanModal() {
  appState.modalMode = 'create';
  appState.editingBeanId = '';
  resetBeanForm();

  setText('addBeanTitle', 'Add Bean');
  setText('addBeanSubtitle', 'Upload a photo, research the bean, then save.');
  setText('saveBeanBtn', 'Save bean');

  const modal = document.getElementById('addBeanModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function openEditBeanModal(bean) {
  appState.modalMode = 'edit';
  appState.editingBeanId = bean.id || '';
  resetBeanForm();

  setText('addBeanTitle', 'Edit Bean');
  setText('addBeanSubtitle', 'Update the bean details, then save changes.');
  setText('saveBeanBtn', 'Save changes');

  setValue('beanId', bean.id || '');
  setValue('beanName', bean.bean || bean.name || '');
  setValue('beanRoaster', bean.roaster || '');
  setValue('beanOriginCountry', bean.origin_country || '');
  setValue('beanOriginRegion', bean.origin_region || '');
  setValue('beanPurchaseCountry', bean.purchase_country || '');
  setValue('beanVariety', bean.variety || '');
  setValue('beanProducer', bean.producer || '');
  setValue('beanFarm', bean.farm || '');
  setValue('beanAltitude', bean.altitude || '');
  setValue('beanProcess', bean.process || '');
  setValue('beanRoast', bean.roast || '');
  setValue('beanNotes', bean.notes || '');
  setValue('beanPhotoText', bean.photo_text || '');

  setValue('beanExistingPhotoFileId', bean.photo_file_id || '');
  setValue('beanExistingPhotoFileName', bean.photo_file_name || '');
  setValue('beanExistingPhotoDriveLink', bean.photo_drive_link || '');
  setValue('beanExistingPhotoPreviewDataUrl', bean.photo_preview_data_url || '');

  appState.draftTags = Array.isArray(bean.tags) ? bean.tags.slice() : [];
  renderDraftTags();

  appState.uploadedPhoto = {
    fileId: bean.photo_file_id || '',
    fileName: bean.photo_file_name || '',
    driveLink: bean.photo_drive_link || '',
    previewDataUrl: bean.photo_preview_data_url || '',
    photoText: bean.photo_text || '',
    ocrStatus: bean.photo_file_id ? 'ok' : 'not_run'
  };

  renderPhotoPreview();
  updatePhotoMeta();
  setOcrStatus(bean.photo_file_id ? 'OCR: existing photo loaded' : 'OCR: not run yet', bean.photo_file_id ? 'success' : 'neutral');
  setResearchStatus('You can update the bean details or run Research Bean again.');

  const modal = document.getElementById('addBeanModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeAddBeanModal() {
  const modal = document.getElementById('addBeanModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function resetBeanForm() {
  [
    'beanId','beanName','beanRoaster','beanOriginCountry','beanOriginRegion','beanPurchaseCountry',
    'beanVariety','beanProducer','beanFarm','beanAltitude','beanProcess','beanRoast','beanNotes',
    'beanPhotoText','beanExistingPhotoFileId','beanExistingPhotoFileName','beanExistingPhotoDriveLink',
    'beanExistingPhotoPreviewDataUrl'
  ].forEach((id) => setValue(id, ''));

  const fileInput = document.getElementById('beanPhotoFile');
  if (fileInput) fileInput.value = '';

  appState.draftTags = [];
  appState.uploadedPhoto = {
    fileId: '',
    fileName: '',
    driveLink: '',
    previewDataUrl: '',
    photoText: '',
    ocrStatus: 'not_run'
  };

  renderDraftTags();
  renderPhotoPreview();
  updatePhotoMeta();
  setResearchStatus('Upload a bean photo first, then run Research Bean to use OCR text and metadata.');
  setOcrStatus('OCR: not run yet', 'neutral');
}

async function onUploadPhoto() {
  const fileInput = document.getElementById('beanPhotoFile');
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  if (!file) {
    setOcrStatus('OCR: no file selected', 'warning');
    return;
  }

  try {
    const base64 = await readFileAsDataUrl(file);

    const response = await fetchJson(resolveScriptUrl(), {
      method: 'POST',
      body: {
        action: 'uploadBeanPhoto',
        fileName: file.name,
        mimeType: file.type || 'image/jpeg',
        base64,
        previewDataUrl: base64
      }
    });

    const data = response.data || {};
    appState.uploadedPhoto = {
      fileId: data.fileId || '',
      fileName: data.fileName || file.name,
      driveLink: data.driveLink || '',
      previewDataUrl: data.previewDataUrl || base64,
      photoText: data.photoText || '',
      ocrStatus: data.ocrStatus || 'unknown'
    };

    setValue('beanPhotoText', appState.uploadedPhoto.photoText || '');
    renderPhotoPreview();
    updatePhotoMeta();
    setOcrStatus(`OCR: ${formatOcrStatus(appState.uploadedPhoto.ocrStatus)}`, appState.uploadedPhoto.ocrStatus === 'ok' ? 'success' : 'warning');
    setResearchStatus('Photo uploaded. OCR text is ready; run Research Bean to draft fields.');
  } catch (error) {
    console.error(error);
    setOcrStatus(`OCR: ${error.message || 'upload failed'}`, 'error');
  }
}

async function onResearchBean() {
  const beanData = collectBeanFormData();

  try {
    const response = await fetchJson(resolveScriptUrl(), {
      method: 'POST',
      body: {
        action: 'researchBean',
        beanData
      }
    });

    const bean = response.data && response.data.bean ? response.data.bean : null;
    if (!bean) {
      setResearchStatus('Research returned no bean data.', true);
      return;
    }

    applyBeanDataToForm(bean);
    setResearchStatus('Research applied. Review the autofilled fields before saving.');
  } catch (error) {
    console.error(error);
    setResearchStatus(error.message || 'Research failed.', true);
  }
}

async function onSaveBean(event) {
  event.preventDefault();
  const beanData = collectBeanFormData();
  const action = appState.modalMode === 'edit' ? 'updateBean' : 'saveBean';

  try {
    const response = await fetchJson(resolveScriptUrl(), {
      method: 'POST',
      body: {
        action,
        beanData
      }
    });

    const saved = response.data && response.data.bean ? response.data.bean : null;
    if (saved) {
      await loadBeans();
      closeAddBeanModal();
      setAppStatus(appState.modalMode === 'edit' ? 'Bean updated.' : 'Bean saved.', 'success');

      if (getValue('helperBeanSelect') === saved.id) {
        const refreshed = appState.beans.find((item) => item.id === saved.id) || saved;
        renderHelperBeanSummary(refreshed);
      }
    }
  } catch (error) {
    console.error(error);
    setAppStatus(error.message || 'Failed to save bean.', 'error');
  }
}

function collectBeanFormData() {
  const existingPhoto = {
    fileId: getValue('beanExistingPhotoFileId'),
    fileName: getValue('beanExistingPhotoFileName'),
    driveLink: getValue('beanExistingPhotoDriveLink'),
    previewDataUrl: getValue('beanExistingPhotoPreviewDataUrl')
  };

  const finalPhoto = appState.uploadedPhoto.fileId
    ? appState.uploadedPhoto
    : {
        fileId: existingPhoto.fileId,
        fileName: existingPhoto.fileName,
        driveLink: existingPhoto.driveLink,
        previewDataUrl: existingPhoto.previewDataUrl,
        photoText: getValue('beanPhotoText'),
        ocrStatus: existingPhoto.fileId ? 'ok' : 'not_run'
      };

  return {
    id: getValue('beanId') || appState.editingBeanId || '',
    bean: getValue('beanName'),
    name: getValue('beanName'),
    roaster: getValue('beanRoaster'),
    origin_country: getValue('beanOriginCountry'),
    origin_region: getValue('beanOriginRegion'),
    purchase_country: getValue('beanPurchaseCountry'),
    variety: getValue('beanVariety'),
    producer: getValue('beanProducer'),
    farm: getValue('beanFarm'),
    altitude: getValue('beanAltitude'),
    process: getValue('beanProcess'),
    roast: getValue('beanRoast'),
    notes: getValue('beanNotes'),
    tags: [...appState.draftTags],
    photo_file_id: finalPhoto.fileId || '',
    photo_file_name: finalPhoto.fileName || '',
    photo_drive_link: finalPhoto.driveLink || '',
    photo_preview_data_url: finalPhoto.previewDataUrl || '',
    photo_text: getValue('beanPhotoText')
  };
}

function applyBeanDataToForm(bean) {
  setValue('beanName', bean.bean || bean.name || '');
  setValue('beanRoaster', bean.roaster || '');
  setValue('beanOriginCountry', bean.origin_country || '');
  setValue('beanOriginRegion', bean.origin_region || '');
  setValue('beanPurchaseCountry', bean.purchase_country || '');
  setValue('beanVariety', bean.variety || '');
  setValue('beanProducer', bean.producer || '');
  setValue('beanFarm', bean.farm || '');
  setValue('beanAltitude', bean.altitude || '');
  setValue('beanProcess', bean.process || '');
  setValue('beanRoast', bean.roast || '');
  setValue('beanNotes', bean.notes || '');
  setValue('beanPhotoText', bean.photo_text || getValue('beanPhotoText'));

  appState.draftTags = Array.isArray(bean.tags) ? bean.tags.slice() : [];
  renderDraftTags();
}

function addDraftTag(value) {
  const cleaned = String(value || '').trim().toLowerCase().replace(/^,+|,+$/g, '');
  if (!cleaned) return;
  if (!appState.draftTags.includes(cleaned)) {
    appState.draftTags.push(cleaned);
    renderDraftTags();
  }
}

function renderDraftTags() {
  const wrap = document.getElementById('beanTagsPreview');
  if (!wrap) return;

  if (!appState.draftTags.length) {
    wrap.innerHTML = `<div class="tags-empty">No tags added yet.</div>`;
    return;
  }

  wrap.innerHTML = appState.draftTags.map((tag, index) => {
    return `<button type="button" class="tag-chip tag-chip--editable" data-tag-index="${index}">${escapeHtml(tag)} ✕</button>`;
  }).join('');

  wrap.querySelectorAll('[data-tag-index]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.getAttribute('data-tag-index'));
      appState.draftTags.splice(index, 1);
      renderDraftTags();
    });
  });
}

function renderPhotoPreview() {
  const preview = document.getElementById('beanAvatar');
  if (!preview) return;

  if (appState.uploadedPhoto.previewDataUrl) {
    preview.innerHTML = `<img src="${escapeAttribute(appState.uploadedPhoto.previewDataUrl)}" alt="Bean photo preview">`;
  } else {
    preview.innerHTML = `<div class="bean-photo-preview--empty">No photo yet. Upload one to see a preview.</div>`;
  }
}

function updatePhotoMeta() {
  const meta = document.getElementById('beanPhotoMeta');
  if (!meta) return;

  if (!appState.uploadedPhoto.fileId) {
    meta.textContent = 'No photo uploaded yet.';
    return;
  }

  meta.innerHTML = `
    <div><strong>${escapeHtml(appState.uploadedPhoto.fileName || 'Uploaded photo')}</strong></div>
    <div>${escapeHtml(appState.uploadedPhoto.driveLink || '')}</div>
  `;
}

function setOcrStatus(message, tone = 'neutral') {
  const line = document.getElementById('ocrStatusLine');
  if (!line) return;
  line.textContent = message;
  line.className = `ocr-status ocr-status--${tone}`;
}

function formatOcrStatus(status) {
  const map = {
    ok: 'success',
    empty: 'empty result',
    missing_api_key: 'missing API key',
    not_run: 'not run yet'
  };
  return map[status] || status || 'unknown';
}

function setResearchStatus(message, isError = false) {
  const el = document.getElementById('researchStatus');
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? '#991b1b' : '';
}

function hydrateCountryDatalist() {
  const datalist = document.getElementById('countryOptions');
  if (!datalist) return;

  datalist.innerHTML = COUNTRY_OPTIONS.map((country) => `<option value="${escapeHtml(country)}"></option>`).join('');
}

function setAppStatus(message, tone = 'info') {
  const el = document.getElementById('appStatus');
  if (!el) return;
  el.textContent = message;
  el.setAttribute('data-status', tone);
}

function resolveScriptUrl() {
  const liveValue = getValue('scriptUrl');
  if (liveValue) return liveValue;
  if (appState.settings.scriptUrl) return appState.settings.scriptUrl;
  return APPS_SCRIPT_URL;
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || '') : '';
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || '';
}

async function fetchJson(url, options = {}) {
  const method = options.method || 'GET';
  const fetchOptions = {
    method,
    redirect: 'follow'
  };

  if (method !== 'GET' && options.body !== undefined) {
    fetchOptions.headers = {
      'Content-Type': 'text/plain;charset=utf-8'
    };
    fetchOptions.body = typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (!json.success) throw new Error(json.error || 'Request failed.');
  return json;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
