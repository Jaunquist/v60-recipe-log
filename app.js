document.addEventListener('DOMContentLoaded', () => {
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMNB7D2p_qCWhvTulP9GY274aSkJPxr-7l8YGkVFj3hPYlISysdNfAw0ndFYNNII4-gw/exec';

  const COUNTRY_LIST = [
    'Ethiopia', 'Colombia', 'Brazil', 'Kenya', 'Panama', 'Costa Rica', 'Guatemala', 'El Salvador',
    'Honduras', 'Nicaragua', 'Rwanda', 'Burundi', 'Uganda', 'Tanzania', 'Peru', 'Bolivia',
    'Mexico', 'Indonesia', 'Yemen', 'Ecuador', 'Papua New Guinea', 'India', 'China', 'Vietnam',
    'Thailand', 'Laos', 'Myanmar', 'Dominican Republic', 'Jamaica', 'Haiti', 'Japan', 'Taiwan',
    'South Korea', 'United States'
  ];

  const COUNTRY_FLAGS = {
    'Ethiopia': '🇪🇹',
    'Colombia': '🇨🇴',
    'Brazil': '🇧🇷',
    'Kenya': '🇰🇪',
    'Panama': '🇵🇦',
    'Costa Rica': '🇨🇷',
    'Guatemala': '🇬🇹',
    'El Salvador': '🇸🇻',
    'Honduras': '🇭🇳',
    'Nicaragua': '🇳🇮',
    'Rwanda': '🇷🇼',
    'Burundi': '🇧🇮',
    'Uganda': '🇺🇬',
    'Tanzania': '🇹🇿',
    'Peru': '🇵🇪',
    'Bolivia': '🇧🇴',
    'Mexico': '🇲🇽',
    'Indonesia': '🇮🇩',
    'Yemen': '🇾🇪',
    'Ecuador': '🇪🇨',
    'Papua New Guinea': '🇵🇬',
    'India': '🇮🇳',
    'China': '🇨🇳',
    'Vietnam': '🇻🇳',
    'Thailand': '🇹🇭',
    'Laos': '🇱🇦',
    'Myanmar': '🇲🇲',
    'Dominican Republic': '🇩🇴',
    'Jamaica': '🇯🇲',
    'Haiti': '🇭🇹',
    'Japan': '🇯🇵',
    'Taiwan': '🇹🇼',
    'South Korea': '🇰🇷',
    'United States': '🇺🇸'
  };

  const state = {
    beans: [],
    filteredBeans: [],
    activeView: 'library',
    activeTag: '',
    openBeanId: '',
    settings: {
      sheetUrl: '',
      scriptUrl: APPS_SCRIPT_URL,
      photoFolder: '',
      settingsLocked: true
    },
    selectedBeanId: '',
    modalMode: 'add',
    beanTags: [],
    uploadedPhoto: {
      fileId: '',
      fileName: '',
      driveLink: '',
      previewDataUrl: '',
      photoText: '',
      ocrStatus: '',
      ocrSource: ''
    },
    currentRecipeData: null,
    currentRecipeStyle: 'hot',
    currentLogs: [],
    openLogIds: new Set(),
    brewLogDraftId: ''
  };

  const els = {
    viewTitle: document.getElementById('viewTitle'),
    appStatus: document.getElementById('appStatus'),

    navButtons: Array.from(document.querySelectorAll('.nav-btn[data-view]')),
    panels: {
      library: document.getElementById('view-library'),
      helper: document.getElementById('view-helper'),
      settings: document.getElementById('view-settings')
    },

    beanSearchInput: document.getElementById('beanSearchInput'),
    tagFilterBar: document.getElementById('tagFilterBar'),
    beanList: document.getElementById('beanList'),

    helperBeanSelect: document.getElementById('helperBeanSelect'),
    helperBeanSummary: document.getElementById('helperBeanSummary'),
    generateRecipeBtn: document.getElementById('generateRecipeBtn'),
    recipeStatus: document.getElementById('recipeStatus'),
    recipeStyleToggle: document.getElementById('recipeStyleToggle'),
    helperOutput: document.getElementById('helperOutput'),
    recipeEngineStatus: document.getElementById('recipeEngineStatus'),
    lockRecipeCheckbox: document.getElementById('lockRecipeCheckbox'),
    saveRecipeLockBtn: document.getElementById('saveRecipeLockBtn'),
    forceRegenerateBtn: document.getElementById('forceRegenerateBtn'),

    brewLogList: document.getElementById('brewLogList'),
    brewLogForm: document.getElementById('brewLogForm'),
    brewLogFormTitle: document.getElementById('brewLogFormTitle'),
    brewLogId: document.getElementById('brewLogId'),
    brewDate: document.getElementById('brewDate'),
    brewGrind: document.getElementById('brewGrind'),
    brewDose: document.getElementById('brewDose'),
    brewWater: document.getElementById('brewWater'),
    brewTemp: document.getElementById('brewTemp'),
    brewNotes: document.getElementById('brewNotes'),
    saveBrewLogBtn: document.getElementById('saveBrewLogBtn'),
    resetBrewLogBtn: document.getElementById('resetBrewLogBtn'),
    cancelBrewLogEditBtn: document.getElementById('cancelBrewLogEditBtn'),
    brewLogStatus: document.getElementById('brewLogStatus'),

    settingsForm: document.getElementById('settings-form'),
    sheetUrl: document.getElementById('sheetUrl'),
    scriptUrl: document.getElementById('scriptUrl'),
    photoFolder: document.getElementById('photoFolder'),
    photoFolderHint: document.getElementById('photoFolderHint'),
    settingsLocked: document.getElementById('settingsLocked'),

    openAddBeanBtn: document.getElementById('openAddBeanBtn'),
    addBeanModal: document.getElementById('addBeanModal'),
    closeAddBeanBtn: document.getElementById('closeAddBeanBtn'),
    addBeanSubtitle: document.getElementById('addBeanSubtitle'),
    addBeanForm: document.getElementById('addBeanForm'),
    pickPhotoBtn: document.getElementById('pickPhotoBtn'),
    uploadPhotoBtn: document.getElementById('uploadPhotoBtn'),
    researchBeanBtn: document.getElementById('researchBeanBtn'),
    researchStatus: document.getElementById('researchStatus'),

    beanId: document.getElementById('beanId'),
    beanExistingPhotoFileId: document.getElementById('beanExistingPhotoFileId'),
    beanExistingPhotoFileName: document.getElementById('beanExistingPhotoFileName'),
    beanExistingPhotoDriveLink: document.getElementById('beanExistingPhotoDriveLink'),
    beanExistingPhotoPreviewDataUrl: document.getElementById('beanExistingPhotoPreviewDataUrl'),

    beanAvatar: document.getElementById('beanAvatar'),
    beanPhotoFile: document.getElementById('beanPhotoFile'),
    beanPhotoMeta: document.getElementById('beanPhotoMeta'),
    ocrStatusLine: document.getElementById('ocrStatusLine'),
    beanPhotoText: document.getElementById('beanPhotoText'),

    beanName: document.getElementById('beanName'),
    beanRoaster: document.getElementById('beanRoaster'),
    beanOriginCountry: document.getElementById('beanOriginCountry'),
    beanOriginRegion: document.getElementById('beanOriginRegion'),
    beanPurchaseCountry: document.getElementById('beanPurchaseCountry'),
    beanVariety: document.getElementById('beanVariety'),
    beanProducer: document.getElementById('beanProducer'),
    beanFarm: document.getElementById('beanFarm'),
    beanAltitude: document.getElementById('beanAltitude'),
    beanProcess: document.getElementById('beanProcess'),
    beanRoast: document.getElementById('beanRoast'),
    beanNotes: document.getElementById('beanNotes'),
    beanTagInput: document.getElementById('beanTagInput'),
    beanTagsPreview: document.getElementById('beanTagsPreview'),

    countryOptions: document.getElementById('countryOptions')
  };

  function setStatus(message, tone = 'info') {
    if (!els.appStatus) return;
    els.appStatus.textContent = message || '';
    els.appStatus.dataset.status = tone;
  }

  function setRecipeEngineStatus(message, tone = 'info') {
    if (!els.recipeEngineStatus) return;
    els.recipeEngineStatus.textContent = message || '';
    els.recipeEngineStatus.dataset.status = tone || 'info';
  }

  function setBrewLogStatus(message, tone = 'info') {
    if (!els.brewLogStatus) return;
    els.brewLogStatus.textContent = message || '';
    els.brewLogStatus.dataset.status = tone || 'info';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeTags(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || '').trim()).filter(Boolean);
    }
    return String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function uniqueStrings(items) {
    const seen = new Set();
    return items.filter((item) => {
      const key = String(item || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function countryFlag(country) {
    return COUNTRY_FLAGS[country] || '';
  }

  function resolveScriptUrl() {
    return String((state.settings && state.settings.scriptUrl) || APPS_SCRIPT_URL).trim();
  }

  function extractFolderId(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const match = raw.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
    return raw;
  }

  function normalizeRecipeStyleKey(style) {
    return style === 'icedhalfshaken' ? 'iced_half_shaken' : style;
  }

  function normalizePours(pours) {
    if (!Array.isArray(pours)) return [];

    return pours.map((pour) => {
      if (typeof pour === 'string') {
        return {
          start: '',
          end: '',
          water_g: '',
          text: pour
        };
      }

      if (!pour || typeof pour !== 'object') {
        return {
          start: '',
          end: '',
          water_g: '',
          text: ''
        };
      }

      return {
        start: String(pour.start || pour.start_time || '').trim(),
        end: String(pour.end || pour.end_time || '').trim(),
        water_g: String(pour.water_g != null ? pour.water_g : (pour.water || '')).trim(),
        text: String(pour.text || '').trim()
      };
    });
  }

  function renderPoursHtml(pours) {
    const normalized = normalizePours(pours).filter((pour) => {
      return pour.text || pour.start || pour.end || pour.water_g;
    });

    if (!normalized.length) return '';

    return `
      <div class="recipe-block">
        <h4>Pours</h4>
        <ul class="pour-list">
          ${normalized.map((pour) => {
            if (pour.text && !pour.start && !pour.end && !pour.water_g) {
              return `<li>${escapeHtml(pour.text)}</li>`;
            }

            return `
              <li class="pour-item">
                <div class="pour-pill">
                  <strong>Start</strong>
                  <span>${escapeHtml(pour.start || '—')}</span>
                </div>
                <div class="pour-pill">
                  <strong>End</strong>
                  <span>${escapeHtml(pour.end || '—')}</span>
                </div>
                <div class="pour-water">
                  <strong>Water</strong>
                  <span>${escapeHtml(pour.water_g || '—')} g</span>
                </div>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;
  }

  function normalizeRecipeDataShape(data) {
    if (!data || typeof data !== 'object') return data;

    const normalized = {
      ...data,
      defaultStyle: normalizeRecipeStyleKey(data.defaultStyle || 'hot'),
      availableStyles: Array.isArray(data.availableStyles)
        ? data.availableStyles.map(normalizeRecipeStyleKey)
        : ['hot'],
      recipes: {}
    };

    const incomingRecipes = data.recipes || {};
    Object.keys(incomingRecipes).forEach((key) => {
      const normalizedKey = normalizeRecipeStyleKey(key);
      const recipe = incomingRecipes[key] || {};
      normalized.recipes[normalizedKey] = {
        ...recipe,
        pours: normalizePours(recipe.pours)
      };
    });

    return normalized;
  }

  async function fetchJson(url, options = {}) {
    const method = options.method || 'GET';
    const init = { method, headers: {} };

    if (method !== 'GET' && options.body) {
      init.headers['Content-Type'] = 'text/plain;charset=utf-8';
      init.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, init);
    const text = await response.text();
    let json;

    try {
      json = JSON.parse(text);
    } catch (error) {
      throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
    }

    if (!response.ok || json.success === false) {
      throw new Error(json.error || `Request failed (${response.status})`);
    }

    return json;
  }

  function populateCountryDatalist() {
    if (!els.countryOptions) return;
    els.countryOptions.innerHTML = COUNTRY_LIST
      .map((country) => `<option value="${escapeHtml(country)}"></option>`)
      .join('');
  }

  function setView(viewName) {
    state.activeView = viewName;

    Object.entries(els.panels).forEach(([name, panel]) => {
      if (!panel) return;
      panel.classList.toggle('hidden', name !== viewName);
    });

    els.navButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    if (els.viewTitle) {
      const titleMap = {
        library: 'Bean Library',
        helper: 'Recipe Helper',
        settings: 'Settings'
      };
      els.viewTitle.textContent = titleMap[viewName] || 'Bean Ledger';
    }
  }

  function applySettingsLockState() {
    const locked = !!state.settings.settingsLocked;
    [els.sheetUrl, els.scriptUrl, els.photoFolder].forEach((input) => {
      if (!input) return;
      input.readOnly = locked;
      input.classList.toggle('settings-readonly', locked);
    });
  }

  function updatePhotoFolderHint() {
    if (!els.photoFolderHint) return;
    const folderId = extractFolderId(els.photoFolder ? els.photoFolder.value : '');
    if (folderId) {
      els.photoFolderHint.textContent = `Using Drive folder ID: ${folderId}`;
    } else {
      els.photoFolderHint.textContent = 'Paste a full Google Drive folder URL and it will auto-convert to the folder ID.';
    }
  }

  async function loadSettings() {
    try {
      const response = await fetchJson(`${resolveScriptUrl()}?type=settings`);
      const data = response.data || {};

      state.settings = {
        sheetUrl: data.sheetUrl || '',
        scriptUrl: data.scriptUrl || APPS_SCRIPT_URL,
        photoFolder: data.photoFolder || '',
        settingsLocked: data.settingsLocked !== false
      };
    } catch (error) {
      state.settings = {
        sheetUrl: '',
        scriptUrl: APPS_SCRIPT_URL,
        photoFolder: '',
        settingsLocked: true
      };
      setStatus(`Settings fallback: ${error.message}`, 'warn');
    }

    if (els.sheetUrl) els.sheetUrl.value = state.settings.sheetUrl || '';
    if (els.scriptUrl) els.scriptUrl.value = state.settings.scriptUrl || APPS_SCRIPT_URL;
    if (els.photoFolder) els.photoFolder.value = state.settings.photoFolder || '';
    if (els.settingsLocked) els
