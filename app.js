document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme) {
    root.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀';
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '🌙';
  }

  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeToggle.textContent = next === 'dark' ? '🌙' : '☀';
  });

  const savedSettings = JSON.parse(localStorage.getItem('v60-settings') || '{}');
  const API_BASE = savedSettings.scriptUrl || '';
  let beans = [];

  const views = ['dashboard', 'library', 'helper', 'settings'];

  function showView(name) {
    views.forEach(v => {
      const section = document.getElementById(`view-${v}`);
      if (section) section.classList.toggle('hidden', v !== name);
    });

    const title = document.getElementById('viewTitle');
    if (title) {
      title.textContent =
        name === 'dashboard' ? 'Dashboard' :
        name === 'library' ? 'Bean Library' :
        name === 'helper' ? 'Recipe Helper' :
        'Settings';
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === name);
    });
  }

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });

  async function fetchBeans() {
    if (!API_BASE) return [];
    const res = await fetch(`${API_BASE}?type=beans`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load beans');
    return json.data;
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
      : beans.filter(b =>
          [
            b.bean,
            b.roaster,
            b.origin_country,
            b.origin_region,
            b.process,
            b.roast,
            (b.notes || []).join(' ')
          ].join(' ').toLowerCase().includes(q)
        );

    if (!filtered.length) {
      beanList.innerHTML = '<p class="muted">No beans found.</p>';
      return;
    }

    beanList.innerHTML = filtered.map(b => `
      <div style="border:1px solid #ccc; border-radius:12px; padding:12px; margin-bottom:12px;">
        <h3 style="margin:0 0 6px 0;">${b.bean || 'Untitled bean'}</h3>
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
    try {
      const rows = await fetchBeans();
      beans = rows.map(normalizeBean);
      renderBeans('');
    } catch (err) {
      console.error(err);
    }
  }

  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const sheetUrl = document.getElementById('sheetUrlInput')?.value.trim() || '';
      const scriptUrl = document.getElementById('scriptUrlInput')?.value.trim() || '';
      const photoFolder = document.getElementById('photoFolderInput')?.value.trim() || '';
      localStorage.setItem('v60-settings', JSON.stringify({ sheetUrl, scriptUrl, photoFolder }));
      alert('Settings saved. Reload the page, then the app can fetch your sheet data.');
    });
  }

  const beanSearch = document.getElementById('beanSearch');
  if (beanSearch) {
    beanSearch.addEventListener('input', () => renderBeans(beanSearch.value));
  }

  showView('dashboard');
  loadBeansFromApi();
});
