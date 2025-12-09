# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript compile + Vite build (tsc -b && vite build)
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture

This is a React 19 + TypeScript + Vite personal website/portfolio hosted on GitHub Pages. Currently serves a single-page turbo boost calculator application using Recharts for data visualization.

**Structure:**
- `src/main.tsx` - Application entry point with React StrictMode
- `src/App.tsx` - Root component that renders the main page
- `src/pages/` - Page components (currently `turbo-calculator.tsx`)

**Deployment:** Automatic via GitHub Actions on push to `master` branch. Builds to `dist/` and deploys to `gh-pages` branch.

**Key Dependencies:**
- React 19, Recharts for charts
- Vite 6 with `@vitejs/plugin-react`
- TypeScript with split configs (`tsconfig.app.json` for app, `tsconfig.node.json` for tooling)

## Code Standards

- ESLint flat config with TypeScript and React hooks/refresh plugins
- Default exports at bottom of files
- Type prefixes: `I` for interfaces, `E` for enums, `T` for types
