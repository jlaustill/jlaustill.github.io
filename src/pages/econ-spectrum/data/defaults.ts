export type TCountryKey = 'us' | 'canada' | 'germany' | 'china' | 'cuba' | 'singapore';
export type TSectorKey =
  | 'healthcare'
  | 'fireAndPolice'
  | 'education'
  | 'housing'
  | 'fuelProduction'
  | 'bankingAndFinance'
  | 'transportation'
  | 'internetAndTelecom'
  | 'military'
  | 'agriculture'
  | 'retirementAndPensions';

export type TSpectrumDefaults = Record<TSectorKey, Record<TCountryKey, number>>;

// 0 = fully socialist, 100 = fully capitalist
export const defaults: TSpectrumDefaults = {
  healthcare:            { us: 85, canada: 30, germany: 20, china: 40, cuba:  5, singapore: 55 },
  fireAndPolice:         { us:  8, canada:  6, germany:  6, china:  8, cuba:  5, singapore:  6 },
  education:             { us: 55, canada: 65, germany: 75, china: 25, cuba:  5, singapore: 60 },
  housing:               { us: 80, canada: 65, germany: 55, china: 45, cuba:  5, singapore: 20 },
  fuelProduction:        { us: 80, canada: 65, germany: 70, china: 15, cuba:  5, singapore: 55 },
  bankingAndFinance:     { us: 85, canada: 70, germany: 60, china: 15, cuba:  5, singapore: 65 },
  transportation:        { us: 65, canada: 55, germany: 35, china: 15, cuba:  5, singapore: 30 },
  internetAndTelecom:    { us: 75, canada: 60, germany: 55, china: 10, cuba:  5, singapore: 50 },
  military:              { us: 30, canada:  8, germany:  8, china:  8, cuba:  5, singapore:  8 },
  agriculture:           { us: 70, canada: 60, germany: 60, china: 25, cuba:  5, singapore: 50 },
  retirementAndPensions: { us: 55, canada: 50, germany: 30, china: 25, cuba:  5, singapore: 40 },
};
