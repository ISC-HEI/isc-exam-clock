let showSeconds = true;
let clockEl: HTMLElement | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;

export function initClock(): void {
  clockEl = document.getElementById('clock');

  const saved = localStorage.getItem('isc-clock-seconds');
  if (saved !== null) {
    showSeconds = saved === 'true';
  }

  updateClock();
  intervalId = setInterval(updateClock, 250);
}

export function toggleSeconds(): void {
  showSeconds = !showSeconds;
  localStorage.setItem('isc-clock-seconds', String(showSeconds));
  updateClock();
}

export function getShowSeconds(): boolean {
  return showSeconds;
}

export function destroyClock(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function updateClock(): void {
  if (!clockEl) return;
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');

  clockEl.textContent = showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
}
