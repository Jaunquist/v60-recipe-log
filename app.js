document.addEventListener('DOMContentLoaded', () => {
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMNB7D2p_qCWhvTulP9GY274aSkJPxr-7l8YGkVFj3hPYlISysdNfAw0ndFYNNII4-gw/exec';

  const appState = {
    beans: [],
    settings: {
      sheetUrl: '',
      scriptUrl: APPS_SCRIPT_URL,
      photoFolder: '',
      settingsLocked: true
    },
    currentBean: null,
    uploadedPhoto: {
      fileId: '',
      fileName: '',
      driveLink: '',
      previewDataUrl: '',
      photoText: ''
    }
  };

  const views = {
    dashboard: document.getElementById('dashboardView'),
    beans: document.getElementById('beansView'),
    recipe: document.getElementById('recipeView'),
    settings: document.getElementById('settingsView')
  };

  const navButtons = document.querySelectorAll('[data-view-target]');
  const beanGrid = document.getElementById('beanGrid');
  const beanSearch = document.getElementById('beanSearch');
  const appStatus = document.getElementById('appStatus');

  const settingsForm = document.getElementById('settings-form');
  const beanForm = document.getElementById('bean-form');
  const recipeForm = document.getElementById('recipe-form');

  const openAddBeanBtn = document.getElementById('openAddBeanBtn');
  const beanModal = document.getElementById('beanModal');
  const beanModalClose = document.getElementById('beanModalClose');
  const beanModalCancel = document.getElementById('beanModalCancel');

  const beanPhotoInput = document.getElementById('beanPhoto');
  const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
  const researchBeanBtn = document.getElementById('researchBeanBtn');
  const recipeOutput = document.getElementById('recipeOutput');

  function resolveScriptUrl() {
    return (appState.settings && appState.settings.scriptUrl) || APPS_SCRIPT_URL;
  }

  function showView(viewName) {
    Object.entries(views).forEach(([key, el]) => {
      if (!el) return;
      if (key === viewName) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    navButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.viewTarget === viewName);
    });
  }

  function setAppStatus(message, type = '') {
    if (!appStatus) return;
    appStatus.textContent = message || '';
    appStatus.className = type ? `app-status ${type}` : 'app-status';
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value == null ? '' : value;
  }

  function setChecked(id, checked) {
    const el = document.getElementById(id);
    if (el) el.checked = !!checked;
  }

  function normalizeTags(value) {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    return String(value || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function countryToFlag(country) {
    const flags = {
      Ethiopia: '🇪🇹',
      Colombia: '🇨🇴',
      Brazil: '🇧🇷',
      Kenya: '🇰🇪',
      Panama: '🇵🇦',
      'Costa Rica': '🇨🇷',
      Guatemala: '🇬🇹',
      'El Salvador': '🇸🇻',
      Honduras: '🇭🇳',
      Nicaragua: '🇳🇮',
      Rwanda: '🇷🇼',
      Burundi: '🇧🇮',
      Uganda: '🇺🇬',
      Tanzania: '🇹🇿',
      Peru: '🇵🇪',
      Bolivia: '🇧🇴',
      Mexico: '🇲🇽',
      Indonesia: '🇮🇩',
      Yemen: '🇾🇪',
      Ecuador: '🇪🇨',
      'Papua New Guinea': '🇵🇬',
      India: '🇮🇳',
      China: '🇨🇳',
      Vietnam: '🇻🇳',
      Thailand: '🇹🇭',
      Laos: '🇱🇦',
      Myanmar: '🇲🇲',
      'Dominican Republic': '🇩🇴',
      Jamaica: '🇯🇲',
      Haiti: '🇭🇹',
      Japan: '🇯🇵',
      Taiwan: '🇹🇼',
      'South Korea': '🇰🇷'
    };
    return flags[country] || '';
  }

  function updatePhotoFolderHint(folderId) {
    const hint = document.getElementById('photoFolderHint');
    if (!hint) return;
    if (folderId) {
      hint.textContent = `Photos will save to Drive folder: ${folderId}`;
    } else {
      hint.textContent = 'No Drive folder set. Upload still works, but photos will not be stored in Drive.';
    }
  }

  function applySettingsLockState() {
    const locked = !!(appState.settings && appState.settings.settingsLocked);
    const fields = [
      document.getElementById('sheetUrl'),
      document.getElementById('scriptUrl'),
      document.getElementById('photoFolder')
    ];

    fields.forEach((el) => {
      if (!el) return;
      if (locked) {
        el.setAttribute('readonly', 'readonly');
        el.classList.add('settings-readonly');
      } else {
        el.removeAttribute('readonly');
        el.classList.remove('settings-readonly');
      }
    });
  }

  async function fetchJson(url, options = {}) {
    const method = options.method || 'GET';

    const fetchOptions = {
      method,
      redirect: 'follow',
      headers: {}
    };

    if (method !== 'GET' && options.body) {
      fetchOptions.headers['Content-Type'] = 'text/plain;charset=utf-8';
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    const text = await response.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch (error) {
      throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
    }

    if (!response.ok) {
      throw new Error(json.error || `Request failed with status ${response.status}`);
    }

    if (json.success === false) {
      throw new Error(json.error || 'Request failed.');
    }

    return json;
  }

  async function loadSettings() {
    try {
      const response = await fetchJson(`${resolveScriptUrl()}?type=settings`);
      const data = response.data || {};

      appState.settings = {
        sheetUrl: data.sheetUrl || '',
        scriptUrl: data.scriptUrl || APPS_SCRIPT_URL,
        photoFolder: data.photoFolder || '',
        settingsLocked: !!data.settingsLocked
      };
    } catch (error) {
      console.warn('Settings load failed, using defaults.', error);
      appState.settings = {
        sheetUrl: '',
        scriptUrl: APPS_SCRIPT_URL,
        photoFolder: '',
        settingsLocked: true
      };
    }

    setValue('sheetUrl', appState.settings.sheetUrl);
    setValue('scriptUrl', appState.settings.scriptUrl || APPS_SCRIPT_URL);
    setValue('photoFolder', appState.settings.photoFolder);
    setChecked('settingsLocked', appState.settings.settingsLocked);

    applySettingsLockState();
    updatePhotoFolderHint(appState.settings.photoFolder || '');
  }

  async function saveSettings(event) {
    event.preventDefault();

    const lockBox = document.getElementById('settingsLocked');
    const nextLocked = lockBox ? lockBox.checked : true;

    try {
      const response = await fetchJson(resolveScriptUrl(), {
        method: 'POST',
        body: {
          action: 'saveSettings',
          sheetUrl: getValue('sheetUrl'),
          scriptUrl: getValue('scriptUrl'),
          photoFolder: getValue('photoFolder'),
          settingsLocked: nextLocked
        }
      });

      const data = response.data || {};
      appState.settings = {
        sheetUrl: data.sheetUrl || '',
        scriptUrl: data.scriptUrl || APPS_SCRIPT_URL,
        photoFolder: data.photoFolder || '',
        settingsLocked: !!data.settingsLocked
      };

      setValue('sheetUrl', appState.settings.sheetUrl);
      setValue('scriptUrl', appState.settings.scriptUrl || APPS_SCRIPT_URL);
      setValue('photoFolder', appState.settings.photoFolder);
      setChecked('settingsLocked', appState.settings.settingsLocked);

      applySettingsLockState();
      updatePhotoFolderHint(appState.settings.photoFolder || '');
      setAppStatus('Settings saved.', 'success');
    } catch (error) {
      console.error(error);
      setAppStatus(error.message || 'Could not save settings.', 'error');
    }
  }

  async function loadBeansFromApi() {
    try {
      const response = await fetchJson(`${resolveScriptUrl()}?type=beans`);
      appState.beans = Array.isArray(response.data) ? response.data : [];
      renderBeans(beanSearch ? beanSearch.value : '');
      renderDashboardSummary();
    } catch (error) {
      console.error(error);
      setAppStatus(error.message || 'Could not load beans.', 'error');
      if (beanGrid) {
        beanGrid.innerHTML = '<p class="empty-state">Could not load beans.</p>';
      }
    }
  }

  function renderDashboardSummary() {
    const totalBeans = document.getElementById('totalBeans');
    const totalOrigins = document.getElementById('totalOrigins');
    const totalRoasters = document.getElementById('totalRoasters');

    if (totalBeans) totalBeans.textContent = appState.beans.length;

    if (totalOrigins) {
      const origins = new Set(
        appState.beans.map((bean) => bean.origin_country).filter(Boolean)
      );
      totalOrigins.textContent = origins.size;
    }

    if (totalRoasters) {
      const roasters = new Set(
        appState.beans.map((bean) => bean.roaster).filter(Boolean)
      );
      totalRoasters.textContent = roasters.size;
    }
  }

  function openBeanModal(bean = null) {
    appState.currentBean = bean;
    resetUploadedPhotoState();

    if (bean) {
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
      setValue('beanTags', Array.isArray(bean.tags) ? bean.tags.join(', ') : (bean.tags || ''));
      setValue('beanNotes', bean.notes || '');
      setValue('beanPhotoText', bean.photo_text || '');

      appState.uploadedPhoto = {
        fileId: bean.photo_file_id || '',
        fileName: bean.photo_file_name || '',
        driveLink: bean.photo_drive_link || '',
        previewDataUrl: bean.photo_preview_data_url || '',
        photoText: bean.photo_text || ''
      };

      renderPhotoPreview();
    } else {
      if (beanForm) beanForm.reset();
      setValue('beanId', '');
      setValue('beanPhotoText', '');
      renderPhotoPreview();
    }

    if (beanModal) {
      beanModal.classList.remove('hidden');
    }
  }

  function closeBeanModal() {
    if (beanModal) {
      beanModal.classList.add('hidden');
    }
    appState.currentBean = null;
    resetUploadedPhotoState();
    if (beanForm) beanForm.reset();
    clearRecipePreviewText();
  }

  function resetUploadedPhotoState() {
    appState.uploadedPhoto = {
      fileId: '',
      fileName: '',
      driveLink: '',
      previewDataUrl: '',
      photoText: ''
    };
    if (beanPhotoInput) beanPhotoInput.value = '';
    renderPhotoPreview();
  }

  function renderPhotoPreview() {
    const preview = document.getElementById('beanPhotoPreview');
    const previewImg = document.getElementById('beanPhotoPreviewImg');
    const previewText = document.getElementById('beanPhotoPreviewText');

    if (!preview || !previewImg || !previewText) return;

    if (appState.uploadedPhoto.previewDataUrl) {
      preview.classList.remove('hidden');
      previewImg.src = appState.uploadedPhoto.previewDataUrl;
      previewText.textContent = appState.uploadedPhoto.fileName || 'Uploaded photo';
    } else {
      preview.classList.add('hidden');
      previewImg.removeAttribute('src');
      previewText.textContent = '';
    }
  }

  function clearRecipePreviewText() {
    const recipeStatus = document.getElementById('recipeStatus');
    if (recipeStatus) recipeStatus.textContent = '';
  }

  function collectBeanFormData() {
    return {
      id: getValue('beanId'),
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
      tags: normalizeTags(getValue('beanTags')),
      notes: getValue('beanNotes'),
      photo_file_id: appState.uploadedPhoto.fileId || '',
      photo_file_name: appState.uploadedPhoto.fileName || '',
      photo_drive_link: appState.uploadedPhoto.driveLink || '',
      photo_preview_data_url: appState.uploadedPhoto.previewDataUrl || '',
      photo_text: getValue('beanPhotoText') || appState.uploadedPhoto.photoText || ''
    };
  }

  function fillBeanForm(data) {
    if (!data) return;

    setValue('beanName', data.bean || data.name || '');
    setValue('beanRoaster', data.roaster || '');
    setValue('beanOriginCountry', data.origin_country || '');
    setValue('beanOriginRegion', data.origin_region || '');
    setValue('beanPurchaseCountry', data.purchase_country || '');
    setValue('beanVariety', data.variety || '');
    setValue('beanProducer', data.producer || '');
    setValue('beanFarm', data.farm || '');
    setValue('beanAltitude', data.altitude || '');
    setValue('beanProcess', data.process || '');
    setValue('beanRoast', data.roast || '');
    setValue('beanTags', Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''));
    setValue('beanNotes', data.notes || '');
    setValue('beanPhotoText', data.photo_text || '');
  }

  async function uploadSelectedPhoto() {
    if (!beanPhotoInput || !beanPhotoInput.files || !beanPhotoInput.files[0]) {
      setAppStatus('Choose a photo first.', 'error');
      return;
    }

    const file = beanPhotoInput.files[0];
    const dataUrl = await readFileAsDataUrl(file);

    appState.uploadedPhoto.previewDataUrl = dataUrl;
    appState.uploadedPhoto.fileName = file.name;
    renderPhotoPreview();

    setAppStatus('Uploading photo...', 'loading');

    try {
      const response = await fetchJson(resolveScriptUrl(), {
        method: 'POST',
        body: {
          action: 'uploadBeanPhoto',
          previewDataUrl: dataUrl,
          fileName: file.name
        }
      });

      const data = response.data || {};
      appState.uploadedPhoto = {
        fileId: data.fileId || '',
        fileName: data.fileName || file.name,
        driveLink: data.driveLink || '',
        previewDataUrl: data.previewDataUrl || dataUrl,
        photoText: data.photoText || ''
      };

      setValue('beanPhotoText', data.photoText || '');
      renderPhotoPreview();
      setAppStatus('Photo uploaded. OCR text is ready for Research Bean.', 'success');
    } catch (error) {
      console.error(error);
      setAppStatus(error.message || 'Photo upload failed.', 'error');
    }
  }

  async function researchCurrentBean() {
    const beanData = collectBeanFormData();

    if (!beanData.photo_text && !beanData.bean && !beanData.roaster) {
      setAppStatus('Add OCR text or bean details first.', 'error');
      return;
    }

    setAppStatus('Researching bean and translating to English...', 'loading');

    try {
      const response = await fetchJson(resolveScriptUrl(), {
        method: 'POST',
        body: {
          action: 'researchBean',
          beanData
        }
      });

      const researched = response.data && response.data.bean ? response.data.bean : null;
      if (!researched) throw new Error('No researched bean returned.');

      fillBeanForm(researched);
      if (researched.photo_text) {
        appState.uploadedPhoto.photoText = researched.photo_text;
      }

      setAppStatus('Bean research complete.', 'success');
    } catch (error) {
      console.error(error);
      setAppStatus(error.message || 'Research failed.', 'error');
    }
  }

  async function saveBean(event) {
    event.preventDefault();

    const beanData = collectBeanFormData();
    const action = beanData.id ? 'updateBean' : 'saveBean';

    setAppStatus(beanData.id ? 'Updating bean...' : 'Saving bean...', 'loading');

    try {
      const response = await fetchJson(resolveScriptUrl(), {
        method: 'POST',
        body: {
          action,
          beanData
        }
      });

      const savedBean = response.data && response.data.bean ? response.data.bean : null;
      if (!savedBean) throw new Error('No bean returned after save.');

      closeBeanModal();
      await loadBeansFromApi();
      setAppStatus(beanData.id ? 'Bean updated.' : 'Bean saved.', 'success');
    } catch (error) {
      console.error(error);
      setAppStatus(error.message || 'Could not save bean.', 'error');
    }
  }

  async function deleteBean(beanId) {
    if (!beanId) return;
    if (!window.confirm('Delete this bean?')) return;

    setAppStatus('Deleting bean...', 'loading');

    try {
      await fetchJson(resolveScriptUrl(), {
        method: 'POST',
        body: {
          action: 'deleteBean',
          beanId
        }
      });

      await loadBeansFromApi();
      setAppStatus('Bean deleted.', 'success');
    } catch (error) {
      console.error(error);
      setAppStatus(error.message || 'Could not delete bean.', 'error');
    }
  }

  function renderBeans(searchText = '') {
    if (!beanGrid) return;

    const term = String(searchText || '').trim().toLowerCase();

    const filtered = appState.beans.filter((bean) => {
      if (!term) return true;
      return [
        bean.bean,
        bean.name,
        bean.roaster,
        bean.origin_country,
        bean.origin_region,
        bean.process,
        bean.roast,
        bean.notes,
        Array.isArray(bean.tags) ? bean.tags.join(' ') : bean.tags
      ]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });

    if (!filtered.length) {
      beanGrid.innerHTML = '<p class="empty-state">No beans found.</p>';
      return;
    }

    beanGrid.innerHTML = filtered.map((bean) => {
      const country = bean.origin_country || '';
      const flag = countryToFlag(country);
      const originLine = [flag, country, bean.origin_region].filter(Boolean).join(' ');
      const tags = Array.isArray(bean.tags) ? bean.tags : normalizeTags(bean.tags);

      return `
        <article class="bean-card">
          <div class="bean-card-header">
            <div>
              <h3>${escapeHtml(bean.bean || bean.name || 'Untitled Bean')}</h3>
              <p class="bean-card-roaster">${escapeHtml(bean.roaster || '')}</p>
            </div>
          </div>

          <div class="bean-card-meta">
            ${originLine ? `<p>${escapeHtml(originLine)}</p>` : ''}
            ${bean.process ? `<p>${escapeHtml(bean.process)}</p>` : ''}
            ${bean.roast ? `<p>${escapeHtml(bean.roast)}</p>` : ''}
          </div>

          ${tags.length ? `
            <div class="bean-tags">
              ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
          ` : ''}

          <div class="bean-card-actions">
            <button type="button" class="btn btn-secondary use-bean-btn" data-bean-id="${escapeHtml(bean.id)}">Use this bean</button>
            <button type="button" class="btn btn-ghost edit-bean-btn" data-bean-id="${escapeHtml(bean.id)}">Edit</button>
            <button type="button" class="btn btn-ghost delete-bean-btn" data-bean-id="${escapeHtml(bean.id)}">Delete</button>
          </div>
        </article>
      `;
    }).join('');

    beanGrid.querySelectorAll('.edit-bean-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bean = appState.beans.find((item) => item.id === btn.dataset.beanId);
        if (bean) openBeanModal(bean);
      });
    });

    beanGrid.querySelectorAll('.delete-bean-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        deleteBean(btn.dataset.beanId);
      });
    });

    beanGrid.querySelectorAll('.use-bean-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bean = appState.beans.find((item) => item.id === btn.dataset.beanId);
        if (!bean) return;
        loadBeanIntoRecipeHelper(bean);
        showView('recipe');
      });
    });
  }

  function loadBeanIntoRecipeHelper(bean) {
    setValue('helperBeanName', bean.bean || bean.name || '');
    setValue('helperRoaster', bean.roaster || '');
    setValue('helperOrigin', [bean.origin_country, bean.origin_region].filter(Boolean).join(' · '));
    setValue('helperRoast', bean.roast || '');
    setValue('helperProcess', bean.process || '');
    setValue('helperNotes', bean.notes || '');

    const country = bean.origin_country || '';
    const flag = countryToFlag(country);
    const summary = document.getElementById('recipeBeanSummary');
    if (summary) {
      const pieces = [
        bean.bean || bean.name || '',
        bean.roaster || '',
        [flag, country, bean.origin_region].filter(Boolean).join(' ')
      ].filter(Boolean);
      summary.textContent = pieces.join(' · ');
    }
  }

  async function generateRecipe(event) {
    if (event) event.preventDefault();

    const beanData = {
      bean: getValue('helperBeanName'),
      roaster: getValue('helperRoaster'),
      origin_country: extractCountryFromOrigin(getValue('helperOrigin')),
      origin_region: extractRegionFromOrigin(getValue('helperOrigin')),
      roast: getValue('helperRoast'),
      process: getValue('helperProcess'),
      notes: getValue('helperNotes')
    };

    setAppStatus('Generating recipe...', 'loading');

    try {
      const response = await fetchJson(resolveScriptUrl(), {
        method: 'POST',
        body: {
          action: 'generateRecipe',
          beanData
        }
      });

      const recipeData = response.data || {};
      renderRecipe(recipeData);
      setAppStatus('Recipe ready.', 'success');
    } catch (error) {
      console.error(error);
      setAppStatus(error.message || 'Recipe generation failed.', 'error');
    }
  }

  function extractCountryFromOrigin(originText) {
    const raw = String(originText || '').trim();
    if (!raw) return '';
    const parts = raw.split('·').map((part) => part.trim()).filter(Boolean);
    if (!parts.length) return '';
    const first = parts[0].replace(/[^\p{L}\p{N}\s-]/gu, '').trim();
    return first;
  }

  function extractRegionFromOrigin(originText) {
    const raw = String(originText || '').trim();
    if (!raw) return '';
    const parts = raw.split('·').map((part) => part.trim()).filter(Boolean);
    return parts.length > 1 ? parts.slice(1).join(' · ') : '';
  }

  function renderRecipe(data) {
    if (!recipeOutput) return;

    const recipes = data.recipes || {};
    const styles = Array.isArray(data.availableStyles) ? data.availableStyles : ['hot'];
    const defaultStyle = data.defaultStyle || 'hot';

    if (!recipes.hot && !recipes.iced_half_shaken) {
      recipeOutput.innerHTML = '<p class="empty-state">No recipe returned.</p>';
      return;
    }

    const selectorHtml = styles.length > 1 ? `
      <div class="recipe-style-switcher">
        ${styles.map((style) => {
          const label = style === 'iced_half_shaken' ? 'Iced (half shaken)' : 'Hot';
          return `
            <button type="button" class="btn btn-secondary recipe-style-btn ${style === defaultStyle ? 'active' : ''}" data-style="${style}">
              ${label}
            </button>
          `;
        }).join('')}
      </div>
    ` : '';

    recipeOutput.innerHTML = `
      ${selectorHtml}
      <div id="recipeCardMount"></div>
    `;

    const mount = document.getElementById('recipeCardMount');

    function paint(style) {
      const recipe = recipes[style];
      if (!recipe || !mount) return;

      mount.innerHTML = `
        <article class="recipe-card">
          <h3>${escapeHtml(recipe.label || style)}</h3>
          <div class="recipe-grid">
            <div><strong>Grind</strong><p>${escapeHtml(recipe.grind || '')}</p></div>
            <div><strong>Dose</strong><p>${escapeHtml(recipe.dose_g || '')} g</p></div>
            <div><strong>Water</strong><p>${escapeHtml(recipe.water_total_g || '')} g</p></div>
            <div><strong>Temp</strong><p>${escapeHtml(recipe.water_temp_c || '')} C</p></div>
            <div><strong>Time</strong><p>${escapeHtml(recipe.target_time || '')}</p></div>
            <div><strong>Ratio</strong><p>${escapeHtml(recipe.ratio || '')}</p></div>
            ${recipe.hot_water_g ? `<div><strong>Hot water</strong><p>${escapeHtml(recipe.hot_water_g)} g</p></div>` : ''}
            ${recipe.brew_ice_g ? `<div><strong>Ice</strong><p>${escapeHtml(recipe.brew_ice_g)} g</p></div>` : ''}
          </div>

          ${recipe.why ? `
            <section class="recipe-section">
              <h4>Why</h4>
              <p>${escapeHtml(recipe.why)}</p>
            </section>
          ` : ''}

          ${Array.isArray(recipe.pours) && recipe.pours.length ? `
            <section class="recipe-section">
              <h4>Pours</h4>
              <ol>
                ${recipe.pours.map((pour) => `<li>${escapeHtml(pour)}</li>`).join('')}
              </ol>
            </section>
          ` : ''}

          ${recipe.expected_notes ? `
            <section class="recipe-section">
              <h4>Expected notes</h4>
              <p>${escapeHtml(recipe.expected_notes)}</p>
            </section>
          ` : ''}
        </article>
      `;
    }

    paint(defaultStyle);

    recipeOutput.querySelectorAll('.recipe-style-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        recipeOutput.querySelectorAll('.recipe-style-btn').forEach((other) => {
          other.classList.remove('active');
        });
        btn.classList.add('active');
        paint(btn.dataset.style);
      });
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (navButtons.length) {
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        showView(btn.dataset.viewTarget);
      });
    });
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', saveSettings);
  }

  const settingsLockedCheckbox = document.getElementById('settingsLocked');
  if (settingsLockedCheckbox) {
    settingsLockedCheckbox.addEventListener('change', () => {
      appState.settings.settingsLocked = !!settingsLockedCheckbox.checked;
      applySettingsLockState();
    });
  }

  if (beanSearch) {
    beanSearch.addEventListener('input', () => {
      renderBeans(beanSearch.value);
    });
  }

  if (openAddBeanBtn) {
    openAddBeanBtn.addEventListener('click', () => openBeanModal());
  }

  if (beanModalClose) {
    beanModalClose.addEventListener('click', closeBeanModal);
  }

  if (beanModalCancel) {
    beanModalCancel.addEventListener('click', closeBeanModal);
  }

  if (beanModal) {
    beanModal.addEventListener('click', (event) => {
      if (event.target === beanModal) {
        closeBeanModal();
      }
    });
  }

  if (uploadPhotoBtn) {
    uploadPhotoBtn.addEventListener('click', uploadSelectedPhoto);
  }

  if (researchBeanBtn) {
    researchBeanBtn.addEventListener('click', researchCurrentBean);
  }

  if (beanForm) {
    beanForm.addEventListener('submit', saveBean);
  }

  if (recipeForm) {
    recipeForm.addEventListener('submit', generateRecipe);
  }

  showView('dashboard');

  (async function init() {
    await loadSettings();
    await loadBeansFromApi();
  })();
});
