import DictionaryLoader from "../utils/dictionaryLoader";
import { translateIpaToKfa, translateKfaToIpa } from "../utils/ipaToKfa";
import type { ITranslationResult, IEnhancedTranslationResult } from "../types";

export class TranslationService {
  private dictionary: DictionaryLoader;
  private initialized = false;

  constructor() {
    this.dictionary = new DictionaryLoader();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.dictionary.loadDictionary();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize translation service:', error);
      throw error;
    }
  }

  // English -> IPA
  async translateEnglishToIpa(text: string): Promise<ITranslationResult> {
    if (!this.initialized) await this.initialize();
    return this.dictionary.translateEnglishPhraseToIpa(text);
  }

  // English -> kfa (via IPA)
  async translateEnglishToKfa(text: string): Promise<ITranslationResult> {
    if (!this.initialized) await this.initialize();
    
    const ipaResult = this.dictionary.translateEnglishPhraseToIpa(text);
    if (!ipaResult.success) {
      return ipaResult;
    }

    const kfaResult = translateIpaToKfa(ipaResult.result);
    return {
      success: ipaResult.success && kfaResult.success,
      result: kfaResult.result,
      error: kfaResult.error || ipaResult.error
    };
  }

  // IPA -> English
  async translateIpaToEnglish(text: string): Promise<ITranslationResult> {
    if (!this.initialized) await this.initialize();
    return this.dictionary.translateIpaPhraseToEnglish(text);
  }

  // IPA -> kfa
  async translateIpaToKfa(text: string): Promise<ITranslationResult> {
    return translateIpaToKfa(text);
  }

  // kfa -> IPA
  async translateKfaToIpa(text: string): Promise<ITranslationResult> {
    return translateKfaToIpa(text);
  }

  // kfa -> English (via IPA)
  async translateKfaToEnglish(text: string): Promise<ITranslationResult> {
    if (!this.initialized) await this.initialize();
    
    const ipaResult = translateKfaToIpa(text);
    if (!ipaResult.success) {
      return ipaResult;
    }

    const englishResult = this.dictionary.translateIpaPhraseToEnglish(ipaResult.result);
    return {
      success: ipaResult.success && englishResult.success,
      result: englishResult.result,
      error: englishResult.error || ipaResult.error
    };
  }

  // Enhanced translation with pronunciation options
  async translateEnglishToEnhanced(text: string): Promise<IEnhancedTranslationResult> {
    if (!this.initialized) await this.initialize();
    return this.dictionary.translateEnglishPhraseToEnhanced(text);
  }

  // Helper method to translate from any format to the other two
  async translateText(text: string, fromFormat: 'english' | 'ipa' | 'kfa'): Promise<{
    english: ITranslationResult;
    ipa: ITranslationResult;
    kfa: ITranslationResult;
  }> {
    const results = {
      english: { success: false, result: '', error: 'Not translated' } as ITranslationResult,
      ipa: { success: false, result: '', error: 'Not translated' } as ITranslationResult,
      kfa: { success: false, result: '', error: 'Not translated' } as ITranslationResult
    };

    // Set the source format
    results[fromFormat] = { success: true, result: text };

    switch (fromFormat) {
      case 'english':
        results.ipa = await this.translateEnglishToIpa(text);
        results.kfa = await this.translateEnglishToKfa(text);
        break;
      
      case 'ipa':
        results.english = await this.translateIpaToEnglish(text);
        results.kfa = await this.translateIpaToKfa(text);
        break;
      
      case 'kfa':
        results.ipa = await this.translateKfaToIpa(text);
        results.english = await this.translateKfaToEnglish(text);
        break;
    }

    return results;
  }
}

export default TranslationService;