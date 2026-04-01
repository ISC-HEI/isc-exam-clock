<p align="right">
  <img src="https://github.com/ISC-HEI/isc_logos/blob/main/black/ISC%20Logo%20inline%20black%20v3%20-%20large.webp?raw=true" align="right" alt="ISC Logo" height="50"/>
</p>

[![Deployed](https://img.shields.io/github/deployments/ISC-HEI/isc-exam-clock/github-pages?label=deployment&color=blue)](https://isc-hei.github.io/isc-exam-clock/)
![License](https://img.shields.io/badge/license-GPL--3.0-brightgreen)

# ISC Exam Clock

Full-screen exam clock for projection during exams, featuring the ISC logo bloom animation, a large 24-hour clock, and an optional countdown timer.

## 👉 [Use the application](https://clock.isc-vs.ch)

## Features

- **ISC logo bloom animation** on load, with continuous subtle wobble
- **Large 24h clock** with toggleable seconds display
- **Countdown timer** — set by end time (`16:00`) or duration (`90 min`)
- **Dark / light theme** toggle, persisted across sessions
- **Bilingual** (FR / EN) with automatic detection
- **Animated background** using ISC brand colors, with adjustable intensity
- **Auto-hiding controls** — fade out after inactivity
- **Fullscreen mode** for clean projection
- **URL presets** — share a link with the countdown pre-configured

## Quick Start

```bash
bun install
bun run dev
```

## URL Parameters

Pre-configure the countdown via query string:

| Parameter    | Example              | Description                    |
| ------------ | -------------------- | ------------------------------ |
| `end`        | `?end=16:00`         | Set countdown end time (HH:MM) |
| `duration`   | `?duration=90`       | Set countdown duration (minutes) |

## Build & Preview

```bash
bun run build    # Production build → dist/
bun run preview  # Preview the production build locally
```

## GitHub Pages Deployment

Deployment is automatic via GitHub Actions on every push to `main`.

1. In `vite.config.ts`, `base` is set to `'/isc-exam-clock/'`
2. The workflow (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages
3. In GitHub → Settings → Pages → Source: select **GitHub Actions**

## Project Structure

```
clock-app/
├── index.html          Entry point
├── vite.config.ts      Vite configuration
├── tsconfig.json       TypeScript configuration
└── src/
    ├── main.ts         Bootstrap & event wiring
    ├── clock.ts        24h clock logic
    ├── countdown.ts    Countdown timer (end time / duration)
    ├── theme.ts        Dark/light theme toggle
    ├── i18n.ts         FR/EN translations
    ├── logo.ts         Logo intro + wobble animation
    ├── style.css       Layout, theme variables, typography
    └── animations.css  Bloom, wobble, background gradient
```

---

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

---

*Made with ♥ by mui, 2026*
