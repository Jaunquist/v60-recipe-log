// Theme toggle
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

// View switching
const views = ['dashboard','library','helper','settings'];

function showView(name) {
  views.forEach(v => {
    document.getElementById(`view-${v}`).classList.toggle('hidden', v !== name);
  });
  document.getElementById('viewTitle').textContent =
    name === 'dashboard' ? 'Dashboard' :
    name === 'library' ? 'Bean Library' :
    name === 'helper' ? 'Recipe Helper' :
    'Settings';

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === name);
  });
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

// Initial view
showView('dashboard');

async function fetchBeans() {
  if (!API_BASE) return [];
  const url = `${API_BASE}?type=beans`;
  const res = await fetch(url);
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
    purchase_country: row.purchase_country || '',
    purchase_city: row.purchase_city || '',
    roast: row.roast || '',
    notes: row.notes ? String(row.notes).split('|').map(s => s.trim()).filter(Boolean) : [],
    recipe: {
      dose_g: row.dose_g || '',
      water_g: row.water_g || '',
      temp_c: row.temp_c || '',
      grind: row.grind || '',
      target_time: row.target_time || '',
      pours: row.pours ? String(row.pours).split('|').map(s => s.trim()).filter(Boolean) : [],
      style: row.recipe_style || ''
    },
    taste_summary: row.taste_summary || '',
    source: row.source || '',
    photo_url: row.photo_url || '',
    initial_notes: row.initial_notes || ''
  };
}

async function loadBeansFromApi() {
  try {
    const rows = await fetchBeans();
    beans = rows.map(normalizeBean);
    renderBeans(document.getElementById('beanSearch')?.value || '');
    updateStats();
  } catch (err) {
    console.error(err);
    alert('Could not load beans from Google Sheets yet. Check your Apps Script URL in Settings.');
  }
}
