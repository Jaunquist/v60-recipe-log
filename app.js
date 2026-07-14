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
        
