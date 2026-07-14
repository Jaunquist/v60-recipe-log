const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMNB7D2p_qCWhvTulP9GY274aSkJPxr-7l8YGkVFj3hPYlISysdNfAw0ndFYNNII4-gw/exec';

const COUNTRY_OPTIONS = [
  'Philippines', 'Japan', 'Taiwan', 'Hong Kong', 'Singapore', 'Thailand', 'South Korea',
  'Indonesia', 'Malaysia', 'Vietnam', 'Australia', 'New Zealand', 'United States',
  'Canada', 'United Kingdom', 'France', 'Italy', 'Spain', 'Germany', 'Netherlands',
  'Denmark', 'Norway', 'Sweden', 'Finland', 'Switzerland', 'Ethiopia', 'Kenya',
  'Colombia', 'Brazil', 'Panama', 'Costa Rica', 'Guatemala', 'Mexico'
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
  librarySearchTerm: ''
};

document.addEventListener('DOMContentLoaded', async () => {
  bindEvents();
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
}

function bindNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const viewTitle = document.getElementById('viewTitle');

  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
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
  const tagInput = document.getElementById('beanTagInput');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      modal?.classList.remove('hidden');
      renderDraftTags();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal?.classList.add('hidden'));
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target.matches('[data-close-add-bean="true"]')) {
        modal.classList.add('hidden');
      }
    });
  }

  if (addBeanForm) {
    addBeanForm.addEventListener('submit', onSaveBean);
  }

  if (researchBtn) {
    researchBtn.addEventListener('click', onResearchBean);
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

    setStatus('Ready.', 'success');
  } catch (error) {
    console.error(error);
    setStatus(`Failed to load data: ${error.message}`, 'error');
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);

  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error('Invalid JSON response from backend.');
  }

  if (result && result.success === false) {
    throw new Error(result.error || 'Backend request failed.');
  }

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

  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error('Invalid JSON response from backend.');
  }

  if (result && result.success === false) {
    throw new Error(result.error || 'Backend request failed.');
  }

  return result;
}

function normalizeBeans(beans) {
  return beans.map((bean) => ({
    ...bean,
    tags: normalizeTagArray(bean.tags || bean.tags_text || '')
  }));
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
      bean.process || '',
      bean.notes || '',
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
    const origin = bean.origin ? `<div class="bean-card__origin">${formatOriginWithFlag(bean.origin)}</div>` : '';
    const roaster = bean.roaster ? `<div class="bean-card__meta"><strong>Roaster:</strong> ${escapeHtml(bean.roaster)}</div>` : '';
    const purchaseCountry = bean.purchase_country ? `<div class="bean-card__meta"><strong>Purchased in:</strong> ${escapeHtml(bean.purchase_country)}</div>` : '';
    const process = bean.process ? `<div class="bean-card__meta"><strong>Process:</strong> ${escapeHtml(bean.process)}</div>` : '';
    const notes = bean.notes ? `<div class="bean-card__meta"><strong>Notes:</strong> ${escapeHtml(bean.notes)}</div>` : '';
    const tags = renderTagChips(bean.tags || [], false);

    return `
      <div class="bean-card">
        <div class="bean-card__header">
          <div class="bean-card__title">${title}</div>
          ${origin}
        </div>
        ${roaster}
        ${purchaseCountry}
        ${process}
        ${notes}
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

  const tags = Array.from(tagCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));

  const allButton = `
    <button
      type="button"
      class="tag-filter-chip ${appState.selectedLibraryTag === '' ? 'active' : ''}"
      data-tag-filter=""
    >
      All tags
    </button>
  `;

  const tagButtons = tags.map(([tag, count]) => `
    <button
      type="button"
      class="tag-filter-chip ${appState.selectedLibraryTag === tag ? 'active' : ''}"
      data-tag-filter="${escapeHtml(tag)}"
    >
      ${escapeHtml(tag)} <span class="tag-filter-count">${count}</span>
    </button>
  `).join('');

  container.innerHTML = allButton + tagButtons;

  container.querySelectorAll('[data-tag-filter]').forEach((button) => {
    button.addEventListener('click', () => {
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
    bean.process || '',
    bean.notes || '',
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
      const parts = [`<strong>${escapeHtml(bean.name || bean.bean || 'Untitled Bean')}</strong>`];
      if (bean.roaster) parts.push(escapeHtml(bean.roaster));
      if (bean.origin) parts.push(formatOriginWithFlag(bean.origin));
      if (bean.purchase_country) parts.push(`Purchased in: ${escapeHtml(bean.purchase_country)}`);
      if (bean.process) parts.push(escapeHtml(bean.process));
      summary.innerHTML = parts.join(' · ');

      if (bean.tags && bean.tags.length) {
        summary.innerHTML += `<div class="helper-tags">${renderTagChips(bean.tags, false)}</div>`;
      }
    } else {
      summary.textContent = 'Select a bean to see its summary.';
    }
  }

  if (!output) return;

  if (!dose || (!ratio && !target)) {
    output.innerHTML = `
      <div class="helper-placeholder">
        Enter dose plus either brew ratio or target beverage weight.
      </div>
    `;
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

  if (!name) {
    setStatus('Enter at least a bean name before research.', 'error');
    if (researchStatus) {
      researchStatus.textContent = 'Enter a bean name first.';
    }
    return;
  }

  setStatus('Researching bean (baseline debug)...', 'info');
  if (researchStatus) {
    researchStatus.textContent = 'Research in progress...';
  }

  try {
    const result = await postJson({
      action: 'researchbean',
      beanData
    });

    const researchedBean = result?.data?.bean || null;

    if (!researchedBean) {
      throw new Error('Backend returned no bean data.');
    }

    fillBeanForm(researchedBean);

    if (researchStatus) {
      const provider = result?.data?.provider || 'debug';
      const model = result?.data?.model || 'baseline';
      researchStatus.textContent = `Research complete via ${provider} (${model}).`;
    }

    setStatus('Bean research complete.', 'success');
  } catch (error) {
    console.error('Research bean failed:', error);
    if (researchStatus) {
      researchStatus.textContent = `Research failed: ${error.message}`;
    }
    setStatus(`Failed to research bean: ${error.message}`, 'error');
  }
}

function collectBeanFormData() {
  return {
    bean: document.getElementById('beanName')?.value.trim() || '',
    name: document.getElementById('beanName')?.value.trim() || '',
    roaster: document.getElementById('beanRoaster')?.value.trim() || '',
    origin_country: document.getElementById('beanOriginCountry')?.value.trim() || '',
    origin_region: document.getElementById('beanOriginRegion')?.value.trim() || '',
    purchase_country: normalizeCountryValue(document.getElementById('beanPurchaseCountry')?.value || ''),
    process: document.getElementById('beanProcess')?.value.trim() || '',
    notes: document.getElementById('beanNotes')?.value.trim() || '',
    tags: [...appState.draftTags]
  };
}

function fillBeanForm(bean) {
  const beanName = document.getElementById('beanName');
  const beanRoaster = document.getElementById('beanRoaster');
  const beanOriginCountry = document.getElementById('beanOriginCountry');
  const beanOriginRegion = document.getElementById('beanOriginRegion');
  const beanPurchaseCountry = document.getElementById('beanPurchaseCountry');
  const beanProcess = document.getElementById('beanProcess');
  const beanNotes = document.getElementById('beanNotes');

  if (beanName && (bean.bean || bean.name)) beanName.value = bean.bean || bean.name;
  if (beanRoaster && bean.roaster) beanRoaster.value = bean.roaster;
  if (beanOriginCountry && bean.origin_country) beanOriginCountry.value = bean.origin_country;
  if (beanOriginRegion && bean.origin_region) beanOriginRegion.value = bean.origin_region;
  if (beanPurchaseCountry && bean.purchase_country) beanPurchaseCountry.value = normalizeCountryValue(bean.purchase_country);
  if (beanProcess && bean.process) beanProcess.value = bean.process;
  if (beanNotes && bean.notes) beanNotes.value = bean.notes;

  if (bean.tags) {
    appState.draftTags = normalizeTagArray(bean.tags);
    renderDraftTags();
  }
}

function resetAddBeanForm() {
  const form = document.getElementById('addBeanForm');
  if (form) form.reset();

  appState.draftTags = [];
  renderDraftTags();

  const researchStatus = document.getElementById('researchStatus');
  if (researchStatus) {
    researchStatus.textContent = 'Research Bean can suggest origin, process, notes, and starter tags. Purchase country stays manual.';
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
    button.addEventListener('click', () => {
      removeDraftTag(button.getAttribute('data-remove-tag') || '');
    });
  });
}

function renderTagChips(tags, editable) {
  if (!tags || !tags.length) return '';

  if (editable) {
    return tags.map((tag) => `
      <button type="button" class="tag-chip tag-chip--editable" data-remove-tag="${escapeHtml(tag)}">
        <span>${escapeHtml(tag)}</span>
        <span aria-hidden="true">×</span>
      </button>
    `).join('');
  }

  return tags.map((tag) => `
    <span class="tag-chip">${escapeHtml(tag)}</span>
  `).join('');
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
