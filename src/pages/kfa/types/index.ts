export interface IPhonemeMapping {
  ipa: string;
  kfa: string;
  description: string;
  examples: string[];
}

export interface ITranslationResult {
  success: boolean;
  result: string;
  error?: string;
}

export interface IDictionaryEntry {
  ipa: string;
  priority: number;
  region: string;
}

export interface IWordTranslation {
  originalWord: string;
  pronunciations: {
    english: string;
    ipa: string;
    kfa: string;
    priority: number;
    region: string;
  }[];
  selectedPronunciation: number; // Index into pronunciations array
  hasMultiplePronunciations: boolean;
}

export interface IEnhancedTranslationResult {
  success: boolean;
  words: IWordTranslation[];
  errors?: string[];
}