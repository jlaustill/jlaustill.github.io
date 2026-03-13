# kfa Translator Integration Design

## Summary

Integrate the kfa phonetic translator from `~/code/kfa` into the portfolio site as a new top-level page. Restructure navigation from `Home | Blog | Utils` to `Home | Blog | Turbo Calculator | kfa`.

## Goals

- Add kfa translator as a lazy-loaded page at `/kfa`
- Promote turbo calculator to its own top-level route at `/turbo-calculator`
- Remove the `/utils/` route grouping
- Adapt kfa styling to match portfolio visual patterns
- Ensure the 13MB dictionary only loads when the kfa page is visited

## Non-Goals

- No kfa README/documentation content in the portfolio (stays in kfa repo)
- No functional changes to the translation logic
- No new dependencies

## Route & Navigation

**New navigation bar:** Home | Blog | Turbo Calculator | kfa

| Route | Component | Loading |
|-------|-----------|---------|
| `/` | Home | Eager |
| `/blog` | BlogList | Eager |
| `/blog/:postNumber` | BlogPost | Eager |
| `/turbo-calculator` | CompoundTurboCalculator | Eager |
| `/kfa` | KfaTranslator | Lazy (`React.lazy` + `Suspense`) |

**Important:** kfa is always lowercase in all user-facing text. kfa and KFA represent different pronunciations in the kfa phonetic system. The MUI Button's default `text-transform: uppercase` must be overridden for the kfa nav button to prevent it rendering as "KFA".

**Lazy loading:** The `Suspense` boundary wraps the lazy kfa route in `App.tsx` with a `CircularProgress` fallback centered on the page.

**Old route:** No redirect from `/utils/compound-turbo-calculator` — this is a personal site with negligible external traffic.

## File Structure

```
src/pages/
├── Home.tsx                          # Updated links
├── blog/                             # Unchanged
├── turbo-calculator/
│   └── CompoundTurboCalculator.tsx    # Moved from utils/
└── kfa/
    ├── KfaTranslator.tsx             # Main page (adapted styling)
    ├── components/
    │   ├── EnhancedTranslationDisplay.tsx
    │   └── TranslationWord.tsx
    ├── services/
    │   └── translationService.ts
    ├── utils/
    │   ├── dictionaryLoader.ts
    │   ├── ipaToKfa.ts
    │   └── tokenizer.ts
    └── types/
        └── index.ts

public/
└── data/
    └── ipadict.json                  # 13MB dictionary
```

The old `src/pages/utils/` directory is removed.

## Styling Adaptation

`KfaTranslator.tsx` is an adaptation of the kfa project's `App.tsx`:
- The kfa AppBar/Toolbar is **removed** (portfolio's `AppLayout` provides navigation)
- The embedded README panel is **removed** (replaced with a link to the kfa repo)
- Paper cards for input/output sections (matching turbo calculator patterns)
- Consistent MUI Grid/Box spacing with existing pages
- Portfolio theme colors (`#1976d2` primary, `#dc004e` secondary)
- TextField/Slider patterns matching existing controls
- Pronunciation dropdown menus styled with MUI theme
- Link to kfa repo README (info button or subtitle)

## Dictionary Loading

- `ipadict.json` (13MB) copied to `public/data/`
- `dictionaryLoader.ts` fetches using `${import.meta.env.BASE_URL}data/ipadict.json` to respect Vite's base path on GitHub Pages
- Only `ipadict.json` is copied; `ipadict.txt` (source format) is not needed at runtime
- Page is lazy-loaded via `React.lazy()` so dictionary fetch only triggers on navigation to `/kfa`
- Dictionary cached in `DictionaryLoader` after first load

## Integration Details

- All kfa internal imports updated to relative paths within `src/pages/kfa/`
- No new npm dependencies required (React, MUI, Emotion already present)
- Home.tsx updated with separate cards for Turbo Calculator and kfa
- No changes to translation logic, tokenizer, or IPA/kfa conversion
