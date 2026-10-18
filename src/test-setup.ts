import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// @testing-library/react only self-registers its afterEach(cleanup) when it
// finds `afterEach` as a global at import time. This project does not set
// `test.globals: true` in vitest.config.ts (test files import `afterEach`
// from 'vitest' explicitly instead), so that auto-registration never fires
// and renders from one test leak into the next test's DOM. Register it
// explicitly here so every test file gets a clean document.body per test.
afterEach(cleanup);
