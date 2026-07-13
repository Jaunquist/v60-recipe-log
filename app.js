document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const viewTitle = document.getElementById('viewTitle');

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

  const savedSettings = JSON.parse(localStorage.getItem('v60-settings') || '{}');
  if (sheetUrlInput) sheetUrlInput.value = savedSettings.sheetUrl || '';
  if (scriptUrlInput) scriptUrlInput.value = savedSettings.scriptUrl || '';
  if (photoFolderInput) photoFolderInput.value = savedSettings.photoFolder || '';

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const nextSettings = {
        sheetUrl: sheetUrlInput?.value.trim() || '',
        scriptUrl: scriptUrlInput?.value.trim() || '',
        photoFolder: photoFolderInput?.value.trim() || ''
      };
      localStorage.setItem('v60-settings', JSON.stringify(nextSettings));
      alert('Settings saved. Reload the page, then the app can fetch your sheet data.');
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
        <div><strong>Origin:</strong> ${b.origin_country || '-'}</div>
        <div><strong>Process:</strong> ${b.process || '-'}</div>
        <div><strong>Roast:</strong> ${b.roast || '-'}</div>
        <div><strong>Notes:</strong> ${(b.notes || []).join(', ') || '-'}</div>
        <div><strong>Recipe:</strong> ${b.recipe?.dose_g || '-'}g / ${b.recipe?.water_g || '-'}g / ${b.recipe?.temp_c || '-'}°C</div>
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
      notes.push('Use slightly hotter water to help fully extract a light roast.');
    } else if (roast === 'medium') {
      temp = 93;
      ratio = 15.5;
      grind = 'medium-fine';
      notes.push('Medium roasts usually like a balanced temp and standard V60 grind.');
    } else {
      temp = 88;
      ratio = 15;
      grind = 'medium';
      notes.push('Darker roasts often taste sweeter with slightly cooler water.');
    }

    if (process === 'washed') {
      notes.push('Washed coffees usually reward clarity, so keep pours controlled and even.');
    } else if (process === 'natural') {
      ratio -= 0.3;
      notes.push('Naturals can get intense fast, so a touch stronger and slightly gentler pouring helps.');
    } else if (process === 'anaerobic') {
      ratio -= 0.5;
      temp -= 1;
      notes.push('Anaerobic lots can become boozy or loud, so keep extraction a little tighter.');
    } else if (process === 'honey') {
      ratio -= 0.2;
      notes.push('Honey process often likes a sweet, rounded extraction with moderate agitation.');
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
          'Rinse the filter thoroughly and preheat the brewer/server.',
          `Add ${dose}g coffee, level the bed, and start the timer.`,
          `Pour ${bloom}g for the bloom and wait 30–45 seconds.`,
          `Continue in 2 to 3 controlled pours until you reach ${water}g total water.`,
          'Finish with a gentle swirl to flatten the bed and draw down evenly.',
          'Taste and adjust next brew: grind finer if sour, coarser if bitter or slow.'
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
        'Target time: 2:30–3:00'
      ],
      steps: [
        `Place ${ice}g ice in the server.`,
        'Rinse the filter, but do not leave hot rinse water in the server.',
        `Add ${dose}g coffee and bloom with ${bloom}g water for 30–45 seconds.`,
        `Pour the remaining hot water in 2 steady pours until you reach ${hotWater}g total hot water.`,
        'Give the brewer a gentle swirl near the end for even drawdown.',
        'Swirl the finished brew with the ice and serve immediately.'
      ],
      notes: [
        ...notes,
        'Iced V60 works best as a stronger brew over ice so the melt brings it back into balance.'
      ]
    };
  }

  function renderRecipeCard(recipe) {
    if (!recipeOutput) return;

    recipeOutput.innerHTML = `
      <h3>${recipe.title}</h3>
      <div class="recipe-meta">
        ${recipe.meta.map((item) => `<div>${item}</div>`).join('')}
      </div>

      <ol class="recipe-steps">
        ${recipe.steps.map((step) => `<li>${step}</li>`).join('')}
      </ol>

      <div class="recipe-meta">
        ${recipe.notes.map((note) => `<div>Tip: ${note}</div>`).join('')}
      </div>
    `;
  }

  if (generateRecipeBtn) {
    generateRecipeBtn.addEventListener('click', () => {
      const recipe = buildRecipe();
      renderRecipeCard(recipe);
    });
  }

  if (beanSearch) {
    beanSearch.addEventListener('input', () => {
      renderBeans(beanSearch.value);
    });
  }

  showView('dashboard');
  loadBeansFromApi();
});
