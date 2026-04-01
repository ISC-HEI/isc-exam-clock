import './style.css';
import './animations.css';
import { initTheme, toggleTheme } from './theme';
import { initI18n, toggleLang } from './i18n';
import { initClock, toggleSeconds } from './clock';
import { initCountdown, togglePanel } from './countdown';
import { initLogo, setWobbleStyle } from './logo';

let settingsUserOpen = false;

const FONTS = [
  'JetBrains Mono',
  'IBM Plex Mono',
  'Fira Code',
  'Space Mono',
  'Roboto Mono',
  'Inter',
  'Outfit',
];

// Initialize theme and i18n immediately (before render)
initTheme();
initI18n();

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  // Start logo intro animation, reveal clock when done
  initLogo(() => {
    document.documentElement.classList.add('ready');
    const clockContainer = document.getElementById('clock-container');
    if (clockContainer) {
      clockContainer.classList.remove('hidden');
      clockContainer.classList.add('visible');
    }
    initClock();
    initCountdown();
  });

  // Wire up controls
  document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);
  document.getElementById('btn-lang')?.addEventListener('click', toggleLang);
  document.getElementById('btn-seconds')?.addEventListener('click', toggleSeconds);
  document.getElementById('btn-countdown')?.addEventListener('click', () => togglePanel());
  document.getElementById('btn-fullscreen')?.addEventListener('click', toggleFullscreen);

  // Reset settings
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('isc-clock-'))
      .forEach((k) => localStorage.removeItem(k));
    location.reload();
  });

  // Settings toggle (cog button)
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    const settings = document.getElementById('settings');
    if (settings) {
      settings.classList.toggle('hidden');
      settingsUserOpen = !settings.classList.contains('hidden');
    }
  });

  // Font selector
  const fontSelect = document.getElementById('select-font') as HTMLSelectElement | null;
  if (fontSelect) {
    const savedFont = localStorage.getItem('isc-clock-font');
    if (savedFont && FONTS.includes(savedFont)) {
      fontSelect.value = savedFont;
      applyFont(savedFont);
    } else {
      fontSelect.value = 'Fira Code';
      applyFont('Fira Code');
    }
    fontSelect.addEventListener('change', () => {
      applyFont(fontSelect.value);
      localStorage.setItem('isc-clock-font', fontSelect.value);
    });
  }

  // Background intensity slider
  const bgSlider = document.getElementById('slider-bg') as HTMLInputElement | null;
  if (bgSlider) {
    const saved = localStorage.getItem('isc-clock-bg-intensity');
    if (saved !== null) bgSlider.value = saved;
    applyBgIntensity(parseInt(bgSlider.value, 10));
    bgSlider.addEventListener('input', () => {
      const val = parseInt(bgSlider.value, 10);
      applyBgIntensity(val);
      localStorage.setItem('isc-clock-bg-intensity', String(val));
    });
  }

  // Background style dropdown
  const bgStyleSelect = document.getElementById('select-bg-style') as HTMLSelectElement | null;
  if (bgStyleSelect) {
    const savedStyle = localStorage.getItem('isc-clock-bg-style') ?? '1';
    bgStyleSelect.value = savedStyle;
    applyBgStyle(savedStyle);
    bgStyleSelect.addEventListener('change', () => {
      applyBgStyle(bgStyleSelect.value);
      localStorage.setItem('isc-clock-bg-style', bgStyleSelect.value);
    });
  }

  // Wobble style dropdown
  const wobbleSelect = document.getElementById('select-wobble') as HTMLSelectElement | null;
  if (wobbleSelect) {
    const savedWobble = localStorage.getItem('isc-clock-wobble') ?? 'wobble';
    wobbleSelect.value = savedWobble;
    wobbleSelect.addEventListener('change', () => {
      setWobbleStyle(wobbleSelect.value);
      localStorage.setItem('isc-clock-wobble', wobbleSelect.value);
    });
  }

  // Amplitude slider
  const ampSlider = document.getElementById('slider-amplitude') as HTMLInputElement | null;
  if (ampSlider) {
    const savedAmp = localStorage.getItem('isc-clock-amplitude');
    if (savedAmp !== null) ampSlider.value = savedAmp;
    applyAmplitude(parseInt(ampSlider.value, 10));
    ampSlider.addEventListener('input', () => {
      const val = parseInt(ampSlider.value, 10);
      applyAmplitude(val);
      localStorage.setItem('isc-clock-amplitude', String(val));
    });
  }

  // Auto-hide controls after inactivity
  setupAutoHide();
});

function toggleFullscreen(): void {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {
      // Fullscreen not supported or blocked
    });
  } else {
    document.exitFullscreen();
  }
}

function applyBgIntensity(percent: number): void {
  document.documentElement.style.setProperty('--bg-intensity', String(percent / 100));
}

function applyAmplitude(percent: number): void {
  document.documentElement.style.setProperty('--wobble-amp', String(percent / 100));
}

function applyFont(font: string): void {
  document.documentElement.style.setProperty('--clock-font', `'${font}'`);
}

function applyBgStyle(style: string): void {
  const bg = document.getElementById('bg-gradient');
  if (!bg) return;

  bg.dataset.style = style;

  // Remove existing blobs
  bg.querySelectorAll('.bg-blob').forEach((b) => b.remove());

  // Create blobs for style 1
  if (style === '1') {
    for (let i = 0; i < 5; i++) {
      const blob = document.createElement('div');
      blob.className = 'bg-blob';
      bg.appendChild(blob);
    }
  }
}

function setupAutoHide(): void {
  const controls = document.getElementById('controls');
  const settings = document.getElementById('settings');
  const githubLink = document.getElementById('btn-github');
  if (!controls) return;

  let hideTimeout: ReturnType<typeof setTimeout>;

  const showControls = () => {
    controls.classList.add('show');
    controls.classList.remove('autohide');
    if (githubLink) {
      githubLink.classList.add('show');
      githubLink.classList.remove('autohide');
    }
    if (settings && settingsUserOpen) {
      settings.classList.remove('hidden');
    }
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      // Don't hide if a dropdown is open (select is focused within settings)
      const active = document.activeElement;
      if (active && active.tagName === 'SELECT' && settings?.contains(active)) {
        showControls();
        return;
      }
      controls.classList.remove('show');
      controls.classList.add('autohide');
      if (settings) settings.classList.add('hidden');
      settingsUserOpen = false;
      if (githubLink) {
        githubLink.classList.remove('show');
        githubLink.classList.add('autohide');
      }
    }, 10000);
  };

  document.addEventListener('mousemove', showControls);
  document.addEventListener('touchstart', showControls);

  // Initial show, then auto-hide
  showControls();
}


