# xdos-wordle

Mobile-friendly Wordle-style daily word game (static site for GitHub Pages).

## Dev

```bash
bun install
bun dev
```

## Test

```bash
bun test
```

## Build (GitHub Pages)

By default, the app builds with base path `/xdos-wordle/` (for `https://recursive404.github.io/xdos-wordle/`).

```bash
bun run build
```

Override the base path if needed:

```bash
VITE_BASE=/ bun run build
```

## Debugging a specific date

Append `?date=YYYY-MM-DD` (interpreted as America/New_York) to force a puzzle date:

```
/xdos-wordle/?date=2026-02-14
```

