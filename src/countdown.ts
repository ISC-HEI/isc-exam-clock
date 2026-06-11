import { t, onLangChange, getLang } from './i18n';
import { getShowSeconds } from './clock';

let targetTime: number | null = null;
let countdownInterval: ReturnType<typeof setInterval> | null = null;
let playSound = false;
let audioCtx: AudioContext | null = null;
let timerMode = false; // checkbox preference
let timerModeActive = false; // current/last countdown ran as timer mode
let lastDurationMs = 0; // duration of the last started countdown, for relaunch

// DOM references
let displayEl: HTMLElement | null = null;
let panelEl: HTMLElement | null = null;
let startBtn: HTMLElement | null = null;
let stopBtn: HTMLElement | null = null;
let flashOverlay: HTMLElement | null = null;
let timesupOverlay: HTMLElement | null = null;
let clockEl: HTMLElement | null = null;
let timerActionsEl: HTMLElement | null = null;

export function initCountdown(): void {
  displayEl = document.getElementById('countdown-display');
  panelEl = document.getElementById('countdown-panel');
  startBtn = document.getElementById('btn-start-countdown');
  stopBtn = document.getElementById('btn-stop-countdown');
  flashOverlay = document.getElementById('flash-overlay');
  timesupOverlay = document.getElementById('timesup-overlay');
  clockEl = document.getElementById('clock');
  timerActionsEl = document.getElementById('timer-actions');

  const tabEndtime = document.getElementById('tab-endtime');
  const tabDuration = document.getElementById('tab-duration');
  const sectionEndtime = document.getElementById('input-endtime');
  const sectionDuration = document.getElementById('input-duration');
  const checkSound = document.getElementById('check-sound') as HTMLInputElement | null;
  const btnClose = document.getElementById('btn-close-panel');
  const btnDismiss = document.getElementById('btn-dismiss');

  // Tab switching
  tabEndtime?.addEventListener('click', () => {
    tabEndtime.classList.add('active');
    tabDuration?.classList.remove('active');
    sectionEndtime?.classList.remove('hidden');
    sectionDuration?.classList.add('hidden');
    syncInputsFromTarget('endtime');
  });

  tabDuration?.addEventListener('click', () => {
    tabDuration.classList.add('active');
    tabEndtime?.classList.remove('active');
    sectionDuration?.classList.remove('hidden');
    sectionEndtime?.classList.add('hidden');
    syncInputsFromTarget('duration');
  });

  // Sound checkbox
  checkSound?.addEventListener('change', () => {
    playSound = checkSound.checked;
    localStorage.setItem('isc-clock-sound', String(playSound));
  });

  // Restore saved sound preference
  const savedSound = localStorage.getItem('isc-clock-sound');
  if (savedSound === 'true' && checkSound) {
    checkSound.checked = true;
    playSound = true;
  }

  // Timer mode checkbox
  const checkTimerMode = document.getElementById('check-timer-mode') as HTMLInputElement | null;
  checkTimerMode?.addEventListener('change', () => {
    timerMode = checkTimerMode.checked;
    localStorage.setItem('isc-clock-timer-mode', String(timerMode));
  });
  if (localStorage.getItem('isc-clock-timer-mode') === 'true' && checkTimerMode) {
    checkTimerMode.checked = true;
    timerMode = true;
  }

  // Timer mode action buttons
  document.getElementById('btn-gong')?.addEventListener('click', () => playGongSound());
  document.getElementById('btn-relaunch')?.addEventListener('click', relaunchTimer);
  document.getElementById('btn-exit-timer')?.addEventListener('click', () => {
    exitTimerView();
    displayEl?.classList.add('hidden');
    if (displayEl) displayEl.textContent = '';
  });

  // Live update when inputs change while countdown is running
  const inputTime = document.getElementById('input-time') as HTMLInputElement | null;
  const inputHours = document.getElementById('input-hours') as HTMLInputElement | null;
  const inputMinutes = document.getElementById('input-minutes') as HTMLInputElement | null;

  inputTime?.addEventListener('change', () => {
    if (countdownInterval !== null && tabEndtime?.classList.contains('active') && inputTime.value) {
      const [h, m] = inputTime.value.split(':').map(Number);
      const now = new Date();
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      targetTime = target.getTime();
      lastDurationMs = targetTime - now.getTime();
      updateDisplay();
    }
  });

  const updateFromDuration = () => {
    if (countdownInterval !== null && tabDuration?.classList.contains('active')) {
      const hours = parseInt(inputHours?.value ?? '0', 10) || 0;
      const mins = parseInt(inputMinutes?.value ?? '0', 10) || 0;
      if (hours > 0 || mins > 0) {
        lastDurationMs = (hours * 3600 + mins * 60) * 1000;
        targetTime = Date.now() + lastDurationMs;
        displayEl?.classList.remove('urgent');
        updateDisplay();
      }
    }
  };
  inputHours?.addEventListener('change', updateFromDuration);
  inputMinutes?.addEventListener('change', updateFromDuration);

  // Start
  startBtn?.addEventListener('click', () => {
    const isEndTime = tabEndtime?.classList.contains('active');
    if (isEndTime) {
      startFromEndTime();
    } else {
      startFromDuration();
    }
  });

  // Stop
  stopBtn?.addEventListener('click', () => {
    stopCountdown();
    exitTimerView();
  });

  // Close panel
  btnClose?.addEventListener('click', () => togglePanel(false));

  // Dismiss times-up
  btnDismiss?.addEventListener('click', dismissTimesUp);

  // Update language on change
  onLangChange(() => {
    if (targetTime !== null) updateDisplay();
  });

  // Check URL params for preset countdown
  parseUrlParams();
}

export function togglePanel(show?: boolean): void {
  if (!panelEl) return;
  const isHidden = panelEl.classList.contains('hidden');
  const shouldShow = show ?? isHidden;
  panelEl.classList.toggle('hidden', !shouldShow);
}

function startFromEndTime(): void {
  const input = document.getElementById('input-time') as HTMLInputElement | null;
  if (!input?.value) return;

  const [h, m] = input.value.split(':').map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);

  // If the target time is in the past, assume it's tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  targetTime = target.getTime();
  lastDurationMs = targetTime - now.getTime();
  beginCountdown();
}

function startFromDuration(): void {
  const hoursInput = document.getElementById('input-hours') as HTMLInputElement | null;
  const minsInput = document.getElementById('input-minutes') as HTMLInputElement | null;
  const hours = parseInt(hoursInput?.value ?? '0', 10) || 0;
  const mins = parseInt(minsInput?.value ?? '0', 10) || 0;

  if (hours === 0 && mins === 0) return;

  lastDurationMs = (hours * 3600 + mins * 60) * 1000;
  targetTime = Date.now() + lastDurationMs;
  beginCountdown();
}

function beginCountdown(): void {
  // Update UI
  startBtn?.classList.add('hidden');
  stopBtn?.classList.remove('hidden');
  displayEl?.classList.remove('hidden');

  // Timer mode: the countdown replaces the clock
  timerModeActive = timerMode;
  if (timerModeActive) {
    clockEl?.classList.add('hidden');
    displayEl?.classList.add('timer-mode');
  } else {
    exitTimerView();
  }
  timerActionsEl?.classList.add('hidden');

  togglePanel(false);
  updateDisplay();
  if (countdownInterval !== null) clearInterval(countdownInterval);
  countdownInterval = setInterval(tickCountdown, 250);
}

function tickCountdown(): void {
  if (targetTime === null) return;

  const remaining = targetTime - Date.now();
  if (remaining <= 0) {
    onCountdownComplete();
    return;
  }

  // Add urgent class when little time remains (30s in timer mode, 5 min otherwise)
  const urgentThreshold = timerModeActive ? 30 * 1000 : 5 * 60 * 1000;
  if (remaining < urgentThreshold) {
    displayEl?.classList.add('urgent');
  }

  updateDisplay();
}

function updateDisplay(): void {
  if (!displayEl || targetTime === null) return;

  const remaining = Math.max(0, targetTime - Date.now());
  const totalSecs = Math.ceil(remaining / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  // Timer mode renders like the clock: H:MM:SS
  if (timerModeActive) {
    displayEl.textContent =
      h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return;
  }

  const lang = getLang();
  const remainingLabel = t('remaining');

  let text: string;
  if (h > 0) {
    text = getShowSeconds()
      ? `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s ${remainingLabel}`
      : `${h}h ${String(m).padStart(2, '0')}m ${remainingLabel}`;
  } else if (m > 0) {
    text = getShowSeconds()
      ? `${m}m ${String(s).padStart(2, '0')}s ${remainingLabel}`
      : `${m}m ${remainingLabel}`;
  } else {
    text = lang === 'fr' ? `${s}s ${remainingLabel}` : `${s}s ${remainingLabel}`;
  }

  displayEl.textContent = text;
}

function onCountdownComplete(): void {
  const wasTimerMode = timerModeActive;
  stopCountdown();
  targetTime = null;

  // Flash effect
  if (flashOverlay) {
    flashOverlay.classList.remove('hidden');
    flashOverlay.classList.add('active');
    flashOverlay.addEventListener(
      'animationend',
      () => {
        flashOverlay!.classList.remove('active');
        flashOverlay!.classList.add('hidden');
      },
      { once: true }
    );
  }

  if (wasTimerMode) {
    // Keep the big display at zero and offer gong replay / relaunch
    timerModeActive = true;
    if (displayEl) {
      displayEl.textContent = '00:00';
      displayEl.classList.remove('hidden');
    }
    timerActionsEl?.classList.remove('hidden');
    playGongSound();
    return;
  }

  // Show times-up overlay
  if (timesupOverlay) {
    timesupOverlay.classList.remove('hidden');
  }

  // Play alarm sound if enabled
  if (playSound) {
    playAlarmSound();
  }
}

function stopCountdown(): void {
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  displayEl?.classList.remove('urgent');

  startBtn?.classList.remove('hidden');
  stopBtn?.classList.add('hidden');

  if (targetTime !== null) {
    targetTime = null;
    displayEl?.classList.add('hidden');
    if (displayEl) displayEl.textContent = '';
  }
}

function exitTimerView(): void {
  timerModeActive = false;
  displayEl?.classList.remove('timer-mode');
  clockEl?.classList.remove('hidden');
  timerActionsEl?.classList.add('hidden');
}

function relaunchTimer(): void {
  if (lastDurationMs <= 0) return;
  targetTime = Date.now() + lastDurationMs;
  displayEl?.classList.remove('urgent');
  beginCountdown();
}

function dismissTimesUp(): void {
  timesupOverlay?.classList.add('hidden');
  displayEl?.classList.add('hidden');
  if (displayEl) displayEl.textContent = '';
}

function playAlarmSound(): void {
  try {
    audioCtx = audioCtx || new AudioContext();
    const ctx = audioCtx;

    // Play 3 beeps
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.value = 880;

      const start = ctx.currentTime + i * 0.4;
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);

      osc.start(start);
      osc.stop(start + 0.3);
    }
  } catch {
    // Web Audio API not available — silently fail
  }
}

function playGongSound(): void {
  try {
    audioCtx = audioCtx || new AudioContext();
    const ctx = audioCtx;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);

    // Inharmonic partials of a struck gong, each with its own decay
    const partials = [
      { freq: 98, gain: 1.0, decay: 5.0 },
      { freq: 147, gain: 0.6, decay: 4.5 },
      { freq: 222, gain: 0.45, decay: 4.0 },
      { freq: 295, gain: 0.3, decay: 3.0 },
      { freq: 414, gain: 0.2, decay: 2.5 },
      { freq: 587, gain: 0.12, decay: 2.0 },
    ];

    for (const p of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq, now);
      // Slight downward pitch drift as the gong rings out
      osc.frequency.exponentialRampToValueAtTime(p.freq * 0.985, now + p.decay);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(p.gain * 0.5, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + p.decay);
    }
  } catch {
    // Web Audio API not available — silently fail
  }
}

function parseUrlParams(): void {
  const params = new URLSearchParams(window.location.search);

  const endParam = params.get('end');
  if (endParam && /^\d{1,2}:\d{2}$/.test(endParam)) {
    const input = document.getElementById('input-time') as HTMLInputElement | null;
    if (input) {
      input.value = endParam;
      setTimeout(() => startFromEndTime(), 100);
    }
    return;
  }

  const durationParam = params.get('duration');
  if (durationParam) {
    const mins = parseInt(durationParam, 10);
    if (!isNaN(mins) && mins > 0 && mins <= 720) {
      const hoursInput = document.getElementById('input-hours') as HTMLInputElement | null;
      const minsInput = document.getElementById('input-minutes') as HTMLInputElement | null;
      if (hoursInput && minsInput) {
        hoursInput.value = String(Math.floor(mins / 60));
        minsInput.value = String(mins % 60);
        setTimeout(() => startFromDuration(), 100);
      }
    }
  }
}

function syncInputsFromTarget(mode: 'endtime' | 'duration'): void {
  if (targetTime === null) return;

  const remaining = Math.max(0, targetTime - Date.now());

  if (mode === 'endtime') {
    const target = new Date(targetTime);
    const h = String(target.getHours()).padStart(2, '0');
    const m = String(target.getMinutes()).padStart(2, '0');
    const input = document.getElementById('input-time') as HTMLInputElement | null;
    if (input) input.value = `${h}:${m}`;
  } else {
    const totalMins = Math.ceil(remaining / 60000);
    const hoursInput = document.getElementById('input-hours') as HTMLInputElement | null;
    const minsInput = document.getElementById('input-minutes') as HTMLInputElement | null;
    if (hoursInput && minsInput) {
      hoursInput.value = String(Math.floor(totalMins / 60));
      minsInput.value = String(totalMins % 60);
    }
  }
}
