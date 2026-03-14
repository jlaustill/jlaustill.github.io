# kfa Translator Integration Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the kfa phonetic translator as a new page and restructure navigation to Home | Blog | Turbo Calculator | kfa.

**Architecture:** Copy kfa source files into `src/pages/kfa/`, move turbo calculator from `src/pages/utils/` to `src/pages/turbo-calculator/`, update routes and navigation. Lazy-load the kfa page via `React.lazy` + `Suspense`.

**Tech Stack:** React 19, TypeScript, MUI 7, Vite 6, React Router v7

**Spec:** `docs/superpowers/specs/2026-03-13-kfa-integration-design.md`

---

## Chunk 1: Restructure Routes and Navigation

### Task 1: Move turbo calculator to new directory

**Files:**
- Move: `src/pages/utils/CompoundTurboCalculator.tsx` → `src/pages/turbo-calculator/CompoundTurboCalculator.tsx`
- Delete: `src/pages/utils/` (empty directory after move)

- [ ] **Step 1: Create new directory and move file**

```bash
mkdir -p src/pages/turbo-calculator
git mv src/pages/utils/CompoundTurboCalculator.tsx src/pages/turbo-calculator/CompoundTurboCalculator.tsx
```

- [ ] **Step 2: Verify no other files remain in utils/**

```bash
ls src/pages/utils/
```

Expected: empty directory (or no such directory if git mv cleaned it up)

```bash
rmdir src/pages/utils 2>/dev/null; true
```

- [ ] **Step 3: Commit**

```bash
git add -A src/pages/utils src/pages/turbo-calculator
git commit -m "refactor: move turbo calculator from utils/ to turbo-calculator/"
```

### Task 2: Update navigation and routes

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Update App.tsx imports and routes**

Replace the full contents of `src/App.tsx` with:

```tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import BlogList from './pages/blog/BlogList';
import BlogPost from './pages/blog/BlogPost';
import CompoundTurboCalculator from './pages/turbo-calculator/CompoundTurboCalculator';

const KfaTranslator = lazy(() => import('./pages/kfa/KfaTranslator'));

const App = () => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:postNumber" element={<BlogPost />} />
        <Route path="/turbo-calculator" element={<CompoundTurboCalculator />} />
        <Route
          path="/kfa"
          element={
            <Suspense
              fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              }
            >
              <KfaTranslator />
            </Suspense>
          }
        />
      </Routes>
    </AppLayout>
  );
};

export default App;
```

- [ ] **Step 2: Update AppLayout.tsx navigation buttons**

Replace the full contents of `src/components/layout/AppLayout.tsx` with:

```tsx
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ILayoutProps from '../types/ILayoutProps';

const AppLayout = ({ children }: ILayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <RouterLink to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              JoSOu ostel
            </RouterLink>
          </Typography>
          <Button color="inherit" component={RouterLink} to="/">
            Home
          </Button>
          <Button color="inherit" component={RouterLink} to="/blog">
            Blog
          </Button>
          <Button color="inherit" component={RouterLink} to="/turbo-calculator">
            Turbo Calculator
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/kfa"
            sx={{ textTransform: 'none' }}
          >
            kfa
          </Button>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ flex: 1, py: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

export default AppLayout;
```

Key change: The kfa button uses `sx={{ textTransform: 'none' }}` to prevent MUI's default uppercase transform, which would render "kfa" as "KFA".

- [ ] **Step 3: Update Home.tsx cards**

Replace the full contents of `src/pages/Home.tsx` with:

```tsx
import { Typography, Card, CardContent, CardActions, Button, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Home = () => {
  return (
    <>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Blog
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Technical articles and thoughts
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={RouterLink} to="/blog">
                View Blog
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Turbo Calculator
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Compound turbo boost ratio calculator
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={RouterLink} to="/turbo-calculator">
                Open Calculator
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" sx={{ textTransform: 'none' }}>
                kfa
              </Typography>
              <Typography variant="body2" color="text.secondary">
                QWERTY phonetic alphabet translator
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={RouterLink} to="/kfa">
                Open Translator
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default Home;
```

- [ ] **Step 4: Verify build compiles (will fail on missing kfa module — expected)**

```bash
npm run lint
```

Expected: lint passes (the lazy import won't cause lint errors even though the file doesn't exist yet)

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/layout/AppLayout.tsx src/pages/Home.tsx
git commit -m "feat: restructure nav to Home | Blog | Turbo Calculator | kfa"
```

---

## Chunk 2: Copy kfa Source Files

### Task 3: Copy kfa types, utils, and services

**Files:**
- Create: `src/pages/kfa/types/index.ts`
- Create: `src/pages/kfa/utils/tokenizer.ts`
- Create: `src/pages/kfa/utils/ipaToKfa.ts`
- Create: `src/pages/kfa/utils/dictionaryLoader.ts`
- Create: `src/pages/kfa/services/translationService.ts`

- [ ] **Step 1: Create kfa directory structure**

```bash
mkdir -p src/pages/kfa/{types,utils,services,components}
```

- [ ] **Step 2: Copy types/index.ts**

Copy from `~/code/kfa/kfa-translator/src/types/index.ts` to `src/pages/kfa/types/index.ts`. No changes needed — the file has no imports.

- [ ] **Step 3: Copy utils/tokenizer.ts**

Copy from `~/code/kfa/kfa-translator/src/utils/tokenizer.ts` to `src/pages/kfa/utils/tokenizer.ts`. No changes needed — the file defines its own `IToken` interface inline and has no external imports.

- [ ] **Step 4: Copy utils/ipaToKfa.ts**

Copy from `~/code/kfa/kfa-translator/src/utils/ipaToKfa.ts` to `src/pages/kfa/utils/ipaToKfa.ts`. No changes needed — imports from `../types` and `./tokenizer`.

- [ ] **Step 5: Copy utils/dictionaryLoader.ts**

Copy from `~/code/kfa/kfa-translator/src/utils/dictionaryLoader.ts` to `src/pages/kfa/utils/dictionaryLoader.ts`.

**One change required:** Update the fetch URL to use Vite's base path for GitHub Pages compatibility.

Change line 15 from:
```ts
const response = await fetch('/data/ipadict.json');
```
to:
```ts
const response = await fetch(`${import.meta.env.BASE_URL}data/ipadict.json`);
```

- [ ] **Step 6: Copy services/translationService.ts**

Copy from `~/code/kfa/kfa-translator/src/services/translationService.ts` to `src/pages/kfa/services/translationService.ts`. No changes needed — imports from `../utils/dictionaryLoader`, `../utils/ipaToKfa`, and `../types`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/kfa/types src/pages/kfa/utils src/pages/kfa/services
git commit -m "feat: add kfa translation types, utils, and services"
```

### Task 4: Copy kfa components

**Files:**
- Create: `src/pages/kfa/components/TranslationWord.tsx`
- Create: `src/pages/kfa/components/EnhancedTranslationDisplay.tsx`

- [ ] **Step 1: Copy TranslationWord.tsx**

Copy from `~/code/kfa/kfa-translator/src/components/TranslationWord.tsx` to `src/pages/kfa/components/TranslationWord.tsx`. No changes needed — imports from `../types`.

- [ ] **Step 2: Copy EnhancedTranslationDisplay.tsx**

Copy from `~/code/kfa/kfa-translator/src/components/EnhancedTranslationDisplay.tsx` to `src/pages/kfa/components/EnhancedTranslationDisplay.tsx`. No changes needed — imports from `../types` and `./TranslationWord`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/kfa/components
git commit -m "feat: add kfa translation display components"
```

### Task 5: Copy dictionary data

**Files:**
- Create: `public/data/ipadict.json`

- [ ] **Step 1: Copy the dictionary file**

```bash
mkdir -p public/data
cp ~/code/kfa/kfa-translator/public/data/ipadict.json public/data/ipadict.json
```

- [ ] **Step 2: Add to .gitignore or LFS if needed**

Check the file size:
```bash
ls -lh public/data/ipadict.json
```

If ~13MB, it's fine for git but worth noting. No LFS needed for a personal site.

- [ ] **Step 3: Commit**

```bash
git add public/data/ipadict.json
git commit -m "feat: add kfa pronunciation dictionary"
```

---

## Chunk 3: Create kfa Page Component

### Task 6: Create KfaTranslator.tsx

**Files:**
- Create: `src/pages/kfa/KfaTranslator.tsx`

This is an adaptation of the kfa project's `App.tsx` with:
- AppBar removed (portfolio's AppLayout provides navigation)
- README panel removed (replaced with a link to the repo)
- Styling adapted to match portfolio patterns (Paper wrapper like turbo calculator)

- [ ] **Step 1: Create KfaTranslator.tsx**

```tsx
import {
  Paper,
  Typography,
  TextField,
  Box,
  Button,
  Link,
} from '@mui/material';
import { useState, useRef } from 'react';
import TranslationService from './services/translationService';
import type { IEnhancedTranslationResult } from './types';
import EnhancedTranslationDisplay from './components/EnhancedTranslationDisplay';

const KfaTranslator = () => {
  const [englishText, setEnglishText] = useState('');
  const [enhancedResult, setEnhancedResult] = useState<IEnhancedTranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const translationService = useRef(new TranslationService()).current;

  const handleTranslateFromEnglish = async () => {
    if (!englishText.trim()) return;

    setIsTranslating(true);
    try {
      const result = await translationService.translateEnglishToEnhanced(englishText);
      setEnhancedResult(result);
    } catch (error) {
      console.error('Translation error:', error);
      setEnhancedResult({
        success: false,
        words: [],
        errors: ['Translation failed'],
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleWordPronunciationChange = (wordIndex: number, newPronunciationIndex: number) => {
    if (!enhancedResult) return;

    const newResult = {
      ...enhancedResult,
      words: enhancedResult.words.map((word, index) =>
        index === wordIndex
          ? { ...word, selectedPronunciation: newPronunciationIndex }
          : word
      ),
    };

    setEnhancedResult(newResult);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ textTransform: 'none' }}>
        kfa Translator
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        QWERTY Phonetic Alphabet —{' '}
        <Link href="https://github.com/jlaustill/kfa" target="_blank" rel="noopener noreferrer">
          Documentation
        </Link>
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* English Input Section */}
        <Paper sx={{ p: 2 }} variant="outlined">
          {enhancedResult ? (
            <Box
              onClick={(e) => {
                if (e.target === e.currentTarget || !(e.target as HTMLElement)?.closest?.('[role="button"]')) {
                  setEnhancedResult(null);
                }
              }}
              sx={{ cursor: 'text' }}
            >
              <EnhancedTranslationDisplay
                result={enhancedResult}
                format="english"
                title="English (click underlined words to change pronunciation, click text to edit)"
                onWordPronunciationChange={handleWordPronunciationChange}
              />
            </Box>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                English
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={englishText}
                onChange={(e) => setEnglishText(e.target.value)}
                placeholder="Enter English text here..."
                sx={{ mb: 2 }}
              />
            </>
          )}

          <Button
            variant="contained"
            onClick={handleTranslateFromEnglish}
            fullWidth
            disabled={isTranslating || !englishText.trim()}
          >
            {isTranslating ? 'Translating...' : 'Translate to IPA & kfa'}
          </Button>
        </Paper>

        {/* IPA Section */}
        <Paper sx={{ p: 2 }} variant="outlined">
          {enhancedResult ? (
            <EnhancedTranslationDisplay
              result={enhancedResult}
              format="ipa"
              title="IPA (International Phonetic Alphabet)"
              onWordPronunciationChange={handleWordPronunciationChange}
            />
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                IPA (International Phonetic Alphabet)
              </Typography>
              <Box
                sx={{
                  minHeight: '120px',
                  padding: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: 'grey.50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body2">
                  Enter English text above and click "Translate to IPA & kfa" to see IPA transcription
                </Typography>
              </Box>
            </>
          )}
        </Paper>

        {/* kfa Section */}
        <Paper sx={{ p: 2 }} variant="outlined">
          {enhancedResult ? (
            <EnhancedTranslationDisplay
              result={enhancedResult}
              format="kfa"
              title="kfa (QWERTY Phonetic Alphabet)"
              onWordPronunciationChange={handleWordPronunciationChange}
            />
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                kfa (QWERTY Phonetic Alphabet)
              </Typography>
              <Box
                sx={{
                  minHeight: '120px',
                  padding: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: 'grey.50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body2">
                  Enter English text above and click "Translate to IPA & kfa" to see kfa phonetic spelling
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Paper>
  );
};

export default KfaTranslator;
```

- [ ] **Step 2: Verify build compiles**

```bash
npm run build
```

Expected: successful build with no errors.

- [ ] **Step 3: Verify lint passes**

```bash
npm run lint
```

Expected: no lint errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/kfa/KfaTranslator.tsx
git commit -m "feat: add kfa translator page with adapted styling"
```

---

## Chunk 4: Manual Verification

### Task 7: Smoke test the application

- [ ] **Step 1: Start dev server and verify navigation**

```bash
npm run dev
```

Manually verify in browser:
1. Navigation shows: Home | Blog | Turbo Calculator | kfa
2. "kfa" in nav is lowercase (not "KFA")
3. Home page shows 3 cards: Blog, Turbo Calculator, kfa
4. "kfa" card heading is lowercase

- [ ] **Step 2: Verify turbo calculator works at new route**

Navigate to `/turbo-calculator`. Verify:
1. Calculator renders with inputs and chart
2. Sliders and inputs work
3. Chart updates

- [ ] **Step 3: Verify kfa translator loads and works**

Navigate to `/kfa`. Verify:
1. Loading spinner appears briefly while lazy-loading
2. Translator page renders with English input, IPA output, kfa output sections
3. Enter "Hello world" and click translate
4. IPA and kfa sections populate with results
5. Words with multiple pronunciations show underlines
6. Clicking underlined words shows pronunciation dropdown
7. "Documentation" link points to kfa GitHub repo

- [ ] **Step 4: Verify old route is gone**

Navigate to `/utils/compound-turbo-calculator`. Verify it shows a blank page (no route match).

- [ ] **Step 5: Verify production build**

```bash
npm run build
npm run preview
```

Repeat smoke tests on the preview build.

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```

Only if fixes were applied — skip if everything passed.
