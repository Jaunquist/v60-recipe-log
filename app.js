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
    settings: {
      sheetUrl: 
