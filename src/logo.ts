const WOBBLE_CLASSES = ['wobble', 'wobble-breathe', 'wobble-drift', 'wobble-sway'];

export function setWobbleStyle(style: string): void {
  const logo = document.getElementById('isc-logo');
  if (!logo) return;
  WOBBLE_CLASSES.forEach((c) => logo.classList.remove(c));
  logo.classList.add(style);
}

export function initLogo(onIntroComplete: () => void): void {
  const logo = document.getElementById('isc-logo');
  const wrapper = document.getElementById('logo-wrapper');

  if (!logo || !wrapper) return;

  // Wait for the last petal's bloom animation to actually finish
  const lastPetal = logo.querySelector('.fifth-anim');
  if (!lastPetal) return;

  lastPetal.addEventListener('animationend', () => {
    // Set each petal to its final resting transform before switching animation
    const petals = logo.querySelectorAll<HTMLElement>('.petal');
    petals.forEach((petal) => {
      const rotate = getComputedStyle(petal).getPropertyValue('--rotate').trim();
      petal.style.transform = `rotate(${rotate}) scale(1)`;
      petal.style.opacity = '1';
      petal.style.animation = 'none';
    });

    // Hide center cap after bloom
    const centerCap = logo.querySelector<HTMLElement>('.center-cap');
    if (centerCap) centerCap.style.display = 'none';

    // Force reflow so the inline styles apply before wobble starts
    void logo.offsetHeight;

    // Clear inline styles and add wobble class — CSS takes over
    petals.forEach((petal) => {
      petal.style.transform = '';
      petal.style.opacity = '';
      petal.style.animation = '';
    });

    // Apply saved or default wobble style
    const savedWobble = localStorage.getItem('isc-clock-wobble') || 'wobble';
    setWobbleStyle(savedWobble);

    // Settle the wrapper (scale down) with a slight delay for smoothness
    requestAnimationFrame(() => {
      wrapper.classList.add('settled');
      onIntroComplete();
    });
  }, { once: true });
}
