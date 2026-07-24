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
      uploadDataUrl: '',
      photoText: '',
      ocrStatus: '',
      ocrSource: ''
    },
    currentRecipeData: null,
    currentRecipeStyle: 'hot',
    currentLogs: [],
    openLogIds: new Set(),
    brewLogDraftId: '',
    isResearchingBean: false,
    autofillPreference: 'log' // 'log' by default; switches to 'recipe' right after generating one
  };

  const els = {
    viewTitle: document.getElementById('viewTitle'),
    appStatus: document.getElementById('appStatus'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),

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
    brewStyle: document.getElementById('brewStyle'),
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
    cameraPhotoBtn: document.getElementById('cameraPhotoBtn'),
    researchBeanBtn: document.getElementById('researchBeanBtn'),
    researchStatus: document.getElementById('researchStatus'),

    beanId: document.getElementById('beanId'),
    beanExistingPhotoFileId: document.getElementById('beanExistingPhotoFileId'),
    beanExistingPhotoFileName: document.getElementById('beanExistingPhotoFileName'),
    beanExistingPhotoDriveLink: document.getElementById('beanExistingPhotoDriveLink'),
    beanExistingPhotoPreviewDataUrl: document.getElementById('beanExistingPhotoPreviewDataUrl'),

    beanAvatar: document.getElementById('beanAvatar'),
    beanPhotoFile: document.getElementById('beanPhotoFile'),
    beanPhotoCameraFile: document.getElementById('beanPhotoCameraFile'),
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

  let statusToastTimer = null;

  function setStatus(message, tone = 'info') {
    if (!els.appStatus) return;
    els.appStatus.textContent = message || '';
    els.appStatus.dataset.status = tone;

    // On mobile the status is a floating toast; show it, then auto-hide.
    // On desktop the visibility class has no effect (pill is always shown).
    els.appStatus.classList.add('app-status--visible');
    if (statusToastTimer) clearTimeout(statusToastTimer);
    const hideDelay = tone === 'error' || tone === 'warn' ? 6000 : 3500;
    statusToastTimer = setTimeout(() => {
      if (els.appStatus) els.appStatus.classList.remove('app-status--visible');
    }, hideDelay);
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

  // Mirrors the backend calibration so locked recipes rendered client-side
  // (and any recipe saved before calibration existed) show the right dial number.
  // On this Perfetto: espresso ~4.0–5.0, V60 filter 5.5–7.5; generic advice
  // that puts espresso near 2.0 reads ~2.5 numbers too low.
  const GRIND_FILTER_MIN = 5.0;
  const GRIND_FILTER_MAX = 7.5;
  const GRIND_LEGACY_OFFSET = 2.5;

  function calibrateGrindInfo(grindText) {
    const match = String(grindText || '').match(/(\d+(?:\.\d+)?)/);
    if (!match) return { text: grindText || '', rawToken: '', finalToken: '' };

    let value = Number(match[1]);
    if (value < GRIND_FILTER_MIN) {
      value += GRIND_LEGACY_OFFSET;
    }
    value = Math.max(GRIND_FILTER_MIN, Math.min(GRIND_FILTER_MAX, value));
    // Stepless dial: keep 0.1 precision so the field matches the AI's prose.
    value = Math.round(value * 10) / 10;

    return {
      text: `${value.toFixed(1)} on Eureka Mignon Perfetto`,
      rawToken: match[1],
      finalToken: value.toFixed(1)
    };
  }

  function calibrateGrindText(grindText) {
    return calibrateGrindInfo(grindText).text;
  }

  // If calibration changed the grind number, rewrite mentions of the old
  // number in prose (why / expected notes) so they stay consistent.
  function syncGrindMentions(text, rawToken, finalToken) {
    if (!text || !rawToken || !finalToken) return text || '';
    if (Number(rawToken) === Number(finalToken)) return text;

    const escaped = rawToken.replace('.', '\\.');
    const pattern = new RegExp(`(^|[^0-9.])${escaped}(?![0-9.])`, 'g');
    return String(text).replace(pattern, (matched, prefix) => `${prefix}${finalToken}`);
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
      const grindInfo = calibrateGrindInfo(recipe.grind);
      normalized.recipes[normalizedKey] = {
        ...recipe,
        grind: grindInfo.text,
        why: syncGrindMentions(recipe.why, grindInfo.rawToken, grindInfo.finalToken),
        expected_notes: syncGrindMentions(recipe.expected_notes, grindInfo.rawToken, grindInfo.finalToken),
        pours: normalizePours(recipe.pours)
      };
    });

    return normalized;
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

  // Show only the date (e.g. "Jul 24, 2026") no matter what shape the sheet
  // sent back — full metadata stays untouched in the backend.
  function formatLogDate(value) {
    const raw = String(value || '').trim();
    if (!raw) return 'Unknown date';
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function brewStyleBadgeHtml(style) {
    const key = String(style || '').toLowerCase();
    if (key.indexOf('iced') !== -1) {
      return '<span class="log-style log-style--iced">🧊 Iced</span>';
    }
    if (key.indexOf('hot') !== -1) {
      return '<span class="log-style log-style--hot">🔥 Hot</span>';
    }
    return '';
  }

  function renderPoursHtml(pours, waterTargetG, targetTime) {
    const normalized = normalizePours(pours).filter((pour) => {
      return pour.text || pour.start || pour.end || pour.water_g;
    });

    if (!normalized.length) return '';

    const structured = normalized.filter((p) => !(p.text && !p.start && !p.end && !p.water_g));
    const amounts = structured.map((p) => Number(p.water_g) || 0);
    const target = Number(waterTargetG) || 0;

    // The AI is asked for per-pour amounts, but sometimes returns cumulative
    // scale readings anyway. Detect that case so we never double-accumulate:
    // non-decreasing values whose last entry already hits the target while
    // their sum overshoots it are cumulative readings, not additions.
    const sum = amounts.reduce((acc, value) => acc + value, 0);
    const nonDecreasing = amounts.every((value, i) => i === 0 || value >= amounts[i - 1]);
    const alreadyCumulative = target > 0
      && amounts.length > 1
      && nonDecreasing
      && Math.abs(amounts[amounts.length - 1] - target) <= 2
      && sum > target * 1.2;

    let cumulative = 0;

    // Convert structured pours into per-pour additions (undoing cumulative
    // input when detected), then condense to at most 3 pours — bloom, first,
    // second — by merging any extra tail pours into the last one. Merging
    // additions preserves the total water exactly.
    let entries = [];
    normalized.forEach((pour) => {
      if (pour.text && !pour.start && !pour.end && !pour.water_g) {
        entries.push({ text: pour.text });
        return;
      }

      const amount = Number(pour.water_g) || 0;
      let addition;
      if (alreadyCumulative) {
        addition = amount - cumulative;
        cumulative = amount;
      } else {
        addition = amount;
        cumulative += amount;
      }
      entries.push({ start: pour.start || '', end: pour.end || '', addition });
    });

    const structuredEntries = entries.filter((e) => !e.text);
    if (structuredEntries.length > 3) {
      const kept = structuredEntries.slice(0, 2);
      const tail = structuredEntries.slice(2);
      kept.push({
        start: tail[0].start,
        end: tail[tail.length - 1].end || tail[tail.length - 1].start,
        addition: tail.reduce((acc, e) => acc + e.addition, 0)
      });
      entries = entries.filter((e) => e.text).concat(kept);
    }

    let runningTotal = 0;
    let pourNumber = 0;

    const rows = entries.map((entry) => {
      if (entry.text) {
        return `<li class="pour-row pour-row--text">${escapeHtml(entry.text)}</li>`;
      }

      pourNumber += 1;
      runningTotal += entry.addition;
      const time = [entry.start, entry.end].filter(Boolean).join('–') || '—';

      return `
        <li class="pour-row">
          <span class="pour-row__num">${pourNumber}</span>
          <span class="pour-row__time">${escapeHtml(time)}</span>
          <span class="pour-row__total">${runningTotal} g</span>
          <span class="pour-row__add">+${entry.addition}</span>
        </li>
      `;
    }).join('');

    const drawdownRow = targetTime
      ? `<li class="pour-row pour-row--drawdown">⏳ Drawdown — no more pours; let the bed drain until <strong>${escapeHtml(String(targetTime))}</strong>, then remove the dripper.</li>`
      : '';

    return `
      <div class="recipe-block">
        <h4>Pours</h4>
        <ul class="pour-list">
          <li class="pour-row pour-row--head" aria-hidden="true">
            <span class="pour-row__num">#</span>
            <span class="pour-row__time">Time</span>
            <span class="pour-row__total">Pour to</span>
            <span class="pour-row__add">Add</span>
          </li>
          ${rows}
          ${drawdownRow}
        </ul>
      </div>
    `;
  }

  const APP_TOKEN_STORAGE_KEY = 'beanLedgerAppToken';
  const THEME_STORAGE_KEY = 'beanLedgerTheme';

  function getPreferredTheme() {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (error) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;

    // Keep Chrome's browser chrome tinted to match the active theme.
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute('content', theme === 'dark' ? '#171210' : '#f5f1ea');
    });

    if (els.themeToggleBtn) {
      els.themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
      els.themeToggleBtn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (error) {}
    applyTheme(next);
  }

  function getAppToken() {
    try {
      return localStorage.getItem(APP_TOKEN_STORAGE_KEY) || '';
    } catch (error) {
      return '';
    }
  }

  function setAppToken(token) {
    try {
      localStorage.setItem(APP_TOKEN_STORAGE_KEY, String(token || '').trim());
    } catch (error) {
      // Ignore storage failures (private mode etc.); token just won't persist.
    }
  }

  function promptForAppToken() {
    const token = window.prompt(
      'This app is protected by a token.\n\nEnter the value of the APP_TOKEN script property (Apps Script → Project Settings → Script properties):'
    );
    if (token === null) return false;
    setAppToken(token);
    return true;
  }

  async function fetchJson(url, options = {}, allowTokenRetry = true) {
    const method = options.method || 'GET';
    const token = getAppToken();
    const init = { method, headers: {} };

    let requestUrl = url;
    if (method === 'GET' && token) {
      requestUrl += (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token);
    }

    if (method !== 'GET' && options.body) {
      init.headers['Content-Type'] = 'text/plain;charset=utf-8';
      init.body = JSON.stringify({ ...options.body, token });
    }

    const response = await fetch(requestUrl, init);
    const text = await response.text();
    let json;

    try {
      json = JSON.parse(text);
    } catch (error) {
      throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
    }

    if (!response.ok || json.success === false) {
      const message = json.error || `Request failed (${response.status})`;

      // If the backend rejected our token, ask for it once and retry.
      if (allowTokenRetry && /unauthorized/i.test(message)) {
        if (promptForAppToken()) {
          return fetchJson(url, options, false);
        }
      }

      throw new Error(message);
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
    if (els.settingsLocked) els.settingsLocked.checked = true;
    state.settings.settingsLocked = true;
    applySettingsLockState();
    updatePhotoFolderHint();
  }

  async function saveSettings(event) {
    event.preventDefault();

    const payload = {
      action: 'saveSettings',
      sheetUrl: els.sheetUrl ? els.sheetUrl.value.trim() : '',
      scriptUrl: els.scriptUrl ? els.scriptUrl.value.trim() : '',
      photoFolder: extractFolderId(els.photoFolder ? els.photoFolder.value : ''),
      settingsLocked: !!(els.settingsLocked && els.settingsLocked.checked)
    };

    try {
      setStatus('Saving settings…', 'info');
      const response = await fetchJson(resolveScriptUrl(), {
        method: 'POST',
        body: payload
      });

      const data = response.data || {};
      state.settings = {
        sheetUrl: data.sheetUrl || '',
        scriptUrl: data.scriptUrl || APPS_SCRIPT_URL,
        photoFolder: data.photoFolder || '',
        settingsLocked: data.settingsLocked !== false
      };

      if (els.sheetUrl) els.sheetUrl.value = state.settings.sheetUrl || '';
      if (els.scriptUrl) els.scriptUrl.value = state.settings.scriptUrl || APPS_SCRIPT_URL;
      if (els.photoFolder) els.photoFolder.value = state.settings.photoFolder || '';
      if (els.settingsLocked) els.settingsLocked.checked = state.settings.settingsLocked;

      applySettingsLockState();
      updatePhotoFolderHint();
      setStatus('Shared settings saved.', 'success');
    } catch (error) {
      setStatus(error.message || 'Could not save settings.', 'error');
    }
  }

  function normalizeBeanFromApi(bean) {
    const tags = Array.isArray(bean.tags) ? bean.tags : normalizeTags(bean.tags);
    return {
      ...bean,
      id: String(bean.id || ''),
      bean: bean.bean || bean.name || '',
      tags,
      recipe_locked: bean.recipe_locked === true || String(bean.recipe_locked).toLowerCase() === 'true',
      locked_recipe_json: bean.locked_recipe_json || '',
      brew_count: Number(bean.brew_count || 0)
    };
  }

  async function loadBeans() {
    try {
      setStatus('Loading beans…', 'info');
      const response = await fetchJson(`${resolveScriptUrl()}?type=beans`);
      state.beans = Array.isArray(response.data) ? response.data.map(normalizeBeanFromApi) : [];
      filterAndRenderBeans();
      renderHelperBeanOptions();
      syncHelperBeanSummary();
      setStatus(`Loaded ${state.beans.length} bean${state.beans.length === 1 ? '' : 's'}.`, 'success');
    } catch (error) {
      state.beans = [];
      filterAndRenderBeans();
      renderHelperBeanOptions();
      setStatus(error.message || 'Could not load beans.', 'error');
    }
  }

  function buildTagCounts(beans) {
    const counts = new Map();
    beans.forEach((bean) => {
      bean.tags.forEach((tag) => {
        const key = String(tag || '').trim();
        if (!key) return;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }

  function renderTagFilters(beans) {
    if (!els.tagFilterBar) return;

    const counts = buildTagCounts(beans);
    const allActive = !state.activeTag ? 'active' : '';

    const buttons = [
      `<button type="button" class="tag-filter ${allActive}" data-tag-filter="">All</button>`,
      ...counts.map(([tag, count]) => {
        const active = state.activeTag === tag ? 'active' : '';
        return `<button type="button" class="tag-filter ${active}" data-tag-filter="${escapeHtml(tag)}">${escapeHtml(tag)} <span>${count}</span></button>`;
      })
    ];

    els.tagFilterBar.innerHTML = buttons.join('');

    Array.from(els.tagFilterBar.querySelectorAll('[data-tag-filter]')).forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeTag = btn.dataset.tagFilter || '';
        filterAndRenderBeans();
      });
    });
  }

  function filterAndRenderBeans() {
    const search = String(els.beanSearchInput ? els.beanSearchInput.value : '').trim().toLowerCase();

    state.filteredBeans = state.beans.filter((bean) => {
      const matchesTag = !state.activeTag || bean.tags.includes(state.activeTag);
      if (!matchesTag) return false;
      if (!search) return true;

      const haystack = [
        bean.bean,
        bean.roaster,
        bean.origin_country,
        bean.origin_region,
        bean.purchase_country,
        bean.variety,
        bean.producer,
        bean.farm,
        bean.process,
        bean.roast,
        bean.notes,
        bean.photo_text,
        bean.tags.join(' ')
      ].join(' ').toLowerCase();

      return haystack.includes(search);
    });

    renderTagFilters(state.beans);
    renderBeanList();
  }

  function renderBeanList() {
    if (!els.beanList) return;

    if (!state.filteredBeans.length) {
      els.beanList.innerHTML = `<div class="empty-state">No beans found.</div>`;
      return;
    }

    const openBeanId = state.openBeanId || '';

    els.beanList.innerHTML = state.filteredBeans.map((bean) => {
      const flag = countryFlag(bean.origin_country);
      const originLine = [flag, bean.origin_country, bean.origin_region].filter(Boolean).join(' ');
      const isOpen = openBeanId === bean.id;
      const tagHtml = bean.tags.length
        ? `<div class="tags-wrap">${bean.tags.map((tag) => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join('')}</div>`
        : '';
      const brewCount = Number(bean.brew_count || 0);
      const lockBadge = bean.recipe_locked ? `<span class="tag-pill">Locked recipe</span>` : '';

      return `
        <article class="bean-card ${isOpen ? 'bean-card--open' : ''}" data-bean-card="${escapeHtml(bean.id)}">
          <button
            type="button"
            class="bean-card__summary"
            data-bean-toggle="${escapeHtml(bean.id)}"
            aria-expanded="${isOpen ? 'true' : 'false'}"
          >
            <div class="bean-card__summary-main">
              <div>
                <h3>${escapeHtml(bean.bean || 'Untitled bean')}</h3>
                <div class="muted">${escapeHtml(bean.roaster || 'Unknown roaster')}</div>
              </div>
              <div class="bean-card__summary-meta">
                ${originLine ? `<div>${escapeHtml(originLine)}</div>` : ''}
                ${bean.process ? `<div>${escapeHtml(bean.process)}</div>` : ''}
                ${bean.roast ? `<div>${escapeHtml(bean.roast)}</div>` : ''}
                <div>${brewCount} brew${brewCount === 1 ? '' : 's'}</div>
              </div>
            </div>
            <span class="bean-card__chevron" aria-hidden="true">${isOpen ? '−' : '+'}</span>
          </button>

          <div class="bean-card__details ${isOpen ? '' : 'hidden'}" data-bean-details="${escapeHtml(bean.id)}">
            ${lockBadge}
            ${tagHtml}
            ${bean.notes ? `<p class="bean-card__notes">${escapeHtml(bean.notes)}</p>` : ''}
            <div class="action-row">
              <button type="button" class="bean-use-btn" data-bean-id="${escapeHtml(bean.id)}">Use this bean</button>
              <button type="button" class="bean-edit-btn" data-bean-id="${escapeHtml(bean.id)}">Edit</button>
              <button type="button" class="bean-delete-btn bean-delete-btn--ghost" data-bean-id="${escapeHtml(bean.id)}">Delete</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    Array.from(document.querySelectorAll('[data-bean-toggle]')).forEach((btn) => {
      btn.addEventListener('click', () => {
        const beanId = btn.dataset.beanToggle || '';
        state.openBeanId = state.openBeanId === beanId ? '' : beanId;
        renderBeanList();
      });
    });

    Array.from(document.querySelectorAll('.bean-use-btn')).forEach((btn) => {
      btn.addEventListener('click', async () => {
        state.selectedBeanId = btn.dataset.beanId || '';
        if (els.helperBeanSelect) els.helperBeanSelect.value = state.selectedBeanId;
        syncHelperBeanSummary();
        await loadLogsForSelectedBean();
        setView('helper');
      });
    });

    Array.from(document.querySelectorAll('.bean-edit-btn')).forEach((btn) => {
      btn.addEventListener('click', () => {
        const bean = state.beans.find((item) => item.id === btn.dataset.beanId);
        if (bean) openBeanModal(bean);
      });
    });

    Array.from(document.querySelectorAll('.bean-delete-btn')).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const beanId = btn.dataset.beanId;
        if (!beanId) return;
        if (!window.confirm('Delete this bean and all of its brew logs?')) return;

        try {
          setStatus('Deleting bean…', 'info');
          await fetchJson(resolveScriptUrl(), {
            method: 'POST',
            body: { action: 'deleteBean', beanId }
          });

          if (state.openBeanId === beanId) state.openBeanId = '';
          if (state.selectedBeanId === beanId) {
            state.selectedBeanId = '';
            state.currentLogs = [];
            state.currentRecipeData = null;
            renderBrewLogList();
            renderRecipeOutput();
            resetBrewLogForm();
          }

          await loadBeans();
          setStatus('Bean deleted.', 'success');
        } catch (error) {
          setStatus(error.message || 'Could not delete bean.', 'error');
        }
      });
    });
  }

  function renderHelperBeanOptions() {
    if (!els.helperBeanSelect) return;

    const options = [
      `<option value="">Select bean</option>`,
      ...state.beans.map((bean) => `<option value="${escapeHtml(bean.id)}">${escapeHtml(bean.bean || bean.name || 'Untitled bean')}</option>`)
    ];

    els.helperBeanSelect.innerHTML = options.join('');

    if (state.selectedBeanId) {
      els.helperBeanSelect.value = state.selectedBeanId;
    }
  }

  function getSelectedHelperBean() {
    const beanId = els.helperBeanSelect ? els.helperBeanSelect.value : '';
    return state.beans.find((bean) => bean.id === beanId) || null;
  }

  function syncHelperBeanSummary() {
    const bean = getSelectedHelperBean();

    if (!bean) {
      if (els.helperBeanSummary) {
        els.helperBeanSummary.textContent = 'Select a bean to see its summary.';
      }
      if (els.lockRecipeCheckbox) {
        els.lockRecipeCheckbox.checked = false;
      }
      return;
    }

    state.selectedBeanId = bean.id;
    const flag = countryFlag(bean.origin_country);
    const origin = [flag, bean.origin_country, bean.origin_region].filter(Boolean).join(' ');
    const lines = [
      bean.bean || '',
      bean.roaster || '',
      origin || '',
      bean.process || '',
      bean.roast || '',
      `${Number(bean.brew_count || 0)} brew${Number(bean.brew_count || 0) === 1 ? '' : 's'}`
    ].filter(Boolean);

    if (els.helperBeanSummary) {
      els.helperBeanSummary.textContent = lines.join(' · ');
    }

    if (els.lockRecipeCheckbox) {
      els.lockRecipeCheckbox.checked = !!bean.recipe_locked;
    }
  }

  function getLockedRecipeFromBean(bean) {
    if (!bean || !bean.locked_recipe_json) return null;
    try {
      return normalizeRecipeDataShape(JSON.parse(bean.locked_recipe_json));
    } catch (error) {
      return null;
    }
  }

  function getLatestLog() {
    return Array.isArray(state.currentLogs) && state.currentLogs.length ? state.currentLogs[0] : null;
  }

  function renderRecipeStyleToggle(data) {
    if (!els.recipeStyleToggle) return;

    const styles = Array.isArray(data.availableStyles) ? data.availableStyles.map(normalizeRecipeStyleKey) : [];
    if (styles.length <= 1) {
      els.recipeStyleToggle.classList.add('hidden');
      els.recipeStyleToggle.innerHTML = '';
      return;
    }

    els.recipeStyleToggle.classList.remove('hidden');
    els.recipeStyleToggle.innerHTML = styles.map((style) => {
      const label = style === 'iced_half_shaken' ? 'Iced' : 'Hot';
      const active = style === state.currentRecipeStyle ? 'active' : '';
      return `<button type="button" class="recipe-style-btn ${active}" data-recipe-style="${style}">${label}</button>`;
    }).join('');

    Array.from(els.recipeStyleToggle.querySelectorAll('[data-recipe-style]')).forEach((btn) => {
      btn.addEventListener('click', () => {
        state.currentRecipeStyle = normalizeRecipeStyleKey(btn.dataset.recipeStyle || 'hot');
        renderRecipeOutput();
        refillBrewLogForm();
      });
    });
  }

  function renderRecipeOutput() {
    if (!els.helperOutput) return;

    if (!state.currentRecipeData || !state.currentRecipeData.recipes) {
      els.helperOutput.innerHTML = `
        <div class="helper-placeholder">
          Generate a recipe to see grind size, pours, time, and expected notes.
        </div>
      `;
      if (els.recipeStyleToggle) {
        els.recipeStyleToggle.classList.add('hidden');
        els.recipeStyleToggle.innerHTML = '';
      }
      return;
    }

    const recipe = state.currentRecipeData.recipes[state.currentRecipeStyle] || state.currentRecipeData.recipes.hot;
    if (!recipe) {
      els.helperOutput.innerHTML = `<div class="helper-placeholder">No recipe returned.</div>`;
      return;
    }

    renderRecipeStyleToggle(state.currentRecipeData);

    const extraIcedFields = recipe.hot_water_g || recipe.brew_ice_g ? `
      <div class="recipe-grid">
        ${recipe.hot_water_g ? `<div><strong>Hot water</strong><span>${escapeHtml(recipe.hot_water_g)} g</span></div>` : ''}
        ${recipe.brew_ice_g ? `<div><strong>Ice</strong><span>${escapeHtml(recipe.brew_ice_g)} g</span></div>` : ''}
      </div>
    ` : '';

    els.helperOutput.innerHTML = `
      <div class="recipe-output">
        <div class="grinder-chip">Using Eureka Mignon Perfetto</div>

        <div class="recipe-grid">
          <div><strong>Grind</strong><span>${escapeHtml(recipe.grind || '')}</span></div>
          <div><strong>Dose</strong><span>${escapeHtml(recipe.dose_g || '')} g</span></div>
          <div><strong>Water</strong><span>${escapeHtml(recipe.water_total_g || '')} g</span></div>
          <div><strong>Temp</strong><span>${escapeHtml(recipe.water_temp_c || '')} °C</span></div>
          <div><strong>Time</strong><span>${escapeHtml(recipe.target_time || '')}</span></div>
          <div><strong>Ratio</strong><span>${escapeHtml(recipe.ratio || '')}</span></div>
        </div>

        ${extraIcedFields}

        ${recipe.why ? `
          <div class="recipe-block">
            <h4>Why this recipe</h4>
            <p>${escapeHtml(recipe.why)}</p>
          </div>
        ` : ''}

        ${renderPoursHtml(recipe.pours, recipe.hot_water_g || recipe.water_total_g, recipe.target_time)}

        ${recipe.expected_notes ? `
          <div class="recipe-block">
            <h4>Expected notes</h4>
            <p>${escapeHtml(recipe.expected_notes)}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  function resetBrewLogForm() {
    state.brewLogDraftId = '';
    if (els.brewLogForm) els.brewLogForm.reset();
    if (els.brewLogId) els.brewLogId.value = '';
    if (els.brewLogFormTitle) els.brewLogFormTitle.textContent = 'Log this brew';
    if (els.cancelBrewLogEditBtn) els.cancelBrewLogEditBtn.classList.add('hidden');
    refillBrewLogForm();

    if (!state.selectedBeanId) {
      setBrewLogStatus('Select a bean to begin logging brews.', 'info');
    } else {
      setBrewLogStatus('Autofill reset. You can log a fresh brew now.', 'info');
    }
  }

  function refillBrewLogForm() {
    if (state.brewLogDraftId) return;

    const latestLog = getLatestLog();
    const recipe = state.currentRecipeData && state.currentRecipeData.recipes
      ? (state.currentRecipeData.recipes[state.currentRecipeStyle] || state.currentRecipeData.recipes.hot)
      : null;

    if (els.brewDate && !els.brewDate.value) {
      els.brewDate.value = new Date().toISOString().slice(0, 10);
    }

    const activeStyleValue = String(state.currentRecipeStyle || 'hot').indexOf('iced') !== -1 ? 'iced' : 'hot';

    // Right after generating (or loading a locked) recipe, the recipe's numbers are
    // what you're about to brew with — so they win over the previous log's values.
    if (state.autofillPreference === 'recipe' && recipe) {
      if (els.brewGrind) els.brewGrind.value = recipe.grind || '';
      if (els.brewDose) els.brewDose.value = recipe.dose_g || '';
      if (els.brewWater) els.brewWater.value = recipe.water_total_g || '';
      if (els.brewTemp) els.brewTemp.value = recipe.water_temp_c || '';
      if (els.brewStyle) els.brewStyle.value = activeStyleValue;
      if (els.brewNotes) els.brewNotes.value = '';
      setBrewLogStatus('Autofilled from the current generated recipe.', 'success');
      return;
    }

    if (latestLog) {
      if (els.brewGrind) els.brewGrind.value = latestLog.grind || '';
      if (els.brewDose) els.brewDose.value = latestLog.dose_g || '';
      if (els.brewWater) els.brewWater.value = latestLog.water_g || '';
      if (els.brewTemp) els.brewTemp.value = latestLog.water_temp_c || '';
      if (els.brewStyle) {
        els.brewStyle.value = String(latestLog.brew_style || '').toLowerCase().indexOf('iced') !== -1 ? 'iced' : 'hot';
      }
      if (els.brewNotes) els.brewNotes.value = latestLog.notes || '';
      setBrewLogStatus('Autofilled from the latest brew log.', 'success');
      return;
    }

    if (recipe) {
      if (els.brewGrind) els.brewGrind.value = recipe.grind || '';
      if (els.brewDose) els.brewDose.value = recipe.dose_g || '';
      if (els.brewWater) els.brewWater.value = recipe.water_total_g || '';
      if (els.brewTemp) els.brewTemp.value = recipe.water_temp_c || '';
      if (els.brewStyle) els.brewStyle.value = activeStyleValue;
      if (els.brewNotes) els.brewNotes.value = '';
      setBrewLogStatus('Autofilled from the current generated recipe.', 'success');
      return;
    }

    if (state.selectedBeanId) {
      setBrewLogStatus('No previous brew or recipe yet. Fill in the brew details manually.', 'info');
    }
  }

  function renderBrewLogList() {
    if (!els.brewLogList) return;

    if (!state.selectedBeanId) {
      els.brewLogList.innerHTML = `<div class="empty-state">Select a bean to see its brew log.</div>`;
      return;
    }

    if (!state.currentLogs.length) {
      els.brewLogList.innerHTML = `<div class="empty-state">No brew logs yet for this bean.</div>`;
      return;
    }

    els.brewLogList.innerHTML = state.currentLogs.map((log) => {
      const isOpen = state.openLogIds.has(log.id);
      return `
        <article class="brew-log-item">
          <button
            type="button"
            class="brew-log-item__summary"
            data-log-toggle="${escapeHtml(log.id)}"
            aria-expanded="${isOpen ? 'true' : 'false'}"
          >
            <span class="brew-log-item__summary-date">
              <span>☕</span>
              <span>${escapeHtml(formatLogDate(log.brew_date))}</span>
              ${brewStyleBadgeHtml(log.brew_style)}
            </span>
            <span class="brew-log-item__summary-toggle" aria-hidden="true">${isOpen ? '−' : '+'}</span>
          </button>

          <div class="brew-log-item__details ${isOpen ? '' : 'hidden'}">
            <div class="brew-log-item__grid">
              <div><strong>Grind</strong>${escapeHtml(log.grind || '')}</div>
              <div><strong>Dose</strong>${escapeHtml(log.dose_g || '')} g</div>
              <div><strong>Water</strong>${escapeHtml(log.water_g || '')} g</div>
              <div><strong>Temp</strong>${escapeHtml(log.water_temp_c || '')} °C</div>
            </div>
            ${log.notes ? `<div class="brew-log-item__notes">${escapeHtml(log.notes || '')}</div>` : ''}
            <div class="action-row">
              <button type="button" class="bean-edit-btn" data-log-edit="${escapeHtml(log.id)}">Edit Log</button>
              <button type="button" class="bean-delete-btn bean-delete-btn--ghost" data-log-delete="${escapeHtml(log.id)}">Delete Log</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    Array.from(els.brewLogList.querySelectorAll('[data-log-toggle]')).forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.logToggle || '';
        if (!id) return;
        if (state.openLogIds.has(id)) {
          state.openLogIds.delete(id);
        } else {
          state.openLogIds.add(id);
        }
        renderBrewLogList();
      });
    });

    Array.from(els.brewLogList.querySelectorAll('[data-log-edit]')).forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.logEdit || '';
        const log = state.currentLogs.find((item) => item.id === id);
        if (!log) return;
        startEditBrewLog(log);
      });
    });

    Array.from(els.brewLogList.querySelectorAll('[data-log-delete]')).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.logDelete || '';
        if (!id) return;
        if (!window.confirm('Delete this brew log?')) return;

        try {
          await fetchJson(resolveScriptUrl(), {
            method: 'POST',
            body: {
              action: 'deleteBrewLog',
              logId: id
            }
          });
          state.openLogIds.delete(id);
          await loadLogsForSelectedBean();
          await refreshSelectedBeanCounts();
          setStatus('Brew log deleted.', 'success');
          setBrewLogStatus('Brew log deleted.', 'success');
        } catch (error) {
          setStatus(error.message || 'Could not delete brew log.', 'error');
          setBrewLogStatus(error.message || 'Could not delete brew log.', 'error');
        }
      });
    });
  }

  async function loadLogsForSelectedBean() {
    // Fresh log data means the latest log is the source of truth again,
    // until the next recipe is generated.
    state.autofillPreference = 'log';

    const bean = getSelectedHelperBean();
    if (!bean || !bean.id) {
      state.currentLogs = [];
      state.openLogIds = new Set();
      renderBrewLogList();
      resetBrewLogForm();
      setBrewLogStatus('Select a bean to begin logging brews.', 'info');
      return;
    }

    try {
      const response = await fetchJson(`${resolveScriptUrl()}?type=logs&beanId=${encodeURIComponent(bean.id)}`);
      state.currentLogs = Array.isArray(response.data) ? response.data : [];
      state.openLogIds = new Set();
      renderBrewLogList();
      resetBrewLogForm();

      if (state.currentLogs.length) {
        setBrewLogStatus('Loaded brew history for this bean.', 'success');
      } else {
        setBrewLogStatus('No brew logs yet for this bean.', 'info');
      }
    } catch (error) {
      state.currentLogs = [];
      renderBrewLogList();
      resetBrewLogForm();
      setStatus(error.message || 'Could not load brew logs.', 'error');
      setBrewLogStatus(error.message || 'Could not load brew logs.', 'error');
    }
  }

  function startEditBrewLog(log) {
    state.brewLogDraftId = log.id || '';
    if (els.brewLogFormTitle) els.brewLogFormTitle.textContent = 'Edit brew log';
    if (els.cancelBrewLogEditBtn) els.cancelBrewLogEditBtn.classList.remove('hidden');
    if (els.brewLogId) els.brewLogId.value = log.id || '';
    if (els.brewDate) els.brewDate.value = log.brew_date || '';
    if (els.brewGrind) els.brewGrind.value = log.grind || '';
    if (els.brewDose) els.brewDose.value = log.dose_g || '';
    if (els.brewWater) els.brewWater.value = log.water_g || '';
    if (els.brewTemp) els.brewTemp.value = log.water_temp_c || '';
    if (els.brewStyle) {
      els.brewStyle.value = String(log.brew_style || '').toLowerCase().indexOf('iced') !== -1 ? 'iced' : 'hot';
    }
    if (els.brewNotes) els.brewNotes.value = log.notes || '';
    setBrewLogStatus('Editing an existing brew log.', 'warn');
    if (els.brewLogForm) els.brewLogForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function saveBrewLog(event) {
    event.preventDefault();

    const bean = getSelectedHelperBean();
    if (!bean || !bean.id) {
      setStatus('Select a bean before saving a brew log.', 'warn');
      setBrewLogStatus('Select a bean before saving a brew log.', 'warn');
      return;
    }

    const logData = {
      id: els.brewLogId ? els.brewLogId.value.trim() : '',
      beanId: bean.id,
      brew_date: els.brewDate ? els.brewDate.value.trim() : '',
      grind: els.brewGrind ? els.brewGrind.value.trim() : '',
      dose_g: els.brewDose ? els.brewDose.value.trim() : '',
      water_g: els.brewWater ? els.brewWater.value.trim() : '',
      water_temp_c: els.brewTemp ? els.brewTemp.value.trim() : '',
      brew_style: els.brewStyle ? els.brewStyle.value : 'hot',
      notes: els.brewNotes ? els.brewNotes.value.trim() : ''
    };

    const action = logData.id ? 'updateBrewLog' : 'saveBrewLog';

    try {
      setStatus(logData.id ? 'Updating brew log…' : 'Saving brew log…', 'info');
      setBrewLogStatus(logData.id ? 'Updating brew log…' : 'Saving brew log…', 'info');
      setButtonsBusy([els.saveBrewLogBtn], true);

      await fetchJson(resolveScriptUrl(), {
        method: 'POST',
        body: {
          action,
          logData
        }
      });

      await loadLogsForSelectedBean();
      await refreshSelectedBeanCounts();
      setStatus(logData.id ? 'Brew log updated.' : 'Brew log saved.', 'success');
      setBrewLogStatus(logData.id ? 'Brew log updated.' : 'Brew log saved.', 'success');
    } catch (error) {
      setStatus(error.message || 'Could not save brew log.', 'error');
      setBrewLogStatus(error.message || 'Could not save brew log.', 'error');
    } finally {
      setButtonsBusy([els.saveBrewLogBtn], false);
    }
  }

  async function refreshSelectedBeanCounts() {
    const currentSelected = state.selectedBeanId;
    await loadBeans();
    state.selectedBeanId = currentSelected;
    if (els.helperBeanSelect) {
      els.helperBeanSelect.value = currentSelected;
    }
    syncHelperBeanSummary();
  }

  async function saveRecipeLockState() {
    const bean = getSelectedHelperBean();
    if (!bean) {
      setRecipeEngineStatus('Select a bean before changing recipe lock state.', 'warn');
      return;
    }

    const shouldLock = !!(els.lockRecipeCheckbox && els.lockRecipeCheckbox.checked);

    try {
      if (shouldLock) {
        if (!state.currentRecipeData) {
          setRecipeEngineStatus('Generate a recipe first, then lock it.', 'warn');
          return;
        }

        await fetchJson(resolveScriptUrl(), {
          method: 'POST',
          body: {
            action: 'lockRecipe',
            beanId: bean.id,
            recipeData: state.currentRecipeData
          }
        });

        bean.recipe_locked = true;
        bean.locked_recipe_json = JSON.stringify(state.currentRecipeData);
        setRecipeEngineStatus('Ideal recipe locked. Future generate actions can skip AI.', 'success');
        setStatus('Recipe locked.', 'success');
      } else {
        await fetchJson(resolveScriptUrl(), {
          method: 'POST',
          body: {
            action: 'unlockRecipe',
            beanId: bean.id
          }
        });

        bean.recipe_locked = false;
        bean.locked_recipe_json = '';
        setRecipeEngineStatus('Recipe unlocked. AI can generate new versions again.', 'warn');
        setStatus('Recipe unlocked.', 'success');
      }

      await refreshSelectedBeanCounts();
    } catch (error) {
      setRecipeEngineStatus(error.message || 'Could not save recipe lock state.', 'error');
      setStatus(error.message || 'Could not save recipe lock state.', 'error');
    }
  }

  async function generateRecipe(forceAi = false) {
    const bean = getSelectedHelperBean();

    if (!bean) {
      if (els.recipeStatus) {
        els.recipeStatus.textContent = 'Select a bean first.';
      }
      setStatus('Select a bean first.', 'warn');
      return;
    }

    const lockedRecipe = getLockedRecipeFromBean(bean);
    const isLocked = !!bean.recipe_locked;

    if (isLocked && lockedRecipe && !forceAi) {
      state.currentRecipeData = normalizeRecipeDataShape(lockedRecipe);
      state.currentRecipeStyle = state.currentRecipeData.defaultStyle || 'hot';
      state.autofillPreference = 'recipe';
      renderRecipeOutput();
      refillBrewLogForm();
      setRecipeEngineStatus('This bean is locked to its ideal recipe. AI generation was skipped.', 'success');
      if (els.recipeStatus) els.recipeStatus.textContent = 'Loaded locked recipe.';
      setStatus('Loaded locked recipe.', 'success');
      return;
    }

    const beanData = {
      id: bean.id,
      bean: bean.bean || bean.name || '',
      name: bean.bean || bean.name || '',
      roaster: bean.roaster || '',
      origin_country: bean.origin_country || '',
      origin_region: bean.origin_region || '',
      purchase_country: bean.purchase_country || '',
      variety: bean.variety || '',
      producer: bean.producer || '',
      farm: bean.farm || '',
      altitude: bean.altitude || '',
      process: bean.process || '',
      roast: bean.roast || '',
      notes: bean.notes || '',
      tags: bean.tags || [],
      photo_text: bean.photo_text || '',
      recipe_locked: bean.recipe_locked,
      locked_recipe_json: bean.locked_recipe_json || ''
    };

    try {
      if (els.recipeStatus) {
        els.recipeStatus.textContent = 'Generating recipe…';
      }
      setStatus('Generating recipe…', 'info');
      setButtonsBusy([els.generateRecipeBtn, els.forceRegenerateBtn], true);

      const response = await fetchJson(resolveScriptUrl(), {
        method: 'POST',
        body: {
          action: 'generateRecipe',
          beanData,
          latestLog: getLatestLog(),
          forceAi: !!forceAi
        }
      });

      state.currentRecipeData = normalizeRecipeDataShape(response.data || null);
      state.currentRecipeStyle = (state.currentRecipeData && state.currentRecipeData.defaultStyle) || 'hot';
      state.autofillPreference = 'recipe';
      renderRecipeOutput();
      refillBrewLogForm();

      const meta = state.currentRecipeData && state.currentRecipeData.meta ? state.currentRecipeData.meta : null;
      if (meta && meta.source === 'fallback') {
        setRecipeEngineStatus(meta.message || 'Fallback recipe used because AI was unavailable.', 'warn');
      } else if (meta && meta.source === 'locked') {
        setRecipeEngineStatus(meta.message || 'Locked recipe loaded.', 'success');
      } else if (meta && meta.source === 'ai') {
        setRecipeEngineStatus(meta.message || 'Recipe generated with AI.', 'success');
      } else {
        setRecipeEngineStatus('Recipe generated.', 'success');
      }

      if (els.recipeStatus) {
        els.recipeStatus.textContent = 'Recipe ready.';
      }
      setStatus('Recipe generated.', 'success');
    } catch (error) {
      if (els.recipeStatus) {
        els.recipeStatus.textContent = error.message || 'Recipe generation failed.';
      }
      setRecipeEngineStatus(error.message || 'Recipe generation failed.', 'error');
      setStatus(error.message || 'Recipe generation failed.', 'error');
    } finally {
      setButtonsBusy([els.generateRecipeBtn, els.forceRegenerateBtn], false);
    }
  }

  function resetUploadedPhoto() {
    state.uploadedPhoto = {
      fileId: '',
      fileName: '',
      driveLink: '',
      previewDataUrl: '',
      uploadDataUrl: '',
      photoText: '',
      ocrStatus: '',
      ocrSource: ''
    };
  }

  function renderBeanAvatar() {
    if (!els.beanAvatar) return;

    if (!state.uploadedPhoto.previewDataUrl) {
      els.beanAvatar.innerHTML = `<div class="bean-photo-preview--empty">📷 Tap here to take a photo of the bag.</div>`;
      return;
    }

    els.beanAvatar.innerHTML = `<img src="${escapeHtml(state.uploadedPhoto.previewDataUrl)}" alt="Bean photo preview" />`;
  }

  function renderPhotoMeta() {
    if (els.beanPhotoMeta) {
      if (state.uploadedPhoto.fileName) {
        const parts = [state.uploadedPhoto.fileName];
        if (state.uploadedPhoto.driveLink) {
          parts.push('Saved to Drive');
        }
        els.beanPhotoMeta.textContent = parts.join(' · ');
      } else {
        els.beanPhotoMeta.textContent = 'No photo uploaded yet.';
      }
    }

    if (els.ocrStatusLine) {
      const status = state.uploadedPhoto.ocrStatus || 'not run yet';
      const source = state.uploadedPhoto.ocrSource ? ` (${state.uploadedPhoto.ocrSource})` : '';
      els.ocrStatusLine.textContent = `OCR: ${status}${source}`;

      els.ocrStatusLine.classList.remove('ocr-status--neutral', 'ocr-status--success', 'ocr-status--warn');
      if (status === 'ok') {
        els.ocrStatusLine.classList.add('ocr-status--success');
      } else if (status === 'empty' || status === 'missing_api_key') {
        els.ocrStatusLine.classList.add('ocr-status--warn');
      } else {
        els.ocrStatusLine.classList.add('ocr-status--neutral');
      }
    }

    if (els.beanPhotoText) {
      els.beanPhotoText.value = state.uploadedPhoto.photoText || '';
    }

    if (els.beanExistingPhotoFileId) els.beanExistingPhotoFileId.value = state.uploadedPhoto.fileId || '';
    if (els.beanExistingPhotoFileName) els.beanExistingPhotoFileName.value = state.uploadedPhoto.fileName || '';
    if (els.beanExistingPhotoDriveLink) els.beanExistingPhotoDriveLink.value = state.uploadedPhoto.driveLink || '';
    if (els.beanExistingPhotoPreviewDataUrl) els.beanExistingPhotoPreviewDataUrl.value = state.uploadedPhoto.previewDataUrl || '';
  }

  function renderBeanTagsPreview() {
    if (!els.beanTagsPreview) return;

    if (!state.beanTags.length) {
      els.beanTagsPreview.innerHTML = `<div class="tags-empty">No tags added yet.</div>`;
      return;
    }

    els.beanTagsPreview.innerHTML = state.beanTags.map((tag, index) => `
      <button type="button" class="tag-pill tag-pill--removable" data-tag-index="${index}">
        ${escapeHtml(tag)} <span aria-hidden="true">×</span>
      </button>
    `).join('');

    Array.from(els.beanTagsPreview.querySelectorAll('[data-tag-index]')).forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.tagIndex);
        state.beanTags.splice(idx, 1);
        renderBeanTagsPreview();
      });
    });
  }

  function openBeanModal(bean = null) {
    state.modalMode = bean ? 'edit' : 'add';

    if (els.addBeanSubtitle) {
      els.addBeanSubtitle.textContent = bean
        ? 'Review OCR, update details, then save changes.'
        : 'Choose a photo, run bean research, then save.';
    }

    if (els.addBeanForm) els.addBeanForm.reset();
    state.beanTags = [];
    resetUploadedPhoto();

    if (bean) {
      if (els.beanId) els.beanId.value = bean.id || '';
      if (els.beanName) els.beanName.value = bean.bean || bean.name || '';
      if (els.beanRoaster) els.beanRoaster.value = bean.roaster || '';
      if (els.beanOriginCountry) els.beanOriginCountry.value = bean.origin_country || '';
      if (els.beanOriginRegion) els.beanOriginRegion.value = bean.origin_region || '';
      if (els.beanPurchaseCountry) els.beanPurchaseCountry.value = bean.purchase_country || '';
      if (els.beanVariety) els.beanVariety.value = bean.variety || '';
      if (els.beanProducer) els.beanProducer.value = bean.producer || '';
      if (els.beanFarm) els.beanFarm.value = bean.farm || '';
      if (els.beanAltitude) els.beanAltitude.value = bean.altitude || '';
      if (els.beanProcess) els.beanProcess.value = bean.process || '';
      if (els.beanRoast) els.beanRoast.value = bean.roast || '';
      if (els.beanNotes) els.beanNotes.value = bean.notes || '';

      state.beanTags = normalizeTags(bean.tags);
      state.uploadedPhoto = {
        fileId: bean.photo_file_id || '',
        fileName: bean.photo_file_name || '',
        driveLink: bean.photo_drive_link || '',
        previewDataUrl: bean.photo_preview_data_url || '',
        uploadDataUrl: '',
        photoText: bean.photo_text || '',
        ocrStatus: bean.photo_text ? 'ok' : 'not run yet',
        ocrSource: bean.photo_text ? 'saved' : ''
      };
    } else if (els.beanId) {
      els.beanId.value = '';
    }

    renderBeanTagsPreview();
    renderBeanAvatar();
    renderPhotoMeta();

    if (els.researchStatus) {
      els.researchStatus.textContent = '';
    }

    if (els.addBeanModal) {
      els.addBeanModal.classList.remove('hidden');
      els.addBeanModal.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('modal-open');
  }

  function closeBeanModal() {
    if (els.addBeanModal) {
      els.addBeanModal.classList.add('hidden');
      els.addBeanModal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('modal-open');
  }

  function collectBeanFormData() {
    // Look up the bean actually being edited in the modal (by its hidden id field),
    // NOT the bean selected in the Recipe Helper. Using the helper selection here
    // could copy another bean's lock state and locked recipe onto this one.
    const editingId = els.beanId ? els.beanId.value.trim() : '';
    const editingBean = editingId
      ? state.beans.find((item) => item.id === editingId) || null
      : null;

    return {
      id: els.beanId ? els.beanId.value.trim() : '',
      bean: els.beanName ? els.beanName.value.trim() : '',
      name: els.beanName ? els.beanName.value.trim() : '',
      roaster: els.beanRoaster ? els.beanRoaster.value.trim() : '',
      origin_country: els.beanOriginCountry ? els.beanOriginCountry.value.trim() : '',
      origin_region: els.beanOriginRegion ? els.beanOriginRegion.value.trim() : '',
      purchase_country: els.beanPurchaseCountry ? els.beanPurchaseCountry.value.trim() : '',
      variety: els.beanVariety ? els.beanVariety.value.trim() : '',
      producer: els.beanProducer ? els.beanProducer.value.trim() : '',
      farm: els.beanFarm ? els.beanFarm.value.trim() : '',
      altitude: els.beanAltitude ? els.beanAltitude.value.trim() : '',
      process: els.beanProcess ? els.beanProcess.value.trim() : '',
      roast: els.beanRoast ? els.beanRoast.value.trim() : '',
      notes: els.beanNotes ? els.beanNotes.value.trim() : '',
      tags: uniqueStrings(state.beanTags.slice()),
      photo_file_id: state.uploadedPhoto.fileId || '',
      photo_file_name: state.uploadedPhoto.fileName || '',
      photo_drive_link: state.uploadedPhoto.driveLink || '',
      photo_preview_data_url: state.uploadedPhoto.previewDataUrl || '',
      photo_text: els.beanPhotoText ? els.beanPhotoText.value.trim() : state.uploadedPhoto.photoText,
      recipe_locked: editingBean ? !!editingBean.recipe_locked : false,
      locked_recipe_json: editingBean ? editingBean.locked_recipe_json || '' : ''
    };
  }

  function applyResearchedBean(bean) {
    if (els.beanName) els.beanName.value = bean.bean || bean.name || '';
    if (els.beanRoaster) els.beanRoaster.value = bean.roaster || '';
    if (els.beanOriginCountry) els.beanOriginCountry.value = bean.origin_country || '';
    if (els.beanOriginRegion) els.beanOriginRegion.value = bean.origin_region || '';
    if (els.beanPurchaseCountry) els.beanPurchaseCountry.value = bean.purchase_country || '';
    if (els.beanVariety) els.beanVariety.value = bean.variety || '';
    if (els.beanProducer) els.beanProducer.value = bean.producer || '';
    if (els.beanFarm) els.beanFarm.value = bean.farm || '';
    if (els.beanAltitude) els.beanAltitude.value = bean.altitude || '';
    if (els.beanProcess) els.beanProcess.value = bean.process || '';
    if (els.beanRoast) els.beanRoast.value = bean.roast || '';
    if (els.beanNotes) els.beanNotes.value = bean.notes || '';
    if (els.beanPhotoText) els.beanPhotoText.value = bean.photo_text || '';

    state.beanTags = uniqueStrings(normalizeTags(bean.tags));
    renderBeanTagsPreview();

    state.uploadedPhoto.photoText = bean.photo_text || state.uploadedPhoto.photoText;
    renderPhotoMeta();
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function setButtonsBusy(buttons, busy) {
    buttons.filter(Boolean).forEach((btn) => {
      btn.disabled = !!busy;
      btn.classList.toggle('is-busy', !!busy);
    });
  }

  // Phone cameras produce 10–50MB images; base64-encoding those makes uploads
  // slow/fragile and blows past Sheets' 50k-character cell limit. Downscale
  // before anything leaves the device.
  function resizeImageDataUrl(dataUrl, maxDimension, quality) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (error) {
          resolve(dataUrl); // Fall back to the original on any canvas failure.
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  function getActiveSelectedPhotoFile() {
    const galleryFile = els.beanPhotoFile && els.beanPhotoFile.files && els.beanPhotoFile.files[0]
      ? els.beanPhotoFile.files[0]
      : null;

    const cameraFile = els.beanPhotoCameraFile && els.beanPhotoCameraFile.files && els.beanPhotoCameraFile.files[0]
      ? els.beanPhotoCameraFile.files[0]
      : null;

    return galleryFile || cameraFile || null;
  }

  async function syncSelectedPhotoPreview(file) {
    if (!file) return;

    setStatus('Optimizing photo…', 'info');

    const originalDataUrl = await readFileAsDataUrl(file);
    // ~1600px is plenty for Vision OCR on a bag label; ~480px thumbnail
    // is what we display and what gets stored in the sheet.
    const uploadDataUrl = await resizeImageDataUrl(originalDataUrl, 1600, 0.85);
    const previewDataUrl = await resizeImageDataUrl(uploadDataUrl, 480, 0.7);

    state.uploadedPhoto = {
      ...state.uploadedPhoto,
      fileName: file.name,
      previewDataUrl,
      uploadDataUrl,
      driveLink: '',
      fileId: '',
      ocrStatus: 'selected',
      ocrSource: 'local',
      photoText: state.uploadedPhoto.photoText || ''
    };

    renderBeanAvatar();
    renderPhotoMeta();
    setStatus('Photo ready. Tap Research Bean to upload, run OCR, and apply research.', 'info');
  }

  async function uploadPhotoIfNeeded() {
    const file = getActiveSelectedPhotoFile();

    if (!file) {
      return state.uploadedPhoto;
    }

    const needsUpload = !state.uploadedPhoto.fileId || state.uploadedPhoto.fileName !== file.name;

    if (!needsUpload && state.uploadedPhoto.previewDataUrl) {
      return state.uploadedPhoto;
    }

    setStatus('Uploading photo and running OCR…', 'info');
    if (els.researchStatus) {
      els.researchStatus.textContent = 'Uploading photo and running OCR…';
    }

    // Send the larger (but downscaled) version to Drive + Vision for OCR quality;
    // keep the small thumbnail as the preview that gets saved to the sheet.
    const uploadDataUrl = state.uploadedPhoto.uploadDataUrl
      || state.uploadedPhoto.previewDataUrl
      || await resizeImageDataUrl(await readFileAsDataUrl(file), 1600, 0.85);

    const response = await fetchJson(resolveScriptUrl(), {
      method: 'POST',
      body: {
        action: 'uploadBeanPhoto',
        previewDataUrl: uploadDataUrl,
        fileName: file.name
      }
    });

    const data = response.data || {};
    state.uploadedPhoto = {
      fileId: data.fileId || '',
      fileName: data.fileName || file.name,
      driveLink: data.driveLink || '',
      previewDataUrl: state.uploadedPhoto.previewDataUrl || uploadDataUrl,
      uploadDataUrl,
      photoText: data.photoText || '',
      ocrStatus: data.ocrStatus || '',
      ocrSource: data.ocrSource || ''
    };

    if (data.driveStatus && String(data.driveStatus).indexOf('failed') === 0) {
      setStatus(`Photo OCR ran, but the Drive upload failed (${data.driveStatus}). Check the photo folder in Settings.`, 'warn');
    }

    renderBeanAvatar();
    renderPhotoMeta();
    return state.uploadedPhoto;
  }

  async function researchBean() {
    if (state.isResearchingBean) return;

    state.isResearchingBean = true;
    setButtonsBusy([els.researchBeanBtn], true);

    try {
      await uploadPhotoIfNeeded();

      const beanData = collectBeanFormData();

      if (els.researchStatus) {
        els.researchStatus.textContent = 'Researching bean and translating to English…';
      }
      setStatus('Researching bean…', 'info');

      const response = await fetchJson(resolveScriptUrl(), {
        method: 'POST',
        body: { action: 'researchBean', beanData }
      });

      const researchedBean = response.data && response.data.bean ? response.data.bean : null;
      if (!researchedBean) throw new Error('No researched bean returned.');

      applyResearchedBean(researchedBean);

      if (els.researchStatus) {
        els.researchStatus.textContent = 'Research complete. OCR and English details applied.';
      }
      setStatus('Research complete.', 'success');
    } catch (error) {
      if (els.researchStatus) {
        els.researchStatus.textContent = error.message || 'Research failed.';
      }
      setStatus(error.message || 'Research failed.', 'error');
    } finally {
      state.isResearchingBean = false;
      setButtonsBusy([els.researchBeanBtn], false);
    }
  }

  async function saveBean(event) {
    event.preventDefault();

    const beanData = collectBeanFormData();
    const action = beanData.id ? 'updateBean' : 'saveBean';

    try {
      setStatus(beanData.id ? 'Updating bean…' : 'Saving bean…', 'info');
      const response = await fetchJson(resolveScriptUrl(), {
        method: 'POST',
        body: { action, beanData }
      });

      const savedBean = response.data && response.data.bean ? response.data.bean : null;
      if (!savedBean) throw new Error('Bean save did not return a bean.');

      closeBeanModal();
      await loadBeans();

      if (state.selectedBeanId === savedBean.id) {
        if (els.helperBeanSelect) els.helperBeanSelect.value = state.selectedBeanId;
        syncHelperBeanSummary();
      }

      setStatus(beanData.id ? 'Bean updated.' : 'Bean saved.', 'success');
    } catch (error) {
      setStatus(error.message || 'Could not save bean.', 'error');
    }
  }

  function handleTagInputKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ',') return;

    event.preventDefault();
    const raw = els.beanTagInput ? els.beanTagInput.value.trim() : '';
    if (!raw) return;

    const additions = raw.split(',').map((item) => item.trim()).filter(Boolean);
    state.beanTags = uniqueStrings(state.beanTags.concat(additions));
    if (els.beanTagInput) els.beanTagInput.value = '';
    renderBeanTagsPreview();
  }

  function handleTagInputBlur() {
    const raw = els.beanTagInput ? els.beanTagInput.value.trim() : '';
    if (!raw) return;

    const additions = raw.split(',').map((item) => item.trim()).filter(Boolean);
    state.beanTags = uniqueStrings(state.beanTags.concat(additions));
    if (els.beanTagInput) els.beanTagInput.value = '';
    renderBeanTagsPreview();
  }

  function bindEvents() {
    els.navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        setView(btn.dataset.view || 'library');
      });
    });

    if (els.beanSearchInput) {
      els.beanSearchInput.addEventListener('input', filterAndRenderBeans);
    }

    if (els.helperBeanSelect) {
      els.helperBeanSelect.addEventListener('change', async () => {
        state.selectedBeanId = els.helperBeanSelect.value || '';
        syncHelperBeanSummary();
        await loadLogsForSelectedBean();
      });
    }

    if (els.generateRecipeBtn) {
      els.generateRecipeBtn.addEventListener('click', () => generateRecipe(false));
    }

    if (els.saveRecipeLockBtn) {
      els.saveRecipeLockBtn.addEventListener('click', saveRecipeLockState);
    }

    if (els.forceRegenerateBtn) {
      els.forceRegenerateBtn.addEventListener('click', () => generateRecipe(true));
    }

    if (els.brewLogForm) {
      els.brewLogForm.addEventListener('submit', saveBrewLog);
    }

    if (els.resetBrewLogBtn) {
      els.resetBrewLogBtn.addEventListener('click', () => {
        state.brewLogDraftId = '';
        if (els.brewLogId) els.brewLogId.value = '';
        if (els.brewLogFormTitle) els.brewLogFormTitle.textContent = 'Log this brew';
        if (els.cancelBrewLogEditBtn) els.cancelBrewLogEditBtn.classList.add('hidden');
        if (els.brewLogForm) els.brewLogForm.reset();
        refillBrewLogForm();
      });
    }

    if (els.cancelBrewLogEditBtn) {
      els.cancelBrewLogEditBtn.addEventListener('click', resetBrewLogForm);
    }

    if (els.settingsForm) {
      els.settingsForm.addEventListener('submit', saveSettings);
    }

    if (els.settingsLocked) {
      els.settingsLocked.addEventListener('change', () => {
        if (!els.settingsLocked.checked) {
          const ok = window.confirm(
            'Unlock shared settings for editing?\n\nRemember to tick the lock again before saving so they stay protected.'
          );
          if (!ok) {
            els.settingsLocked.checked = true;
            return;
          }
        }
        state.settings.settingsLocked = els.settingsLocked.checked;
        applySettingsLockState();
      });
    }

    if (els.photoFolder) {
      els.photoFolder.addEventListener('input', updatePhotoFolderHint);
    }

    if (els.themeToggleBtn) {
      els.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    if (els.openAddBeanBtn) {
      els.openAddBeanBtn.addEventListener('click', () => openBeanModal());
    }

    // Bottom-nav "Add" button (mobile)
    Array.from(document.querySelectorAll('[data-open-add-bean]')).forEach((btn) => {
      btn.addEventListener('click', () => openBeanModal());
    });

    // Tapping the photo preview opens the camera (falls back to gallery)
    if (els.beanAvatar) {
      els.beanAvatar.addEventListener('click', () => {
        if (els.beanPhotoCameraFile) {
          els.beanPhotoCameraFile.click();
        } else if (els.beanPhotoFile) {
          els.beanPhotoFile.click();
        }
      });
    }

    if (els.closeAddBeanBtn) {
      els.closeAddBeanBtn.addEventListener('click', closeBeanModal);
    }

    if (els.addBeanModal) {
      els.addBeanModal.addEventListener('click', (event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.dataset.closeAddBean === 'true') {
          closeBeanModal();
        }
      });
    }

    if (els.pickPhotoBtn) {
      els.pickPhotoBtn.addEventListener('click', () => {
        if (els.beanPhotoFile) {
          els.beanPhotoFile.click();
        }
      });
    }

    if (els.cameraPhotoBtn) {
      els.cameraPhotoBtn.addEventListener('click', () => {
        if (els.beanPhotoCameraFile) {
          els.beanPhotoCameraFile.click();
        }
      });
    }

    if (els.beanPhotoFile) {
      els.beanPhotoFile.addEventListener('change', async () => {
        if (!els.beanPhotoFile.files || !els.beanPhotoFile.files[0]) return;
        await syncSelectedPhotoPreview(els.beanPhotoFile.files[0]);
        if (els.beanPhotoCameraFile) {
          els.beanPhotoCameraFile.value = '';
        }
      });
    }

    if (els.beanPhotoCameraFile) {
      els.beanPhotoCameraFile.addEventListener('change', async () => {
        if (!els.beanPhotoCameraFile.files || !els.beanPhotoCameraFile.files[0]) return;
        await syncSelectedPhotoPreview(els.beanPhotoCameraFile.files[0]);
        if (els.beanPhotoFile) {
          els.beanPhotoFile.value = '';
        }
      });
    }

    if (els.researchBeanBtn) {
      els.researchBeanBtn.addEventListener('click', researchBean);
    }

    if (els.addBeanForm) {
      els.addBeanForm.addEventListener('submit', saveBean);
    }

    if (els.beanTagInput) {
      els.beanTagInput.addEventListener('keydown', handleTagInputKeydown);
      els.beanTagInput.addEventListener('blur', handleTagInputBlur);
    }
  }

  async function init() {
    applyTheme(getPreferredTheme());
    populateCountryDatalist();
    bindEvents();
    setView('library');
    renderRecipeOutput();
    renderBeanTagsPreview();
    renderBeanAvatar();
    renderPhotoMeta();
    renderBrewLogList();
    resetBrewLogForm();
    setRecipeEngineStatus('No recipe generated yet.', 'info');
    setBrewLogStatus('Select a bean to begin logging brews.', 'info');

    try {
      await loadSettings();
    } catch (error) {
      setStatus(error.message || 'Could not load settings.', 'error');
    }

    try {
      await loadBeans();
    } catch (error) {
      setStatus(error.message || 'Could not load beans.', 'error');
    }
  }

  init().catch((error) => {
    console.error(error);
    setStatus(error.message || 'App initialization failed.', 'error');
  });
});
