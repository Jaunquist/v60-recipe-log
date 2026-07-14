document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const viewTitle = document.getElementById('viewTitle');

  const sheetUrlInput = document.getElementById('sheetUrlInput');
  const scriptUrlInput = document.getElementById('scriptUrlInput');
  const photoFolderInput = document.getElementById('photoFolderInput');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const beanSearch = document.getElementById('beanSearch');
  const beanList = document.getElementById('beanList');

  const helperBeanName = document.getElementById('helperBeanName');
  const helperRoast = document.getElementById('helperRoast');
  const helperProcess = document.getElementById('helperProcess');
  const helperStyle = document.getElementById('helperStyle');
  const helperDose = document.getElementById('helperDose');
  const generateRecipeBtn = document.getElementById('generateRecipeBtn');
  const recipeOutput = document.getElementById('recipeOutput');
  const copyRecipeBtn = document.getElementById('copyRecipeBtn');
  const copyRecipeStatus = document.getElementById('copyRecipeStatus');

  let latestRecipeText = '';
  let helperSelectedOrigin = {
    country: '',
    region: ''
  };

  const TOP_COFFEE_FLAGS = {
    "Brazil": "🇧🇷",
    "Vietnam": "🇻🇳",
    "Indonesia": "🇮🇩",
    "Colombia": "🇨🇴",
    "Ethiopia": "🇪🇹",
    "Honduras": "🇭🇳",
    "Uganda": "🇺🇬",
    "Peru": "🇵🇪",
    "India": "🇮🇳",
    "Central African Republic": "🇨🇫",
    "Guatemala": "🇬🇹",
    "Guinea": "🇬🇳",
    "Mexico": "🇲🇽",
    "Laos": "🇱🇦",
    "Nicaragua": "🇳🇮",
    "China": "🇨🇳",
    "Ivory Coast": "🇨🇮",
    "Côte d'Ivoire": "🇨🇮",
    "Costa Rica": "🇨🇷",
    "Tanzania": "🇹🇿",
    "Democratic Republic of the Congo": "🇨🇩",
    "DR Congo": "🇨🇩",
    "Congo (DRC)": "🇨🇩",
    "Venezuela": "🇻🇪",
    "Madagascar": "🇲🇬",
    "Kenya": "🇰🇪",
    "Papua New Guinea": "🇵🇬",
    "El Salvador": "🇸🇻",
    "Yemen": "🇾🇪",
    "Philippines": "🇵🇭",
    "Rwanda": "🇷🇼",
    "Cambodia": "🇰🇭",
    "Bolivia": "🇧🇴",
    "Dominican Republic": "🇩🇴",
    "Togo": "🇹🇬",
    "Angola": "🇦🇴",
    "Thailand": "🇹🇭",
    "Panama": "🇵🇦",
    "Malawi": "🇲🇼",
    "Burundi": "🇧🇮",
    "Ecuador": "🇪🇨",
    "Cameroon": "🇨🇲",
    "Haiti": "🇭🇹",
    "Cuba": "🇨🇺",
    "Sierra Leone": "🇸🇱",
    "Jamaica": "🇯🇲",
    "Paraguay": "🇵🇾",
    "Zimbabwe": "🇿🇼",
    "Timor-Leste": "🇹🇱",
    "East Timor": "🇹🇱",
    "Nepal": "🇳🇵",
    "Nigeria": "🇳🇬",
    "Ghana": "🇬🇭",
    "Liberia": "🇱🇷",
    "Puerto Rico": "🇵🇷"
  };

  function getCountryFlag(country) {
    if (!country) return '';
    return TOP_COFFEE_FLAGS[String(country).trim()] || '';
  }

  function formatOrigin(country, region = '') {
    const cleanCountry = country || '-';
    const flag = getCountryFlag(cleanCountry);
    const prefix = flag ? `${flag} ` : '';
    return region ? `${prefix}${cleanCountry} — ${region}` : `${prefix}${cleanCountry}`;
  }

  function buildBeanSummary(country, region = '') {
    const cleanCountry = country || '';
    if (!cleanCountry) return '';
    const flag = getCountryFlag(cleanCountry);
    const prefix = flag ? `${flag} ` : '';
    return region ? `${prefix}${cleanCountry} — ${region}` : `${prefix}${cleanCountry}`;
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    root.setAttribute('data-theme', savedTheme);
    if (themeToggle) themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀';
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    if (themeToggle) themeToggle.textContent = prefersDark ? '🌙' : '☀';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      themeToggle.textContent = next === 'dark' ? '🌙' : '☀';
    });
  }

  async function loadUniversalSettings() {
    const localFallback = JSON.parse(localStorage.getItem('v60-settings') || '{}');

    if (sheetUrlInput) sheetUrlInput.value = localFallback.sheetUrl || '';
    if (scriptUrlInput) scriptUrlInput.value = localFallback.scriptUrl || '';
    if (photoFolderInput) photoFolderInput.value = localFallback.photoFolder || '';

    if (!localFallback.scriptUrl) return;

    try {
      const res = await fetch(`${localFallback.scriptUrl}?type=settings`);
      const json = await res.json();

      if (!json.success || !json.data) return;

      const settings = json.data;

      if (sheetUrlInput) sheetUrlInput.value = settings.sheetUrl || '';
      if (scriptUrlInput) scriptUrlInput.value = settings.scriptUrl || localFallback.scriptUrl || '';
      if (photoFolderInput) photoFolderInput.value = settings.photoFolder || '';

      localStorage.setItem('v60-settings', JSON.stringify({
        sheetUrl: settings.sheetUrl || '',
        scriptUrl: settings.scriptUrl || localFallback.scriptUrl || '',
        photoFolder: settings.photoFolder || ''
      }));
    } catch (err) {
      console.error('Could not load universal settings', err);
    }
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
      const nextSettings = {
        sheetUrl: sheetUrlInput?.value.trim() || '',
        scriptUrl: scriptUrlInput?.value.trim() || '',
        photoFolder: photoFolderInput?.value.trim() || ''
      };

      localStorage.setItem('v60-settings', JSON.stringify(nextSettings));

      try {
        const res = await fetch(nextSettings.scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveSettings',
            ...nextSettings
          })
        });

        const json = await res.json();

        if (!json.success) throw new Error(json.error || 'Save failed');

        alert('Universal settings saved.');
      } catch (err) {
        console.error('Could not save universal settings', err);
        alert('Saved on this device, but universal save failed.');
      }
    });
  }

  const views = ['dashboard', 'library', 'helper', 'settings'];

  function showView(name) {
    views.forEach((view) => {
      const el = document.getElementById(`view-${view}`);
      if (!el) return;
      el.classList.toggle('hidden', view !== name);
    });

    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === name);
    });

    const titleMap = {
      dashboard: 'Dashboard',
      library: 'Bean Library',
      helper: 'Recipe Helper',
      settings: 'Settings'
    };

    if (viewTitle) viewTitle.textContent = titleMap[name] || 'Dashboard';
  }

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      showView(btn.dataset.view);
    });
  });

  let beans = [];

  function normalizeRoast(value) {
    const v = String(value || '').toLowerCase();
    if (v.includes('dark')) return 'dark';
    if (v.includes('medium')) return 'medium';
    return 'light';
  }

  function normalizeProcess(value) {
    const v = String(value || '').toLowerCase();
    if (v.includes('anaerobic')) return 'anaerobic';
    if (v.includes('natural')) return 'natural';
    if (v.includes('honey')) return 'honey';
    if (v.includes('washed')) return 'washed';
    return 'other';
  }

  function normalizeBean(row) {
    return {
      id: row.id || '',
      bean: row.bean || '',
      roaster: row.roaster || '',
      origin_country: row.origin_country || '',
      origin_region: row.origin_region || '',
      process: row.process || '',
      roast: row.roast || '',
      notes: row.notes
        ? String(row.notes).split('|').map((s) => s.trim()).filter(Boolean)
        : [],
      recipe: {
        dose_g: row.dose_g || '',
        water_g: row.water_g || '',
        temp_c: row.temp_c || ''
      }
    };
  }

  function renderBeans(filter = '') {
    if (!beanList) return;

    const q = filter.trim().toLowerCase();

    const filtered = !q
      ? beans
      : beans.filter((b) =>
          [
            b.bean,
            b.roaster,
            b.origin_country,
            b.origin_region,
            b.process,
            b.roast,
            (b.notes || []).join(' ')
          ]
            .join(' ')
            .toLowerCase()
            .includes(q)
        );

    if (!filtered.length) {
      beanList.innerHTML = '<p class="muted">No beans found.</p>';
      return;
    }

    beanList.innerHTML = filtered.map((b) => `
      <div class="bean-card">
        <h3>${b.bean || 'Untitled bean'}</h3>
        <div><strong>Roaster:</strong> ${b.roaster || '-'}</div>
        <div><strong>Origin:</strong> ${formatOrigin(b.origin_country, b.origin_region)}</div>
        <div><strong>Process:</strong> ${b.process || '-'}</div>
        <div><strong>Roast:</strong> ${b.roast || '-'}</div>
        <div><strong>Notes:</strong> ${(b.notes || []).join(', ') || '-'}</div>
        <div><strong>Recipe:</strong> ${b.recipe?.dose_g || '-'}g / ${b.recipe?.water_g || '-'}g / ${b.recipe?.temp_c || '-'}°C</div>
        <div class="bean-card-actions">
          <button
            class="bean-action-btn use-bean-btn"
            type="button"
            data-bean="${escapeHtml(b.bean || '')}"
            data-roast="${escapeHtml(normalizeRoast(b.roast || 'light'))}"
            data-process="${escapeHtml(normalizeProcess(b.process || 'washed'))}"
            data-dose="${escapeHtml(String(b.recipe?.dose_g || 18))}"
            data-origin-country="${escapeHtml(b.origin_country || '')}"
            data-origin-region="${escapeHtml(b.origin_region || '')}"
          >
            Use this bean
          </button>
        </div>
      </div>
    `).join('');
  }

  async function loadBeansFromApi() {
    const currentSettings = JSON.parse(localStorage.getItem('v60-settings') || '{}');
    if (!currentSettings.scriptUrl) return;

    try {
      const res = await fetch(`${currentSettings.scriptUrl}?type=beans`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to load beans');
      }

      beans = (json.data || []).map(normalizeBean);
      renderBeans('');
    } catch (err) {
      console.error('Could not load beans', err);
      if (beanList) {
        beanList.innerHTML = '<p class="muted">Could not load beans.</p>';
      }
    }
  }

  function round5(value) {
    return Math.round(value / 5) * 5;
  }

  function buildRecipe() {
    const beanName = helperBeanName?.value.trim() || 'Custom bean';
    const roast = helperRoast?.value || 'light';
    const process = helperProcess?.value || 'washed';
    const style = helperStyle?.value || 'hot';
    const dose = Number(helperDose?.value || 18);

    let ratio = 16;
    let temp = 94;
    let grind = 'medium-fine';
    let bloomMulti = 3;
    let targetTime = '2:45–3:15';
    let notes = [];

    if (roast === 'light') {
      temp = 96;
      ratio = 16;
      grind = 'medium-fine';
      notes.push('Use slightly hotter water for light roasts.');
    } else if (roast === 'medium') {
      temp = 93;
      ratio = 15.5;
      grind = 'medium-fine';
      notes.push('Medium roasts usually like balanced extraction.');
    } else {
      temp = 88;
      ratio = 15;
      grind = 'medium';
      notes.push('Darker roasts often taste sweeter with cooler water.');
    }

    if (process === 'washed') {
      notes.push('Washed coffees usually reward clarity and clean pours.');
    } else if (process === 'natural') {
      ratio -= 0.3;
      notes.push('Naturals can get intense quickly, so keep the brew a touch tighter.');
    } else if (process === 'anaerobic') {
      ratio -= 0.5;
      temp -= 1;
      notes.push('Anaerobic lots can get loud fast, so lower extraction slightly.');
    } else if (process === 'honey') {
      ratio -= 0.2;
      notes.push('Honey coffees often like a rounded, sweet extraction.');
    }

    if (style === 'hot') {
      const water = round5(dose * ratio);
      const bloom = round5(dose * bloomMulti);

      return {
        title: `${beanName} — Hot V60`,
        meta: [
          `Dose: ${dose}g`,
          `Water: ${water}g`,
          `Bloom: ${bloom}g for 30–45 sec`,
          `Temp: ${temp}°C`,
          `Grind: ${grind}`,
          `Target time: ${targetTime}`
        ],
        steps: [
          'Rinse the filter and preheat the brewer.',
          `Add ${dose}g coffee and level the bed.`,
          `Pour ${bloom}g for the bloom and wait 30–45 seconds.`,
          `Continue pouring until you reach ${water}g total water.`,
          'Finish with a gentle swirl.',
          'Adjust finer if sour, coarser if bitter or slow.'
        ],
        notes
      };
    }

    const finalRatio = 16;
    const totalWater = round5(dose * finalRatio);
    const hotWater = round5(totalWater * 0.6);
    const ice = totalWater - hotWater;
    const bloom = round5(dose * 2.5);

    return {
      title: `${beanName} — Iced V60`,
      meta: [
        `Dose: ${dose}g`,
        `Hot water: ${hotWater}g`,
        `Ice in server: ${ice}g`,
        `Final ratio: ~1:${finalRatio}`,
        `Temp: ${Math.max(temp, 93)}°C`,
        `Grind: slightly finer than hot V60`,
        `Target time: 2:30–3:00`
      ],
      steps: [
        `Place ${ice}g ice in the server.`,
        'Rinse the filter and discard the rinse water.',
        `Add ${dose}g coffee and bloom with ${bloom}g water for 30–45 seconds.`,
        `Pour remaining water until you reach ${hotWater}g total hot water.`,
        'Give the brewer a gentle swirl.',
        'Swirl the brewed coffee over ice and serve.'
      ],
      notes: [
        ...notes,
        'Iced V60 works best as a stronger brew over ice.'
      ]
    };
  }

  function recipeToText(recipe) {
    return [
      recipe.title,
      '',
      ...recipe.meta,
      '',
      ...recipe.steps.map((step, index) => `${index + 1}. ${step}`),
      '',
      ...recipe.notes.map((note) => `Tip: ${note}`)
    ].join('\n');
  }

  function renderRecipeCard(recipe) {
    if (!recipeOutput) return;

    latestRecipeText = recipeToText(recipe);

    const beanSummary = buildBeanSummary(
      helperSelectedOrigin.country,
      helperSelectedOrigin.region
    );

    recipeOutput.innerHTML = `
      <h3>${recipe.title}</h3>
      ${beanSummary ? `<p class="muted" style="margin-top:8px;">Origin: ${beanSummary}</p>` : ''}
      <div class="recipe-meta">
        ${recipe.meta.map((item) => `<div>${item}</div>`).join('')}
      </div>
      <ol class="recipe-steps">
        ${recipe.steps.map((step) => `<li>${step}</li>`).join('')}
      </ol>
      <div class="recipe-meta">
        ${recipe.notes.map((note) => `<div><strong>Tip:</strong> ${note}</div>`).join('')}
      </div>
    `;
  }

  async function copyLatestRecipe() {
    if (!latestRecipeText) {
      if (copyRecipeStatus) copyRecipeStatus.textContent = 'Generate a recipe first.';
      return;
    }

    try {
      await navigator.clipboard.writeText(latestRecipeText);
      if (copyRecipeStatus) {
        copyRecipeStatus.textContent = 'Copied.';
        setTimeout(() => {
          copyRecipeStatus.textContent = '';
        }, 1200);
      }
    } catch (err) {
      console.error('Copy failed', err);
      if (copyRecipeStatus) copyRecipeStatus.textContent = 'Copy failed.';
    }
  }

  function fillHelperFromBean(data) {
    if (helperBeanName) helperBeanName.value = data.bean || '';
    if (helperRoast) helperRoast.value = normalizeRoast(data.roast || 'light');
    if (helperProcess) helperProcess.value = normalizeProcess(data.process || 'washed');
    if (helperDose) helperDose.value = data.dose || 18;

    helperSelectedOrigin = {
      country: data.origin_country || '',
      region: data.origin_region || ''
    };

    showView('helper');
    const recipe = buildRecipe();
    renderRecipeCard(recipe);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  async function postBrewLog(payload) {
    const currentSettings = JSON.parse(localStorage.getItem('v60-settings') || '{}');
    if (!currentSettings.scriptUrl) return { ok: false, error: 'Missing Apps Script URL' };

    try {
      const res = await fetch(currentSettings.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return { ok: true, data: json };
    } catch (error) {
      console.error('postBrewLog failed', error);
      return { ok: false, error: error.message };
    }
  }

  if (generateRecipeBtn) {
    generateRecipeBtn.addEventListener('click', () => {
      const recipe = buildRecipe();
      renderRecipeCard(recipe);
    });
  }

  if (copyRecipeBtn) {
    copyRecipeBtn.addEventListener('click', copyLatestRecipe);
  }

  if (beanSearch) {
    beanSearch.addEventListener('input', () => {
      renderBeans(beanSearch.value);
    });
  }

  if (beanList) {
    beanList.addEventListener('click', (event) => {
      const btn = event.target.closest('.use-bean-btn');
      if (!btn) return;

      fillHelperFromBean({
        bean: btn.dataset.bean || '',
        roast: btn.dataset.roast || 'light',
        process: btn.dataset.process || 'washed',
        dose: btn.dataset.dose || 18,
        origin_country: btn.dataset.originCountry || '',
        origin_region: btn.dataset.originRegion || ''
      });
    });
  }

  showView('dashboard');
  loadUniversalSettings().then(loadBeansFromApi);

  window.v60PostBrewLog = postBrewLog;
});
