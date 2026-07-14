const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMNB7D2p_qCWhvTulP9GY274aSkJPxr-7l8YGkVFj3hPYlISysdNfAw0ndFYNNII4-gw/exec';

const COUNTRY_OPTIONS = [
  "Afghanistan","Åland Islands","Albania","Algeria","American Samoa","Andorra","Angola","Anguilla","Antarctica","Antigua and Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan",
  "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bonaire, Sint Eustatius and Saba","Bosnia and Herzegovina","Botswana","Bouvet Island","Brazil","British Indian Ocean Territory","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi",
  "Cabo Verde","Cambodia","Cameroon","Canada","Cayman Islands","Central African Republic","Chad","Chile","China","Christmas Island","Cocos (Keeling) Islands","Colombia","Comoros","Congo","Congo, Democratic Republic of the","Cook Islands","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Curaçao","Cyprus","Czechia",
  "Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
  "Falkland Islands (Malvinas)","Faroe Islands","Fiji","Finland","France","French Guiana","French Polynesia","French Southern Territories",
  "Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guadeloupe","Guam","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Heard Island and McDonald Islands","Holy See","Honduras","Hong Kong","Hungary",
  "Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy",
  "Jamaica","Japan","Jersey","Jordan",
  "Kazakhstan","Kenya","Kiribati","Korea, Democratic People's Republic of","Korea, Republic of","Kuwait","Kyrgyzstan",
  "Lao People's Democratic Republic","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
  "Macao","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Martinique","Mauritania","Mauritius","Mayotte","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar",
  "Namibia","Nauru","Nepal","Netherlands","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","Niue","Norfolk Island","North Macedonia","Northern Mariana Islands","Norway",
  "Oman",
  "Pakistan","Palau","Palestine, State of","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Pitcairn","Poland","Portugal","Puerto Rico",
  "Qatar",
  "Réunion","Romania","Russian Federation","Rwanda",
  "Saint Barthélemy","Saint Helena, Ascension and Tristan da Cunha","Saint Kitts and Nevis","Saint Lucia","Saint Martin (French part)","Saint Pierre and Miquelon","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Sint Maarten (Dutch part)","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Georgia and the South Sandwich Islands","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Svalbard and Jan Mayen","Sweden","Switzerland","Syrian Arab Republic",
  "Taiwan, Province of China","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tokelau","Tonga","Trinidad and Tobago","Tunisia","Türkiye","Turkmenistan","Turks and Caicos Islands","Tuvalu",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States Minor Outlying Islands","United States of America","Uruguay","Uzbekistan",
  "Vanuatu","Venezuela","Viet Nam","Virgin Islands (British)","Virgin Islands (U.S.)",
  "Wallis and Futuna","Western Sahara",
  "Yemen",
  "Zambia","Zimbabwe"
];

const appState = {
  beans: [],
  settings: {
    sheetUrl: '',
    scriptUrl: '',
    photoFolder: ''
  },
  currentView: 'library',
  currentHelperBeanId: '',
  draftTags: [],
  selectedLibraryTag: '',
  librarySearchTerm: '',
  uploadedPhoto: {
    fileId: '',
    fileName: '',
    driveLink: '',
    previewDataUrl: '',
    photoText: ''
  }
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
  bindHelperInputs();
  bindAddBeanModal();
  bindLibrarySearch();
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
    if (!button.hasAttribute('type')) {
      button.setAttribute('type', 'button');
    }
  });
}

function bindNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const viewTitle = document.getElementById('viewTitle');

  navButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const nextView = button.getAttribute('data-view') || 'library';
      appState.currentView = nextView;

      navButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      document.querySelectorAll('.content > .panel').forEach((panel) => {
        panel.classList.add('hidden');
      });

      const activePanel = document.getElementById(`view-${nextView}`);
      if (activePanel) activePanel.classList.remove('hidden');

      if (viewTitle) {
        const titles = {
          library: 'Bean Library',
          helper: 'Recipe Helper',
          settings: 'Settings'
        };
        viewTitle.textContent = titles[nextView] || 'Bean Library';
      }
    });
  });
}

function switchView(view) {
  const navButtons = document.querySelectorAll('.nav-btn');
  const viewTitle = document.getElementById('viewTitle');
  const nextView = view || 'library';

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
      library: 'Bean Library',
      helper: 'Recipe Helper',
      settings: 'Settings'
    };
    viewTitle.textContent = titles[nextView] || 'Bean Library';
  }
}

function hydrateCountryDatalist() {
  const datalist = document.getElementById('countryOptions');
  if (!datalist) return;

  datalist.innerHTML = COUNTRY_OPTIONS
    .map((country) => `<option value="${escapeHtml(country)}"></option>`)
    .join('');
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

function bindLibrarySearch() {
  const searchInput = document.getElementById('beanSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    appState.librarySearchTerm = searchInput.value.trim().toLowerCase();
    renderBeanList();
    renderTagFilterBar();
  });
}

function bindAddBeanModal() {
  const openBtn = document.getElementById('openAddBeanBtn');
  const closeBtn = document.getElementById('closeAddBeanBtn');
  const modal = document.getElementById('addBeanModal');
  const addBeanForm = document.getElementById('addBeanForm');
  const researchBtn = document.getElementById('researchBeanBtn');
  const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
  const tagInput = document.getElementById('beanTagInput');

  if (openBtn) {
    openBtn.addEventListener('click', (event) => {
      event.preventDefault();
      modal?.classList.remove('hidden');
      renderDraftTags();
      renderPhotoMeta();
      renderBeanAvatar();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (event) => {
      event.preventDefault();
      modal?.classList.add('hidden');
    });
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target.matches('[data-close-add-bean="true"]')) {
        event.preventDefault();
        modal.classList.add('hidden');
      }
    });
  }

  if (addBeanForm) {
    addBeanForm.addEventListener('submit', onSaveBean);
  }

  if (researchBtn) {
    researchBtn.addEventListener('click', (event) => {
      event.preventDefault();
      onResearchBean();
    });
  }

  if (uploadPhotoBtn) {
    uploadPhotoBtn.addEventListener('click', (event) => {
      event.preventDefault();
      onUploadPhoto();
    });
  }

  if (tagInput) {
    tagInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        addDraftTag(tagInput.value);
        tagInput.value = '';
      }

      if (event.key === 'Backspace' && !tagInput.value.trim() && appState.draftTags.length) {
        appState.draftTags.pop();
        renderDraftTags();
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

async function bootstrapApp() {
  setStatus('Loading app...', 'info');

  try {
    const [beansResponse, settingsResponse] = await Promise.all([
      fetchJson(`${APPS_SCRIPT_URL}?type=beans`),
      fetchJson(`${APPS_SCRIPT_URL}?type=settings`)
    ]);

    appState.beans = Array.isArray(beansResponse?.data) ? normalizeBeans(beansResponse.data) : [];
    appState.settings = normalizeSettings(settingsResponse?.data || {});

    hydrateSettingsForm();
    renderBeanList();
    renderTagFilterBar();
    renderBeanSelect();
    renderRecipeHelper();
    renderDraftTags();
    renderPhotoMeta();
    renderBeanAvatar();

    setStatus('Ready.', 'success');
  } catch (error) {
    console.error(error);
    setStatus(`Failed to load data: ${error.message}`, 'error');
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const result = await response.json();
  if (result && result.success === false) throw new Error(result.error || 'Backend request failed.');
  return result;
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
  if (result && result.success === false) throw new Error(result.error || 'Backend request failed.');
  return result;
}

function normalizeBeans(beans) {
  return beans.map((bean) => {
    const normalizedPreview = sanitizeImageSource(
      bean.photo_preview_data_url ||
      bean.photoPreviewDataUrl ||
      ''
    );

    return {
      ...bean,
      tags: normalizeTagArray(bean.tags || bean.tags_text || ''),
      photo_preview_data_url: normalizedPreview
    };
  });
}

function normalizeSettings(settings) {
  return {
    sheetUrl: settings.sheetUrl || '',
    scriptUrl: settings.scriptUrl || '',
    photoFolder: normalizeDriveFolderValue(settings.photoFolder || '')
  };
}

function sanitizeImageSource(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (isLikelyImageDataUrl(raw)) return raw;
  if (isLikelyImageUrl(raw)) return raw;

  return '';
}

function isLikelyImageDataUrl(value) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=\s]+$/i.test(value);
}

function isLikelyImageUrl(value) {
  if (!/^https?:\/\//i.test(value)) return false;

  try {
    const url = new URL(value);
    const pathname = (url.pathname || '').toLowerCase();
    return /\.(png|jpg|jpeg|gif|webp|avif|svg)$/i.test(pathname) ||
      pathname.includes('/uc') ||
      pathname.includes('/thumbnail') ||
      pathname.includes('/file/d/');
  } catch (_) {
    return false;
  }
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
  hint.textContent = extracted ? `Folder ID ready: ${extracted}` : 'Could not detect a valid Google Drive folder ID yet.';
}

async function onSaveSettings(event) {
  event.preventDefault();

  const sheetUrlInput = document.getElementById('sheetUrl');
  const scriptUrlInput = document.getElementById('scriptUrl');
  const photoFolderInput = document.getElementById('photoFolder');

  const cleanedPhotoFolder = normalizeDriveFolderValue(photoFolderInput ? photoFolderInput.value : '');
  if (photoFolderInput) photoFolderInput.value = cleanedPhotoFolder;

  const payload = {
    action: 'savesettings',
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
    setStatus(`Failed to save shared settings: ${error.message}`, 'error');
  }
}

function getFilteredBeans() {
  const searchTerm = appState.librarySearchTerm;
  const selectedTag = appState.selectedLibraryTag;

  return appState.beans.filter((bean) => {
    const haystack = [
      bean.name || bean.bean || '',
      bean.roaster || '',
      bean.origin || '',
      bean.origin_country || '',
      bean.origin_region || '',
      bean.purchase_country || '',
      bean.variety || '',
      bean.producer || '',
      bean.farm || '',
      bean.altitude || '',
      bean.process || '',
      bean.notes || '',
      bean.photo_text || '',
      ...(bean.tags || [])
    ].join(' ').toLowerCase();

    const matchesSearch = !searchTerm || haystack.includes(searchTerm);
    const matchesTag = !selectedTag || (bean.tags || []).includes(selectedTag);

    return matchesSearch && matchesTag;
  });
}

function renderBeanList() {
  const beanList = document.getElementById('beanList');
  if (!beanList) return;

  const filteredBeans = getFilteredBeans();

  if (!filteredBeans.length) {
    beanList.innerHTML = '<div class="bean-card">No beans match your current search or tag filter.</div>';
    return;
  }

  beanList.innerHTML = filteredBeans.map((bean) => {
    const title = escapeHtml(bean.name || bean.bean || 'Untitled Bean');
    const previewSrc = sanitizeImageSource(bean.photo_preview_data_url);

    const avatar = previewSrc
      ? `<img class="bean-card__avatar" src="${escapeHtml(previewSrc)}" alt="${title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';" /><div class="bean-card__avatar bean-card__avatar--placeholder" style="display:none;">${getBeanSvgMarkup(inferRoastLevel(bean), 'bean-card__bean-svg')}</div>`
      : `<div class="bean-card__avatar bean-card__avatar--placeholder">${getBeanSvgMarkup(inferRoastLevel(bean), 'bean-card__bean-svg')}</div>`;

    const origin = bean.origin ? `<div class="bean-card__origin">${formatOriginWithFlag(bean.origin)}</div>` : '';
    const roaster = bean.roaster ? `<div class="bean-card__meta"><strong>Roaster:</strong> ${escapeHtml(bean.roaster)}</div>` : '';
    const purchaseCountry = bean.purchase_country ? `<div class="bean-card__meta"><strong>Purchased in:</strong> ${escapeHtml(bean.purchase_country)}</div>` : '';
    const variety = bean.variety ? `<div class="bean-card__meta"><strong>Variety:</strong> ${escapeHtml(bean.variety)}</div>` : '';
    const producer = bean.producer ? `<div class="bean-card__meta"><strong>Producer:</strong> ${escapeHtml(bean.producer)}</div>` : '';
    const farm = bean.farm ? `<div class="bean-card__meta"><strong>Farm:</strong> ${escapeHtml(bean.farm)}</div>` : '';
    const altitude = bean.altitude ? `<div class="bean-card__meta"><strong>Altitude:</strong> ${escapeHtml(bean.altitude)}</div>` : '';
    const process = bean.process ? `<div class="bean-card__meta"><strong>Process:</strong> ${escapeHtml(bean.process)}</div>` : '';
    const notes = bean.notes ? `<div class="bean-card__meta"><strong>Notes:</strong> ${escapeHtml(bean.notes)}</div>` : '';
    const photo = bean.photo_drive_link ? `<div class="bean-card__meta"><a href="${escapeHtml(bean.photo_drive_link)}" target="_blank" rel="noopener noreferrer">Open photo in Drive</a></div>` : '';
    const tags = renderTagChips(bean.tags || []);

    return `
      <div class="bean-card">
        <div class="bean-card__top">
          ${avatar}
          <div class="bean-card__header">
            <div class="bean-card__title">${title}</div>
            ${origin}
          </div>
        </div>
        ${roaster}
        ${purchaseCountry}
        ${variety}
        ${producer}
        ${farm}
        ${altitude}
        ${process}
        ${notes}
        ${photo}
        ${tags ? `<div class="bean-card__tags">${tags}</div>` : ''}
      </div>
    `;
  }).join('');
}

function renderTagFilterBar() {
  const container = document.getElementById('tagFilterBar');
  if (!container) return;

  const tagCounts = new Map();

  appState.beans.forEach((bean) => {
    (bean.tags || []).forEach((tag) => {
      if (!appState.librarySearchTerm || beanMatchesSearch(bean, appState.librarySearchTerm)) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    });
  });

  const tags = Array.from(tagCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const allButton = `
    <button type="button" class="tag-filter-chip ${appState.selectedLibraryTag === '' ? 'active' : ''}" data-tag-filter="">
      All tags
    </button>
  `;

  const tagButtons = tags.map(([tag, count]) => `
    <button type="button" class="tag-filter-chip ${appState.selectedLibraryTag === tag ? 'active' : ''}" data-tag-filter="${escapeHtml(tag)}">
      ${escapeHtml(tag)} <span class="tag-filter-count">${count}</span>
    </button>
  `).join('');

  container.innerHTML = allButton + tagButtons;

  container.querySelectorAll('[data-tag-filter]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      appState.selectedLibraryTag = button.getAttribute('data-tag-filter') || '';
      renderTagFilterBar();
      renderBeanList();
    });
  });
}

function beanMatchesSearch(bean, searchTerm) {
  const haystack = [
    bean.name || bean.bean || '',
    bean.roaster || '',
    bean.origin || '',
    bean.origin_country || '',
    bean.origin_region || '',
    bean.purchase_country || '',
    bean.variety || '',
    bean.producer || '',
    bean.farm || '',
    bean.altitude || '',
    bean.process || '',
    bean.notes || '',
    bean.photo_text || '',
    ...(bean.tags || [])
  ].join(' ').toLowerCase();

  return haystack.includes(searchTerm);
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
}

function renderRecipeHelper() {
  const summary = document.getElementById('helperBeanSummary');
  const output = document.getElementById('helperOutput');
  const bean = getBeanById(appState.currentHelperBeanId);

  const dose = parseFloat(document.getElementById('helperDose')?.value || '');
  const ratio = parseFloat(document.getElementById('helperRatio')?.value || '');
  const target = parseFloat(document.getElementById('helperTarget')?.value || '');
  const method = document.getElementById('helperMethod')?.value || 'v60';

  if (summary) {
    if (bean) {
      const previewSrc = sanitizeImageSource(bean.photo_preview_data_url);

      const avatar = previewSrc
        ? `<img class="helper-avatar" src="${escapeHtml(previewSrc)}" alt="${escapeHtml(bean.name || bean.bean || 'Bean')}" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';" /><div class="helper-avatar helper-avatar--placeholder" style="display:none;">${getBeanSvgMarkup(inferRoastLevel(bean), 'helper-bean-svg')}</div>`
        : `<div class="helper-avatar helper-avatar--placeholder">${getBeanSvgMarkup(inferRoastLevel(bean), 'helper-bean-svg')}</div>`;

      const parts = [`<strong>${escapeHtml(bean.name || bean.bean || 'Untitled Bean')}</strong>`];
      if (bean.roaster) parts.push(escapeHtml(bean.roaster));
      if (bean.origin) parts.push(formatOriginWithFlag(bean.origin));
      if (bean.purchase_country) parts.push(`Purchased in: ${escapeHtml(bean.purchase_country)}`);
      if (bean.variety) parts.push(`Variety: ${escapeHtml(bean.variety)}`);
      if (bean.process) parts.push(escapeHtml(bean.process));
      if (bean.producer) parts.push(`Producer: ${escapeHtml(bean.producer)}`);

      summary.innerHTML = `
        <div class="helper-summary-top">
          ${avatar}
          <div class="helper-summary-copy">${parts.join(' · ')}</div>
        </div>
        ${bean.tags && bean.tags.length ? `<div class="helper-tags">${renderTagChips(bean.tags)}</div>` : ''}
      `;
    } else {
      summary.textContent = 'Select a bean to see its summary.';
    }
  }

  if (!output) return;

  if (!dose || (!ratio && !target)) {
    output.innerHTML = `<div class="helper-placeholder">Enter dose plus either brew ratio or target beverage weight.</div>`;
    return;
  }

  const computedTarget = target || (dose * ratio);
  const computedRatio = ratio || (computedTarget / dose);
  const bloomWater = round1(dose * 3);
  const remainingWater = Math.max(0, computedTarget - bloomWater);
  const pour2 = round1(remainingWater * 0.5);
  const pour3 = round1(remainingWater - pour2);

  output.innerHTML = `
    <div class="helper-grid">
      <div class="helper-metric">
        <div class="helper-metric__label">Method</div>
        <div class="helper-metric__value">${escapeHtml(method.toUpperCase())}</div>
      </div>
      <div class="helper-metric">
        <div class="helper-metric__label">Dose</div>
        <div class="helper-metric__value">${round1(dose)} g</div>
      </div>
      <div class="helper-metric">
        <div class="helper-metric__label">Ratio</div>
        <div class="helper-metric__value">1:${round2(computedRatio)}</div>
      </div>
      <div class="helper-metric">
        <div class="helper-metric__label">Target Yield</div>
        <div class="helper-metric__value">${round1(computedTarget)} g</div>
      </div>
    </div>

    <div class="helper-steps">
      <div class="helper-step"><strong>Bloom</strong> — ${bloomWater} g water</div>
      <div class="helper-step"><strong>Pour 2</strong> — ${pour2} g water</div>
      <div class="helper-step"><strong>Pour 3</strong> — ${pour3} g water</div>
    </div>
  `;
}

async function onSaveBean(event) {
  event.preventDefault();

  const beanData = collectBeanFormData();
  setStatus('Saving bean...', 'info');

  try {
    const result = await postJson({
      action: 'savebean',
      beanData
    });

    const savedBean = result?.data?.bean ? normalizeBeans([result.data.bean])[0] : null;

    if (savedBean) {
      const existingIndex = appState.beans.findIndex((item) => String(item.id) === String(savedBean.id));
      if (existingIndex > -1) {
        appState.beans[existingIndex] = savedBean;
      } else {
        appState.beans.unshift(savedBean);
      }

      appState.currentHelperBeanId = savedBean.id;
      renderBeanList();
      renderTagFilterBar();
      renderBeanSelect();
      renderRecipeHelper();
    }

    resetAddBeanForm();
    document.getElementById('addBeanModal')?.classList.add('hidden');
    setStatus('Bean saved successfully.', 'success');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Failed to save bean.', 'error');
  }
}

async function onResearchBean() {
  const beanData = collectBeanFormData();
  const name = beanData.bean || beanData.name || '';
  const researchStatus = document.getElementById('researchStatus');

  if (!name && !beanData.photo_file_id && !beanData.photo_text) {
    setStatus('Enter a bean name or upload a photo before research.', 'error');
    if (researchStatus) researchStatus.textContent = 'Enter a bean name or upload a photo first.';
    return;
  }

  setStatus('Researching bean...', 'info');
  if (researchStatus) researchStatus.textContent = 'Research in progress...';

  try {
    const result = await postJson({
      action: 'researchbean',
      beanData
    });

    const researchedBean = result?.data?.bean || null;
    if (!researchedBean) throw new Error('Backend returned no bean data.');

    fillBeanForm(researchedBean);

    if (researchStatus) {
      const provider = result?.data?.provider || 'debug';
      const model = result?.data?.model || 'baseline';
      researchStatus.textContent = `Research complete via ${provider} (${model}).`;
    }

    setStatus('Bean research complete.', 'success');
  } catch (error) {
    console.error('Research bean failed:', error);
    if (researchStatus) researchStatus.textContent = `Research failed: ${error.message}`;
    setStatus(`Failed to research bean: ${error.message}`, 'error');
  }
}

async function onUploadPhoto() {
  const fileInput = document.getElementById('beanPhotoFile');
  const researchStatus = document.getElementById('researchStatus');
  const file = fileInput?.files?.[0];

  if (!file) {
    setStatus('Choose a photo first.', 'error');
    if (researchStatus) researchStatus.textContent = 'Choose a photo before uploading.';
    return;
  }

  setStatus('Compressing photo...', 'info');
  if (researchStatus) researchStatus.textContent = 'Compressing photo before upload...';

  try {
    const compressed = await compressImageFile(file, 1600, 0.82);

    setStatus('Uploading bean photo...', 'info');
    if (researchStatus) researchStatus.textContent = 'Uploading compressed photo...';

    const result = await postJson({
      action: 'uploadbeanphoto',
      fileName: compressed.fileName,
      mimeType: compressed.mimeType,
      base64: compressed.dataUrl,
      previewDataUrl: compressed.previewDataUrl
    });

    appState.uploadedPhoto = {
      fileId: result?.data?.fileId || '',
      fileName: result?.data?.fileName || compressed.fileName,
      driveLink: result?.data?.driveLink || '',
      previewDataUrl: sanitizeImageSource(result?.data?.previewDataUrl || compressed.previewDataUrl),
      photoText: result?.data?.photoText || inferPhotoTextFromFileName(file.name)
    };

    renderPhotoMeta();
    renderBeanAvatar();

    if (researchStatus) {
      const ocrStatus = result?.data?.ocrStatus || 'uploaded';
      researchStatus.textContent = `Photo uploaded. OCR status: ${ocrStatus}. You can now run Research Bean.`;
    }

    setStatus('Photo uploaded successfully.', 'success');
  } catch (error) {
    console.error(error);
    if (researchStatus) researchStatus.textContent = `Photo upload failed: ${error.message}`;
    setStatus(`Failed to upload photo: ${error.message}`, 'error');
  }
}

function collectBeanFormData() {
  return {
    bean: document.getElementById('beanName')?.value.trim() || '',
    name: document.getElementById('beanName')?.value.trim() || '',
    roaster: document.getElementById('beanRoaster')?.value.trim() || '',
    origin_country: normalizeCountryValue(document.getElementById('beanOriginCountry')?.value || ''),
    origin_region: document.getElementById('beanOriginRegion')?.value.trim() || '',
    purchase_country: normalizeCountryValue(document.getElementById('beanPurchaseCountry')?.value || ''),
    variety: document.getElementById('beanVariety')?.value.trim() || '',
    producer: document.getElementById('beanProducer')?.value.trim() || '',
    farm: document.getElementById('beanFarm')?.value.trim() || '',
    altitude: document.getElementById('beanAltitude')?.value.trim() || '',
    process: document.getElementById('beanProcess')?.value.trim() || '',
    notes: document.getElementById('beanNotes')?.value.trim() || '',
    tags: [...appState.draftTags],
    photo_file_id: appState.uploadedPhoto.fileId || '',
    photo_file_name: appState.uploadedPhoto.fileName || '',
    photo_drive_link: appState.uploadedPhoto.driveLink || '',
    photo_preview_data_url: sanitizeImageSource(appState.uploadedPhoto.previewDataUrl || ''),
    photo_text: appState.uploadedPhoto.photoText || ''
  };
}

function fillBeanForm(bean) {
  const beanName = document.getElementById('beanName');
  const beanRoaster = document.getElementById('beanRoaster');
  const beanOriginCountry = document.getElementById('beanOriginCountry');
  const beanOriginRegion = document.getElementById('beanOriginRegion');
  const beanPurchaseCountry = document.getElementById('beanPurchaseCountry');
  const beanVariety = document.getElementById('beanVariety');
  const beanProducer = document.getElementById('beanProducer');
  const beanFarm = document.getElementById('beanFarm');
  const beanAltitude = document.getElementById('beanAltitude');
  const beanProcess = document.getElementById('beanProcess');
  const beanNotes = document.getElementById('beanNotes');

  if (beanName && (bean.bean || bean.name)) beanName.value = bean.bean || bean.name;
  if (beanRoaster && bean.roaster) beanRoaster.value = bean.roaster;
  if (beanOriginCountry && bean.origin_country) beanOriginCountry.value = normalizeCountryValue(bean.origin_country);
  if (beanOriginRegion && bean.origin_region) beanOriginRegion.value = bean.origin_region;
  if (beanPurchaseCountry && bean.purchase_country) beanPurchaseCountry.value = normalizeCountryValue(bean.purchase_country);
  if (beanVariety && bean.variety) beanVariety.value = bean.variety;
  if (beanProducer && bean.producer) beanProducer.value = bean.producer;
  if (beanFarm && bean.farm) beanFarm.value = bean.farm;
  if (beanAltitude && bean.altitude) beanAltitude.value = bean.altitude;
  if (beanProcess && bean.process) beanProcess.value = bean.process;
  if (beanNotes && bean.notes) beanNotes.value = bean.notes;

  if (bean.tags) {
    appState.draftTags = normalizeTagArray(bean.tags);
    renderDraftTags();
  }

  if (bean.photo_file_id || bean.photo_drive_link || bean.photo_preview_data_url) {
    appState.uploadedPhoto = {
      fileId: bean.photo_file_id || '',
      fileName: bean.photo_file_name || '',
      driveLink: bean.photo_drive_link || '',
      previewDataUrl: sanitizeImageSource(bean.photo_preview_data_url || ''),
      photoText: bean.photo_text || ''
    };
    renderPhotoMeta();
    renderBeanAvatar();
  }
}

function resetAddBeanForm() {
  const form = document.getElementById('addBeanForm');
  if (form) form.reset();

  appState.draftTags = [];
  appState.uploadedPhoto = {
    fileId: '',
    fileName: '',
    driveLink: '',
    previewDataUrl: '',
    photoText: ''
  };

  renderDraftTags();
  renderPhotoMeta();
  renderBeanAvatar();

  const researchStatus = document.getElementById('researchStatus');
  if (researchStatus) {
    researchStatus.textContent = 'Uploading compresses the photo first. Research Bean will use uploaded photo metadata and photo text when present.';
  }
}

function addDraftTag(rawValue) {
  const tags = normalizeTagArray(rawValue);
  tags.forEach((tag) => {
    if (!appState.draftTags.includes(tag)) {
      appState.draftTags.push(tag);
    }
  });
  renderDraftTags();
}

function removeDraftTag(tagToRemove) {
  appState.draftTags = appState.draftTags.filter((tag) => tag !== tagToRemove);
  renderDraftTags();
}

function renderDraftTags() {
  const preview = document.getElementById('beanTagsPreview');
  if (!preview) return;

  if (!appState.draftTags.length) {
    preview.innerHTML = '<div class="tags-empty">No tags added yet.</div>';
    return;
  }

  preview.innerHTML = appState.draftTags.map((tag) => `
    <button type="button" class="tag-chip tag-chip--editable" data-remove-tag="${escapeHtml(tag)}">
      <span>${escapeHtml(tag)}</span>
      <span aria-hidden="true">×</span>
    </button>
  `).join('');

  preview.querySelectorAll('[data-remove-tag]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      removeDraftTag(button.getAttribute('data-remove-tag') || '');
    });
  });
}

function renderTagChips(tags) {
  if (!tags || !tags.length) return '';
  return tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('');
}

function renderPhotoMeta() {
  const meta = document.getElementById('beanPhotoMeta');
  if (!meta) return;

  if (!appState.uploadedPhoto.fileId && !appState.uploadedPhoto.previewDataUrl) {
    meta.textContent = 'No photo uploaded yet.';
    return;
  }

  const link = appState.uploadedPhoto.driveLink
    ? `<a href="${escapeHtml(appState.uploadedPhoto.driveLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(appState.uploadedPhoto.fileName || 'Open uploaded photo')}</a>`
    : escapeHtml(appState.uploadedPhoto.fileName || 'Uploaded photo');

  meta.innerHTML = `Uploaded: ${link}`;
}

function renderBeanAvatar() {
  const avatar = document.getElementById('beanAvatar');
  if (!avatar) return;

  const previewSrc = sanitizeImageSource(appState.uploadedPhoto.previewDataUrl);

  if (previewSrc) {
    avatar.innerHTML = `<img src="${escapeHtml(previewSrc)}" alt="Bean avatar preview" onerror="this.remove();">`;
    return;
  }

  avatar.setAttribute('data-roast', 'medium');
  avatar.innerHTML = getBeanSvgMarkup('medium', 'bean-avatar__svg');
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
  return flag ? `<span class="origin-flag" aria-hidden="true">${flag}</span> <span>${text}</span>` : `<span>${text}</span>`;
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
    'viet nam': 'VN',
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

function normalizeTagArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((tag) => String(tag || '').trim().toLowerCase())
      .filter(Boolean)
      .filter((tag, index, arr) => arr.indexOf(tag) === index);
  }

  return String(value || '')
    .split(',')
    .map((tag) => String(tag || '').trim().toLowerCase())
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index);
}

function normalizeCountryValue(value) {
  const raw = String(value || '').trim();

  if (!raw) return '';

  const exactMatch = COUNTRY_OPTIONS.find(
    (country) => country.toLowerCase() === raw.toLowerCase()
  );

  if (exactMatch) return exactMatch;
  return raw;
}

function inferPhotoTextFromFileName(fileName) {
  const raw = String(fileName || '').replace(/\.[^.]+$/, '');
  return raw.replace(/[_-]+/g, ' ').trim();
}

function inferRoastLevel(bean) {
  const text = [
    bean?.process || '',
    bean?.notes || '',
    bean?.name || '',
    bean?.bean || '',
    bean?.photo_text || ''
  ].join(' ').toLowerCase();

  if (text.includes('light roast') || text.includes('light')) return 'light';
  if (text.includes('dark roast') || text.includes('dark')) return 'dark';
  return 'medium';
}

function getBeanSvgMarkup(roast = 'medium', extraClass = '') {
  const palette = {
    light: { fill: '#b97a56', crease: '#efd2b5', shadow: '#8d5f43' },
    medium: { fill: '#8b5e3c', crease: '#e7c3a3', shadow: '#69452b' },
    dark: { fill: '#4b2e20', crease: '#b78f74', shadow: '#2f1c13' }
  };

  const chosen = palette[roast] || palette.medium;

  return `
    <svg class="${extraClass}" viewBox="0 0 64 64" aria-hidden="true">
      <ellipse cx="32" cy="32" rx="22" ry="16" fill="${chosen.shadow}" opacity="0.14"></ellipse>
      <ellipse cx="32" cy="30" rx="19" ry="25" fill="${chosen.fill}" transform="rotate(-18 32 30)"></ellipse>
      <path d="M27 13c7 8 10 24 5 35" stroke="${chosen.crease}" stroke-width="3.3" stroke-linecap="round" fill="none"></path>
      <ellipse cx="25" cy="22" rx="4" ry="7" fill="rgba(255,255,255,0.08)" transform="rotate(-18 25 22)"></ellipse>
    </svg>
  `;
}

async function compressImageFile(file, maxDimension = 1600, quality = 0.82) {
  const dataUrl = await fileToDataUrl(file);
  const image = await loadImage(dataUrl);

  let { width, height } = image;
  if (width > height && width > maxDimension) {
    height = Math.round((height * maxDimension) / width);
    width = maxDimension;
  } else if (height >= width && height > maxDimension) {
    width = Math.round((width * maxDimension) / height);
    height = maxDimension;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);

  const outputMime = 'image/jpeg';
  const compressedDataUrl = canvas.toDataURL(outputMime, quality);
  const previewDataUrl = canvas.toDataURL(outputMime, 0.72);
  const safeBaseName = (file.name || 'bean-photo').replace(/\.[^.]+$/, '');
  const fileName = `${safeBaseName}.jpg`;

  return {
    dataUrl: compressedDataUrl,
    previewDataUrl,
    fileName,
    mimeType: outputMime
  };
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for compression.'));
    img.src = src;
  });
}

function setStatus(message, type = 'info') {
  const el = document.getElementById('appStatus');
  if (!el) return;
  el.textContent = message;
  el.dataset.status = type;
}

function round1(value) {
  return Math.round(Number(value) * 10) / 10;
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

let uploadedPhotoState = {
  previewDataUrl: '',
  fileName: '',
  fileId: '',
  driveLink: '',
  photoText: '',
  ocrStatus: 'not_run'
};

function bindBeanModalEvents() {
  const beanForm = document.getElementById('beanForm');
  const closeBeanModalBtn = document.getElementById('closeBeanModalBtn');
  const cancelBeanBtn = document.getElementById('cancelBeanBtn');
  const selectBeanPhotoBtn = document.getElementById('selectBeanPhotoBtn');
  const uploadBeanPhotoBtn = document.getElementById('uploadBeanPhotoBtn');
  const beanPhotoInput = document.getElementById('beanPhotoInput');
  const researchBeanBtn = document.getElementById('researchBeanBtn');
  const modalCloseZone = document.querySelector('[data-close-bean-modal]');

  if (beanForm) beanForm.addEventListener('submit', onSaveBean);
  if (closeBeanModalBtn) closeBeanModalBtn.addEventListener('click', closeBeanModal);
  if (cancelBeanBtn) cancelBeanBtn.addEventListener('click', closeBeanModal);
  if (selectBeanPhotoBtn) selectBeanPhotoBtn.addEventListener('click', () => beanPhotoInput && beanPhotoInput.click());
  if (beanPhotoInput) beanPhotoInput.addEventListener('change', onBeanPhotoSelected);
  if (uploadBeanPhotoBtn) uploadBeanPhotoBtn.addEventListener('click', onUploadBeanPhoto);
  if (researchBeanBtn) researchBeanBtn.addEventListener('click', onResearchBean);
  if (modalCloseZone) modalCloseZone.addEventListener('click', closeBeanModal);
}

function openBeanModal(bean = null) {
  const modal = document.getElementById('beanModal');
  if (!modal) return;

  resetBeanForm();

  if (bean) {
    hydrateBeanForm(bean);
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeBeanModal() {
  const modal = document.getElementById('beanModal');
  if (!modal) return;

  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function resetBeanForm() {
  const form = document.getElementById('beanForm');
  if (form) form.reset();

  setInputValue('beanId', '');
  setInputValue('photo_file_id', '');
  setInputValue('photo_file_name', '');
  setInputValue('photo_drive_link', '');
  setInputValue('photo_preview_data_url', '');
  setInputValue('photo_text', '');

  uploadedPhotoState = {
    previewDataUrl: '',
    fileName: '',
    fileId: '',
    driveLink: '',
    photoText: '',
    ocrStatus: 'not_run'
  };

  renderBeanPhotoPreview('');
  renderPhotoFileMeta();
  renderOcrStatus('not_run');
}

function hydrateBeanForm(bean) {
  setInputValue('beanId', bean.id || '');
  setInputValue('bean', bean.bean || bean.name || '');
  setInputValue('roaster', bean.roaster || '');
  setInputValue('purchase_country', bean.purchase_country || '');
  setInputValue('origin_country', bean.origin_country || '');
  setInputValue('origin_region', bean.origin_region || '');
  setInputValue('variety', bean.variety || '');
  setInputValue('producer', bean.producer || '');
  setInputValue('farm', bean.farm || '');
  setInputValue('altitude', bean.altitude || '');
  setInputValue('process', bean.process || '');
  setInputValue('tags', Array.isArray(bean.tags) ? bean.tags.join(', ') : (bean.tags_text || ''));
  setInputValue('notes', bean.notes || '');
  setInputValue('photo_text', bean.photo_text || '');

  setInputValue('photo_file_id', bean.photo_file_id || '');
  setInputValue('photo_file_name', bean.photo_file_name || '');
  setInputValue('photo_drive_link', bean.photo_drive_link || '');
  setInputValue('photo_preview_data_url', bean.photo_preview_data_url || '');

  uploadedPhotoState = {
    previewDataUrl: bean.photo_preview_data_url || '',
    fileName: bean.photo_file_name || '',
    fileId: bean.photo_file_id || '',
    driveLink: bean.photo_drive_link || '',
    photoText: bean.photo_text || '',
    ocrStatus: bean.photo_text ? 'ok' : 'not_run'
  };

  renderBeanPhotoPreview(uploadedPhotoState.previewDataUrl);
  renderPhotoFileMeta();
  renderOcrStatus(uploadedPhotoState.ocrStatus);
}

function onBeanPhotoSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    uploadedPhotoState.previewDataUrl = String(reader.result || '');
    uploadedPhotoState.fileName = file.name || '';
    uploadedPhotoState.ocrStatus = 'ready_to_upload';

    setInputValue('photo_preview_data_url', uploadedPhotoState.previewDataUrl);
    renderBeanPhotoPreview(uploadedPhotoState.previewDataUrl);
    renderPhotoFileMeta();
    renderOcrStatus('ready_to_upload');
  };
  reader.readAsDataURL(file);
}

async function onUploadBeanPhoto() {
  const fileInput = document.getElementById('beanPhotoInput');
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  if (!file || !uploadedPhotoState.previewDataUrl) {
    renderOcrStatus('no_file_selected');
    return;
  }

  renderOcrStatus('uploading');

  try {
    const base64 = uploadedPhotoState.previewDataUrl.split(',')[1] || '';

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'uploadbeanphoto',
        base64: base64,
        previewDataUrl: uploadedPhotoState.previewDataUrl,
        mimeType: file.type || 'image/jpeg',
        fileName: file.name || ('bean-photo-' + Date.now() + '.jpg')
      })
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error((json && json.error) || 'Photo upload failed.');
    }

    const data = json.data || {};

    uploadedPhotoState.fileId = data.fileId || '';
    uploadedPhotoState.fileName = data.fileName || uploadedPhotoState.fileName || '';
    uploadedPhotoState.driveLink = data.driveLink || '';
    uploadedPhotoState.previewDataUrl = data.previewDataUrl || uploadedPhotoState.previewDataUrl || '';
    uploadedPhotoState.photoText = data.photoText || '';
    uploadedPhotoState.ocrStatus = data.ocrStatus || 'unknown';

    setInputValue('photo_file_id', uploadedPhotoState.fileId);
    setInputValue('photo_file_name', uploadedPhotoState.fileName);
    setInputValue('photo_drive_link', uploadedPhotoState.driveLink);
    setInputValue('photo_preview_data_url', uploadedPhotoState.previewDataUrl);
    setInputValue('photo_text', uploadedPhotoState.photoText);

    renderBeanPhotoPreview(uploadedPhotoState.previewDataUrl);
    renderPhotoFileMeta();
    renderOcrStatus(uploadedPhotoState.ocrStatus);
  } catch (error) {
    console.error(error);
    renderOcrStatus('upload_failed');
  }
}

function renderBeanPhotoPreview(src) {
  const preview = document.getElementById('beanPhotoPreview');
  if (!preview) return;

  const safeSrc = sanitizePreviewImageSrc(src);

  if (!safeSrc) {
    preview.className = 'bean-photo-preview bean-photo-preview--empty';
    preview.innerHTML = '<span>No photo uploaded</span>';
    return;
  }

  preview.className = 'bean-photo-preview';
  preview.innerHTML = `<img src="${safeSrc}" alt="Bean photo preview" />`;
}

function renderPhotoFileMeta() {
  const el = document.getElementById('photoFileMeta');
  if (!el) return;

  const fileName = uploadedPhotoState.fileName || '';
  const driveLink = uploadedPhotoState.driveLink || '';

  if (!fileName && !driveLink) {
    el.innerHTML = '';
    return;
  }

  el.innerHTML = `
    ${fileName ? `<div><strong>File:</strong> ${escapeHtml(fileName)}</div>` : ''}
    ${driveLink ? `<div><a href="${escapeHtml(driveLink)}" target="_blank" rel="noopener noreferrer">Open file in Drive</a></div>` : ''}
  `;
}

function renderOcrStatus(status) {
  const el = document.getElementById('ocrStatusLine');
  if (!el) return;

  const map = {
    not_run: { text: 'OCR: not run yet', cls: 'ocr-status ocr-status--neutral' },
    ready_to_upload: { text: 'OCR: ready after upload', cls: 'ocr-status ocr-status--neutral' },
    uploading: { text: 'OCR: uploading photo and running OCR...', cls: 'ocr-status ocr-status--neutral' },
    ok: { text: 'OCR: success', cls: 'ocr-status ocr-status--success' },
    empty: { text: 'OCR: no text detected', cls: 'ocr-status ocr-status--warning' },
    empty_or_failed: { text: 'OCR: empty or failed', cls: 'ocr-status ocr-status--warning' },
    missing_api_key: { text: 'OCR: missing Vision API key', cls: 'ocr-status ocr-status--error' },
    no_file_selected: { text: 'OCR: choose a photo first', cls: 'ocr-status ocr-status--warning' },
    upload_failed: { text: 'OCR: upload failed', cls: 'ocr-status ocr-status--error' },
    unknown: { text: 'OCR: unknown result', cls: 'ocr-status ocr-status--warning' }
  };

  const matchedVisionHttp = /^vision_http_/i.test(status || '');
  const matchedVisionError = /^vision_error_/i.test(status || '');

  if (matchedVisionHttp) {
    el.className = 'ocr-status ocr-status--error';
    el.textContent = `OCR: Vision HTTP error (${status.replace('vision_http_', '')})`;
    return;
  }

  if (matchedVisionError) {
    el.className = 'ocr-status ocr-status--error';
    el.textContent = `OCR: ${status.replace(/^vision_error_/i, '').trim() || 'Vision error'}`;
    return;
  }

  const item = map[status] || map.unknown;
  el.className = item.cls;
  el.textContent = item.text;
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

function sanitizePreviewImageSrc(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return '';
}
