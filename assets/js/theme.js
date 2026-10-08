/* ---------------------------- Color theme ---------------------------- */

const THEME_KEY = 'tks_theme_v1';

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.textContent = isDark ? '☀️' : '🌙';
    button.setAttribute('aria-label', isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
    button.setAttribute('aria-pressed', String(isDark));
    button.title = isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap';
  });
}

let savedTheme = 'light';
try {
  savedTheme = localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
} catch (error) {
  console.error('Preferensi tema tidak dapat dibaca dari penyimpanan browser.', error);
}
applyTheme(savedTheme);
document.addEventListener('DOMContentLoaded', () => applyTheme(savedTheme));

document.addEventListener('click', (event) => {
  const button = event.target instanceof Element ? event.target.closest('[data-theme-toggle]') : null;
  if (!button) return;

  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error('Preferensi tema tidak dapat disimpan di browser.', error);
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === THEME_KEY) applyTheme(event.newValue === 'dark' ? 'dark' : 'light');
});
