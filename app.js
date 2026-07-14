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
  recipesByBeanId: {},
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
  recipeStyle: 'hot'
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
      event.preventDefault();
      const targetView = button.getAttribute('data-view');
      if (targetView) switchView(targetView);
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
  const response = await fetchJson(`${resolveScriptUrl()}?type=settings`);
  const data = response.data || {};

  appState.settings = {
    sheetUrl: data.sheetUrl || '',
    scriptUrl: data.scriptUrl || '',
    photoFolder: data.photoFolder || ''
  };

  setValue('sheetUrl', appState.settings.sheetUrl);
  setValue('scriptUrl', appState.settings.scriptUrl || APPS_SCRIPT_URL);
  setValue('photoFolder', appState.settings.photoFolder);
  updatePhotoFolderHint(appState.settings.photoFolder);
}

async function loadBeans() {
  const response = await fetchJson(`${resolveScriptUrl()}?type=beans`);
  appState.beans = Array.isArray(response.data) ? response.data : [];
  renderBeanList();
  renderTagFilters();
  renderHelperBeanOptions();
}

async function loadSavedRecipes(beanId) {
  if (!beanId) return [];
  const response = await fetchJson(`${resolveScriptUrl()}?type=recipes&beanId=${encodeURIComponent(beanId)}`);
  const recipes = Array.isArray(response.data) ? response.data : [];
  appState.recipesByBeanId[beanId] = recipes;
  return recipes;
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
            <button type="button" class="generate-inline-recipe-btn" data-bean-id="${escapeHtml(bean.id)}">Generate recipe</button>
            <button type="button" class="open-helper-btn" data-bean-id="${escapeHtml(bean.id)}">Open in Recipe Helper</button>
          </div>

          <div class="inline-recipe-wrap" data-inline-recipe-for="${escapeHtml(bean.id)}"></div>
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
    details.addEventListener('toggle', async () => {
      const beanId = details.getAttribute('data-bean-id') || '';
      appState.expandedBeans[beanId] = details.open;
      if (details.open && !appState.recipesByBeanId[beanId]) {
        try {
          await loadSavedRecipes(beanId);
          renderSavedRecipeLists(beanId);
        } catch (error) {
          console.error(error);
        }
      }
    });
  });

  document.querySelectorAll('.generate-inline-recipe-btn').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const beanId = button.getAttribute('data-bean-id') || '';
      await generateInlineRecipe(beanId);
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
}

async function generateInlineRecipe(beanId) {
  const bean = appState.beans.find((item) => item.id === beanId);
  const wrap = document.querySelector(`[data-inline-recipe-for="${cssEscape(beanId)}"]`);
  if (!bean || !wrap) return;

  wrap.innerHTML = `<div class="helper-placeholder">Generating recipe…</div>`;

  try {
    const response = await fetchJson(resolveScriptUrl(), {
      method: 'POST',
      body: {
        action: 'generateRecipe',
        beanData: bean
      }
    });

    const result = response.data || null;
    const availableStyles = Array.isArray(result && result.availableStyles) ? result.availableStyles : ['hot'];
    const activeStyle = (result && result.defaultStyle) || 'hot';

    wrap.innerHTML = '';
    const editor = buildInlineRecipeEditor(bean, result, availableStyles, activeStyle);
    wrap.appendChild(editor);

    await ensureSavedRecipesLoaded(beanId);
    renderSavedRecipeListForEditor(beanId, editor);
  } catch (error) {
    console.error(error);
    wrap.innerHTML = `<div class="helper-placeholder">${escapeHtml(error.message || 'Failed to generate recipe.')}</div>`;
  }
}

function buildInlineRecipeEditor(bean, result, styles, activeStyle) {
  const template = document.getElementById('recipeEditorTemplate');
  const node = template.content.firstElementChild.cloneNode(true);
  const recipe = result && result.recipes ? result.recipes[activeStyle] : null;

  node.setAttribute('data-bean-id', bean.id);
  node.setAttribute('data-active-style', activeStyle);

  const toggle = node.querySelector('.recipe-style-toggle');
  if (styles.length > 1) {
    toggle.innerHTML = styles.map((style) => {
      const label = style === 'iced_half_shaken' ? 'Iced (half shaken)' : 'Hot';
      return `<button type="button" class="recipe-style-btn ${style === activeStyle ? 'active' : ''}" data-style="${escapeHtml(style)}">${escapeHtml(label)}</button>`;
    }).join('');

    toggle.querySelectorAll('[data-style]').forEach((button) => {
      button.addEventListener('click', () => {
        const style = button.getAttribute('data-style') || 'hot';
        const nextRecipe = result.recipes[style];
        node.setAttribute('data-active-style', style);
        fillRecipeEditor(node, nextRecipe);
        toggle.querySelectorAll('.recipe-style-btn').forEach((btn) => {
          btn.classList.toggle('active', btn === button);
        });
      });
    });
  } else {
    toggle.innerHTML = '';
  }

  fillRecipeEditor(node, recipe);

  const saveBtn = node.querySelector('.save-recipe-btn');
  saveBtn.addEventListener('click', async () => {
    await saveRecipeVersionFromEditor(bean, node);
  });

  return node;
}

function fillRecipeEditor(node, recipe) {
  if (!recipe) return;

  node.querySelector('.recipe-editor__title').textContent = recipe.label || 'Recipe';

  setRecipeEditorField(node, 'grind', recipe.grind || '');
  setRecipeEditorField(node, 'dose_g', recipe.dose_g || '');
  setRecipeEditorField(node, 'water_total_g', recipe.water_total_g || '');
  setRecipeEditorField(node, 'hot_water_g', recipe.hot_water_g || '');
  setRecipeEditorField(node, 'brew_ice_g', recipe.brew_ice_g || '');
  setRecipeEditorField(node, 'water_temp_c', recipe.water_temp_c || '');
  setRecipeEditorField(node, 'target_time', recipe.target_time || '');
  setRecipeEditorField(node, 'ratio', recipe.ratio || '');
  setRecipeEditorField(node, 'why', recipe.why || '');
  setRecipeEditorField(node, 'expected_notes', recipe.expected_notes || '');
  setRecipeEditorField(node, 'pours', Array.isArray(recipe.pours) ? recipe.pours.join('\n') : '');
}

function setRecipeEditorField(node, field, value) {
  const input = node.querySelector(`[data-field="${field}"]`);
  if (input) input.value = value;
}

function getRecipeEditorField(node, field) {
  const input = node.querySelector(`[data-field="${field}"]`);
  return input ? String(input.value || '') : '';
}

async function saveRecipeVersionFromEditor(bean, node) {
  const style = node.getAttribute('data-active-style') || 'hot';
  const label = style === 'iced_half_shaken' ? 'Iced (half shaken)' : 'Hot';
  const versionNote = String((node.querySelector('.recipe-version-note') || {}).value || '').trim();

  const recipe = {
    style,
    label,
    grinder: 'Eureka Mignon Perfetto',
    grind: getRecipeEditorField(node, 'grind'),
    dose_g: getRecipeEditorField(node, 'dose_g'),
    water_total_g: getRecipeEditorField(node, 'water_total_g'),
    hot_water_g: getRecipeEditorField(node, 'hot_water_g'),
    brew_ice_g: getRecipeEditorField(node, 'brew_ice_g'),
    water_temp_c: getRecipeEditorField(node, 'water_temp_c'),
    target_time: getRecipeEditorField(node, 'target_time'),
    ratio: getRecipeEditorField(node, 'ratio'),
    why: getRecipeEditorField(node, 'why'),
    expected_notes: getRecipeEditorField(node, 'expected_notes'),
    pours: getRecipeEditorField(node, 'pours').split('\n').map((line) => line.trim()).filter(Boolean)
  };

  try {
    const response = await fetchJson(resolveScriptUrl(), {
      method: 'POST',
      body: {
        action: 'saveRecipe',
        beanData: bean,
        recipe,
        savedFrom: 'bean_library',
        versionNote
      }
    });

    const saved = response.data && response.data.recipe ? response.data.recipe : null;
    if (!saved) return;

    if (!appState.recipesByBeanId[bean.id]) appState.recipesByBeanId[bean.id] = [];
    appState.recipesByBeanId[bean.id].unshift(saved);

    const status = node.querySelector('.recipe-save-status');
    if (status) status.textContent = 'Saved as a new recipe version.';
    const noteInput = node.querySelector('.recipe-version-note');
    if (noteInput) noteInput.value = '';

    renderSavedRecipeListForEditor(bean.id, node);
  } catch (error) {
    console.error(error);
    const status = node.querySelector('.recipe-save-status');
    if (status) {
      status.textContent = error.message || 'Failed to save recipe version.';
      status.style.color = '#991b1b';
    }
  }
}

async function ensureSavedRecipesLoaded(beanId) {
  if (!appState.recipesByBeanId[beanId]) {
    await loadSavedRecipes(beanId);
  }
}

function renderSavedRecipeLists(beanId) {
  const editor = document.querySelector(`.recipe-editor[data-bean-id="${cssEscape(beanId)}"]`);
  if (editor) renderSavedRecipeListForEditor(beanId, editor);
}

function renderSavedRecipeListForEditor(beanId, editorNode) {
  const wrap = editorNode.querySelector('.saved-recipe-list');
  if (!wrap) return;

  const recipes = appState.recipesByBeanId[beanId] || [];
  if (!recipes.length) {
    wrap.innerHTML = `<div class="helper-placeholder">No saved recipes yet.</div>`;
    return;
  }

  wrap.innerHTML = recipes.map((recipe) => {
    const created = formatDate(recipe.created_at);
    const versionNote = recipe.version_note ? `<div>${escapeHtml(recipe.version_note)}</div>` : '';
    return `
      <div class="saved-recipe-item">
        <div><strong>${escapeHtml(recipe.label || recipe.style || 'Recipe')}</strong></div>
        <div class="saved-recipe-meta">
          <span>${escapeHtml(created)}</span>
          <span>${escapeHtml(recipe.grind || '—')}</span>
          <span>${escapeHtml(recipe.target_time || '—')}</span>
          <span>${escapeHtml(recipe.water_temp_c ? `${recipe.water_temp_c}°C` : '—')}</span>
        </div>
        ${versionNote}
        <div>${escapeHtml(recipe.expected_notes || '')}</div>
      </div>
    `;
  }).join('');
}

function formatDate(value) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
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

  if (openBtn) openBtn.addEventListener('click', openAddBeanModal);
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

function openAddBeanModal() {
  const modal = document.getElementById('addBeanModal');
  if (!modal) return;
  resetBeanForm();
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
    'beanName','beanRoaster','beanOriginCountry','beanOriginRegion','beanPurchaseCountry',
    'beanVariety','beanProducer','beanFarm','beanAltitude','beanProcess','beanRoast','beanNotes','beanPhotoText'
  ].forEach((id) => setValue(id, ''));

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

  try {
    const response = await fetchJson(resolveScriptUrl(), {
      method: 'POST',
      body: {
        action: 'saveBean',
        beanData
      }
    });

    const saved = response.data && response.data.bean ? response.data.bean : null;
    if (saved) {
      await loadBeans();
      closeAddBeanModal();
      setAppStatus('Bean saved.', 'success');
    }
  } catch (error) {
    console.error(error);
    setAppStatus(error.message || 'Failed to save bean.', 'error');
  }
}

function collectBeanFormData() {
  return {
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
    photo_file_id: appState.uploadedPhoto.fileId || '',
    photo_file_name: appState.uploadedPhoto.fileName || '',
    photo_drive_link: appState.uploadedPhoto.driveLink || '',
    photo_preview_data_url: appState.uploadedPhoto.previewDataUrl || '',
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
  const saved = getValue('scriptUrl');
  return saved || appState.settings.scriptUrl || APPS_SCRIPT_URL;
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || '') : '';
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
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

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === 'function') {
    return window.CSS.escape(value);
  }
  return String(value || '').replace(/"/g, '\\"');
}
