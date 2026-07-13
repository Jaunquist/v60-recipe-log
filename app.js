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

  const savedSettings = JSON.parse(localStorage.getItem('v60-settings') || '{}');
  const sheetUrlInput = document.getElementById('sheetUrlInput');
  const scriptUrlInput = document.getElementById('scriptUrlInput');
  const photoFolderInput = document.getElementById('photoFolderInput');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');

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
      if (view === name) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === name);
    });

    if (viewTitle) {
      const labels = {
        dashboard: 'Dashboard',
        library: 'Bean Library',
        helper: 'Recipe Helper',
        settings: 'Settings'
      };
      viewTitle.textContent = labels[name] || 'Dashboard';
    }
  }

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.view;
      showView(target);
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
      notes: row.notes ? String(row.notes).split('|').map(s => s.trim()).filter(Boolean) : [],
      recipe: {
        dose_g: row.dose_g || '',
        water_g: row.water_g || '',
        temp_c: row.temp_c || ''
      }
    };
  }

  function renderBeans(filter = '') {
    const beanList = document.getElementById('beanList');
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
      if (!json.success) throw new Error(json.error || 'Failed to load beans');
      beans = (json.data || []).map(normalizeBean);
      renderBeans('');
    } catch (err) {
      console.error('Could not load beans', err);
    }
  }

  const beanSearch = document.getElementById('beanSearch');
  if (beanSearch) {
    beanSearch.addEventListener('input', () => {
      renderBeans(beanSearch.value);
    });
  }

  showView('dashboard');
  loadBeansFromApi();
});
