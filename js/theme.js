(function () {
  var STORAGE_KEY = 'theme';
  var root = document.documentElement;
  var toggleBtn = document.getElementById('theme-toggle');

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getEffectiveTheme() {
    return localStorage.getItem(STORAGE_KEY) || getSystemTheme();
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (toggleBtn) {
      toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
      toggleBtn.setAttribute('aria-pressed', String(theme === 'dark'));
    }
  }

  applyTheme(getEffectiveTheme());

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      var next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });
  }
})();
