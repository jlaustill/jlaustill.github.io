# Economic Spectrum Visualization — Design Spec

## Summary

A grid visualization showing where 6 countries fall on a capitalism ↔ socialism spectrum, broken down by 11 sectors. Defaults are authored by the site owner; users can drag sliders to reflect their own views and screenshot the result.

---

## Route & Navigation

- New route: `/econ-spectrum`
- Card added to `Home.tsx` alongside Blog, Turbo Calculator, and kfa
- Lazy-loaded the same way as `KfaTranslator`

---

## Files

```
src/pages/econ-spectrum/
  EconSpectrum.tsx          # page component — grid + reset button
  data/
    defaults.ts             # authored default values (0=socialist, 100=capitalist)
```

---

## Data Structure

`defaults.ts` exports a single typed constant:

```typescript
export type TCountryKey = 'us' | 'canada' | 'germany' | 'china' | 'cuba' | 'singapore';
export type TSectorKey =
  | 'healthcare' | 'fireAndPolice' | 'education' | 'housing'
  | 'fuelProduction' | 'bankingAndFinance' | 'transportation'
  | 'internetAndTelecom' | 'military' | 'agriculture' | 'retirementAndPensions';

export type TSpectrumDefaults = Record<TSectorKey, Record<TCountryKey, number>>;

// 0 = fully socialist, 100 = fully capitalist
export const defaults: TSpectrumDefaults = {
  healthcare:           { us: 85, canada: 30, germany: 20, china: 40, cuba:  5, singapore: 55 },
  fireAndPolice:        { us:  8, canada:  6, germany:  6, china:  8, cuba:  5, singapore:  6 },
  education:            { us: 55, canada: 65, germany: 75, china: 25, cuba:  5, singapore: 60 },
  housing:              { us: 80, canada: 65, germany: 55, china: 45, cuba:  5, singapore: 20 },
  fuelProduction:       { us: 80, canada: 65, germany: 70, china: 15, cuba:  5, singapore: 55 },
  bankingAndFinance:    { us: 85, canada: 70, germany: 60, china: 15, cuba:  5, singapore: 65 },
  transportation:       { us: 65, canada: 55, germany: 35, china: 15, cuba:  5, singapore: 30 },
  internetAndTelecom:   { us: 75, canada: 60, germany: 55, china: 10, cuba:  5, singapore: 50 },
  military:             { us: 30, canada:  8, germany:  8, china:  8, cuba:  5, singapore:  8 },
  agriculture:          { us: 70, canada: 60, germany: 60, china: 25, cuba:  5, singapore: 50 },
  retirementAndPensions:{ us: 55, canada: 50, germany: 30, china: 25, cuba:  5, singapore: 40 },
};
```

All values are tunable by editing this file — no other code changes required.

---

## Component — EconSpectrum.tsx

State: `const [values, setValues] = useState<TSpectrumDefaults>(() => structuredClone(defaults))`

Reset button: `setValues(structuredClone(defaults))`

Renders a scrollable `<Table>` (MUI) with:
- **Header row**: Sector label column + one emoji flag per country (🇺🇸 🇨🇦 🇩🇪 🇨🇳 🇨🇺 🇸🇬)
- **Sub-header**: `← Socialist` / `Capitalist →` axis label spanning the full width
- **11 data rows**: alternating `#16213e` / `#0f0f23` backgrounds, white `#ffffff` text
- Each cell: MUI `<Slider>` min=0 max=100, each country has a distinct `color` prop

### Country colors
| Country | Color |
|---------|-------|
| 🇺🇸 US | `#e53935` |
| 🇨🇦 Canada | `#43a047` |
| 🇩🇪 Germany | `#fb8c00` |
| 🇨🇳 China | `#00acc1` |
| 🇨🇺 Cuba | `#8e24aa` |
| 🇸🇬 Singapore | `#f4511e` |

### Sector display names & emoji
| Key | Label |
|-----|-------|
| healthcare | 🏥 Healthcare |
| fireAndPolice | 🚒 Fire & Police |
| education | 🎓 Education |
| housing | 🏠 Housing |
| fuelProduction | ⛽ Fuel Production |
| bankingAndFinance | 🏦 Banking & Finance |
| transportation | 🚆 Transportation |
| internetAndTelecom | 📡 Internet & Telecom |
| military | 🪖 Military |
| agriculture | 🌾 Agriculture |
| retirementAndPensions | 👴 Retirement & Pensions |

---

## UX Details

- **Reset button** top-right of the table header — restores all sliders to authored defaults
- **No persistence** — state resets on page refresh (v1)
- **Sharing** — screenshot only (v1)
- **Scrollable** — `overflow-x: auto` wrapper for narrow viewports

---

## Not in scope (v1)

- URL-encoded state / shareable links
- localStorage persistence
- User-added countries or sectors
- Export / html2canvas button
