export type Lang = 'en' | 'fr';

const translations: Record<string, Record<Lang, string>> = {
  countdownTitle: { en: 'Countdown Timer', fr: 'Compte à rebours' },
  endTime: { en: 'End Time', fr: 'Heure de fin' },
  duration: { en: 'Duration', fr: 'Durée' },
  endTimeLabel: { en: 'Exam ends at:', fr: "L'examen se termine à :" },
  durationLabel: { en: 'Duration:', fr: 'Durée :' },
  playSound: { en: 'Play sound when done', fr: 'Jouer un son à la fin' },
  start: { en: 'Start', fr: 'Démarrer' },
  stop: { en: 'Stop', fr: 'Arrêter' },
  close: { en: 'Close', fr: 'Fermer' },
  timesUp: { en: "Time's up!", fr: 'Temps écoulé !' },
  dismiss: { en: 'Dismiss', fr: 'Fermer' },
  remaining: { en: 'remaining', fr: 'restant' },
  bgIntensity: { en: 'Intensity', fr: 'Intensité' },
  amplitude: { en: 'Amplitude', fr: 'Amplitude' },
  bgLabel: { en: 'Background', fr: 'Arrière-plan' },
  animLabel: { en: 'Animation', fr: 'Animation' },
  fontLabel: { en: 'Font', fr: 'Police' },
};

let currentLang: Lang = 'en';
const listeners: Array<(lang: Lang) => void> = [];

export function initI18n(): void {
  const saved = localStorage.getItem('isc-clock-lang') as Lang | null;
  if (saved && (saved === 'en' || saved === 'fr')) {
    currentLang = saved;
  } else {
    currentLang = navigator.language.startsWith('fr') ? 'fr' : 'en';
  }
  applyTranslations();
  updateLangButton();
}

export function toggleLang(): void {
  currentLang = currentLang === 'en' ? 'fr' : 'en';
  localStorage.setItem('isc-clock-lang', currentLang);
  applyTranslations();
  updateLangButton();
  listeners.forEach((fn) => fn(currentLang));
}

export function getLang(): Lang {
  return currentLang;
}

export function t(key: string): string {
  return translations[key]?.[currentLang] ?? key;
}

export function onLangChange(fn: (lang: Lang) => void): void {
  listeners.push(fn);
}

function applyTranslations(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n!;
    const text = t(key);
    if (el instanceof HTMLInputElement) {
      el.placeholder = text;
    } else {
      el.textContent = text;
    }
  });
}

function updateLangButton(): void {
  const label = document.getElementById('lang-label');
  if (label) {
    label.textContent = currentLang === 'en' ? 'FR' : 'EN';
  }
}
