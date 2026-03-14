import type { ITranslationResult, IDictionaryEntry, IEnhancedTranslationResult, IWordTranslation } from "../types";
import { tokenizeEnglishText } from "./tokenizer";
import { translateIpaToKfa } from "./ipaToKfa";


export class DictionaryLoader {
  private dictionary: Record<string, IDictionaryEntry[]> = {};
  private ipaToEnglish = new Map<string, string[]>();
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  async loadDictionary(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this.doLoad();
    return this.loadPromise;
  }

  private async doLoad(): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/ipadict.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      this.dictionary = jsonData;
      
      // Build reverse mapping (IPA -> English)
      for (const [word, pronunciations] of Object.entries(this.dictionary)) {
        for (const entry of pronunciations) {
          if (!this.ipaToEnglish.has(entry.ipa)) {
            this.ipaToEnglish.set(entry.ipa, []);
          }
          this.ipaToEnglish.get(entry.ipa)?.push(word);
        }
      }
      
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load dictionary:', error);
      throw error;
    }
  }

  translateEnglishToIpa(word: string): ITranslationResult {
    const cleanWord = word.toLowerCase().trim();
    const pronunciations = this.dictionary[cleanWord];
    
    if (pronunciations && pronunciations.length > 0) {
      // Use highest priority pronunciation (lowest priority number)
      const bestPronunciation = pronunciations.reduce((best, current) => 
        current.priority < best.priority ? current : best
      );
      return { success: true, result: bestPronunciation.ipa };
    }
    
    return { 
      success: false, 
      result: '',
      error: `Word "${word}" not found in dictionary`
    };
  }

  translateIpaToEnglish(ipa: string): ITranslationResult {
    const words = this.ipaToEnglish.get(ipa.trim());
    
    if (words && words.length > 0) {
      // Return the first/most common word
      return { success: true, result: words[0] };
    }
    
    return { 
      success: false, 
      result: '',
      error: `IPA "${ipa}" not found in dictionary`
    };
  }

  // For phrase translation with proper tokenization
  translateEnglishPhraseToIpa(phrase: string): ITranslationResult {
    const tokens = tokenizeEnglishText(phrase);
    const errors: string[] = [];

    const translatedTokens = tokens.map(token => {
      if (token.type === 'word') {
        const result = this.translateEnglishToIpa(token.value);
        if (result.success) {
          return { ...token, value: result.result };
        } else {
          errors.push(`Word "${token.originalCase || token.value}" not found in dictionary`);
          return { ...token, value: `[${token.originalCase || token.value}]` };
        }
      }
      return token;
    });

    const result = translatedTokens.map(token => token.value).join('');

    return {
      success: true, // Always successful if we can provide a result with brackets
      result: result,
      error: errors.length > 0 ? errors.join('; ') : undefined
    };
  }

  translateIpaPhraseToEnglish(phrase: string): ITranslationResult {
    const ipaWords = phrase.split(/\s+/);
    const englishWords: string[] = [];
    const errors: string[] = [];

    for (const ipaWord of ipaWords) {
      // Skip already-bracketed words (they're unknown from previous step)
      if (ipaWord.startsWith('[') && ipaWord.endsWith(']')) {
        englishWords.push(ipaWord); // Keep the bracketed word as-is
        continue;
      }
      
      const result = this.translateIpaToEnglish(ipaWord);
      if (result.success) {
        englishWords.push(result.result);
      } else {
        errors.push(result.error || `Unknown IPA: ${ipaWord}`);
        englishWords.push(`[${ipaWord}]`); // Mark unknown IPA
      }
    }

    return {
      success: true, // Always successful if we can provide a result with brackets
      result: englishWords.join(' '),
      error: errors.length > 0 ? errors.join('; ') : undefined
    };
  }

  // Find all English words that share the same pronunciation
  private findHomophones(targetIpa: string): string[] {
    const homophones: string[] = [];
    
    for (const [word, pronunciations] of Object.entries(this.dictionary)) {
      for (const entry of pronunciations) {
        if (entry.ipa === targetIpa) {
          homophones.push(word);
          break; // Don't add the same word multiple times
        }
      }
    }
    
    return homophones.sort(); // Sort alphabetically for consistent ordering
  }

  // Helper method to match case style of source word
  private matchCase(target: string, source: string): string {
    if (source === source.toUpperCase()) {
      // All uppercase
      return target.toUpperCase();
    } else if (source[0] === source[0].toUpperCase() && source.slice(1) === source.slice(1).toLowerCase()) {
      // Title case
      return target[0].toUpperCase() + target.slice(1).toLowerCase();
    } else {
      // Keep original case
      return target;
    }
  }

  // Enhanced translation that returns detailed pronunciation options
  translateEnglishPhraseToEnhanced(phrase: string): IEnhancedTranslationResult {
    const tokens = tokenizeEnglishText(phrase);
    const words: IWordTranslation[] = [];
    const errors: string[] = [];

    for (const token of tokens) {
      if (token.type === 'word') {
        const pronunciations = this.dictionary[token.value];
        
        if (pronunciations && pronunciations.length > 0) {
          // Sort pronunciations by priority (lower number = higher priority)
          const sortedPronunciations = [...pronunciations].sort((a, b) => a.priority - b.priority);
          
          // For each pronunciation, find homophones and include them as alternative English words
          const allPronunciationOptions: IWordTranslation['pronunciations'] = [];
          
          for (const entry of sortedPronunciations) {
            const kfaResult = translateIpaToKfa(entry.ipa);
            const homophones = this.findHomophones(entry.ipa);
            
            // Add the original word first
            allPronunciationOptions.push({
              english: token.originalCase || token.value,
              ipa: entry.ipa,
              kfa: kfaResult.success ? kfaResult.result : `[${entry.ipa}]`,
              priority: entry.priority,
              region: entry.region
            });
            
            // Add homophones as alternative pronunciations (with same IPA/kfa but different English)
            for (const homophone of homophones) {
              if (homophone.toLowerCase() !== token.value.toLowerCase()) {
                // Preserve case style of original word when possible
                const formattedHomophone = this.matchCase(homophone, token.originalCase || token.value);
                allPronunciationOptions.push({
                  english: formattedHomophone,
                  ipa: entry.ipa,
                  kfa: kfaResult.success ? kfaResult.result : `[${entry.ipa}]`,
                  priority: entry.priority + 100, // Lower priority for homophones
                  region: entry.region
                });
              }
            }
          }
          
          const wordTranslation: IWordTranslation = {
            originalWord: token.originalCase || token.value,
            pronunciations: allPronunciationOptions,
            selectedPronunciation: 0, // Default to the original word
            hasMultiplePronunciations: allPronunciationOptions.length > 1
          };
          
          words.push(wordTranslation);
        } else {
          // Unknown word
          errors.push(`Word "${token.originalCase || token.value}" not found in dictionary`);
          const unknownWord: IWordTranslation = {
            originalWord: token.originalCase || token.value,
            pronunciations: [{
              english: `[${token.originalCase || token.value}]`,
              ipa: `[${token.originalCase || token.value}]`,
              kfa: `[${token.originalCase || token.value}]`,
              priority: 1,
              region: ""
            }],
            selectedPronunciation: 0,
            hasMultiplePronunciations: false
          };
          words.push(unknownWord);
        }
      } else {
        // Handle whitespace and punctuation as single-character "words"
        const punctuationWord: IWordTranslation = {
          originalWord: token.value,
          pronunciations: [{
            english: token.value,
            ipa: token.value,
            kfa: token.value,
            priority: 1,
            region: ""
          }],
          selectedPronunciation: 0,
          hasMultiplePronunciations: false
        };
        words.push(punctuationWord);
      }
    }

    return {
      success: true,
      words: words,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

export default DictionaryLoader;