type Theme = 'light' | 'dark';
let currentTheme: Theme = 'light';

export function initTheme(): void {
  const saved = localStorage.getItem('isc-clock-theme') as Theme | null;
  if (saved === 'light' || saved === 'dark') {
    currentTheme = saved;
  } else {
    currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  applyTheme();
}

export function toggleTheme(): void {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('isc-clock-theme', currentTheme);
  applyTheme();
}

function applyTheme(): void {
  document.documentElement.classList.toggle('dark', currentTheme === 'dark');

  const iconSun = document.getElementById('icon-sun');
  const iconMoon = document.getElementById('icon-moon');
  if (iconSun && iconMoon) {
    iconSun.classList.toggle('hidden', currentTheme === 'dark');
    iconMoon.classList.toggle('hidden', currentTheme === 'light');
  }
}
