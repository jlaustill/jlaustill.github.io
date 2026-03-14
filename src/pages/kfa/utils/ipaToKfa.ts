import type { ITranslationResult } from "../types";
import { tokenizePhonemeText } from "./tokenizer";

// IPA to kfa mappings based on your README
const IPA_TO_KFA_MAP = new Map<string, string>([
  // Vowels (sorted by length - longest first to avoid partial matches)
  ['əʊ', 'uO'],  // Long O (go)
  ['ow', 'uO'],  // Long O variant (don't)
  ['aɪ', 'uy'],  // Long I (my) - standard IPA
  ['aj', 'uy'],  // Long I (my) - dictionary variant
  ['eɪ', 'ay'],  // Long A (day) - standard IPA
  ['ej', 'ay'],  // Long A (day) - dictionary variant
  ['aʊ', 'aO'],  // OW sound (now)
  ['aw', 'aO'],  // OW sound variant (how)
  ['uʌ', 'Ou'],  // OW sound variant (Joshua)
  ['ɪə', 'ir'],  // EER sound (here)
  ['eə', 'er'],  // AIR sound (hair)
  ['ʊə', 'ur'],  // UUR sound (sure)
  ['ɔɪ', 'oy'],  // OY sound (boy)
  ['iː', 'y'],   // Long E (see)
  ['biˈ', 'by'], // Word "be" pronunciation 
  ['iˈ', 'y'],   // Long E with stress (dreamed)
  ['siˈɪ', 'syy'], // Long E with s and stress followed by Long E (seeing)
  ['siˈ', 'sy'], // Long E with s and stress (seeing)
  ['ɜː', 'ur'],  // UR sound (bird)
  ['uː', 'O'],   // Long U (moon)
  ['uˈ', 'O'],   // Long U with stress (into)
  ['ɑː', 'o'],   // Long A (car)
  ['ɔː', 'o'],   // Long O (saw)
  ['wɚ', 'wur'], // R-colored schwa with w (work)
  ['ɚ', 'ur'],   // R-colored schwa (general)
  ['ə', 'u'],    // Schwa (about)
  ['ɪŋ', 'yng'], // -ing ending with short i (exciting, seeing)
  ['iŋ', 'yng'], // -ing ending with long i (breathtaking)
  ['ɪ', 'i'],    // Short I (bit)
  ['i', 'y'],    // Long E (any, happy, see)
  ['sɪˈ', 'sy'], // Short I with s and stress (simply)
  ['æ', 'a'],    // Short A (cat)
  ['e', 'e'],    // Short E (bed)
  ['ɛ', 'e'],    // Short E variant (breath)
  ['ʌ', 'u'],    // Schwa-like (cup)
  ['ɒ', 'o'],    // Short O (hot)
  ['ɔ', 'o'],    // Short O variant (your)
  ['ɑ', 'o'],    // Father/LOT vowel (not, Joshua)
  ['ʊ', 'U'],    // Short U (book)
  
  // Consonants
  ['dʒ', 'J'],   // J sound (jump) - two character version
  ['ʤ', 'J'],    // J sound (jump) - single character version
  ['tʃ', 'c'],   // CH sound (chair) - two character version
  ['ʧ', 'c'],    // CH sound (chair) - single character version
  ['ʃ', 'S'],    // SH sound (ship)
  ['ʒ', 'Z'],    // ZH sound (pleasure)
  ['θ', 'T'],    // TH thin (think)
  ['ð', 'T'],    // TH this (this)
  ['ŋ', 'ng'],   // NG sound (sing)
  ['n', 'n'],    // N sound
  ['r', 'r'],    // R sound
  ['ɹ', 'r'],    // R sound variant
  ['t', 't'],    // T sound
  ['s', 's'],    // S sound
  ['d', 'd'],    // D sound
  ['l', 'l'],    // L sound
  ['k', 'k'],    // K sound
  ['m', 'm'],    // M sound
  ['z', 'z'],    // Z sound
  ['p', 'p'],    // P sound
  ['v', 'v'],    // V sound
  ['w', 'w'],    // W sound
  ['b', 'b'],    // B sound
  ['f', 'f'],    // F sound
  ['h', 'h'],    // H sound
  ['j', 'j'],    // Y sound
  ['g', 'g'],    // G sound
]);

export function translateIpaToKfa(ipaText: string): ITranslationResult {
  // Use tokenizer for proper phoneme segmentation
  const tokens = tokenizePhonemeText(ipaText, IPA_TO_KFA_MAP);
  const translatedTokens: string[] = [];
  const unknownSymbols: string[] = [];

  for (const token of tokens) {
    // Skip whitespace and punctuation
    if (/[\s\p{P}]/u.test(token)) {
      translatedTokens.push(token);
      continue;
    }

    // Handle bracketed words (unknown from previous step)
    if (token.startsWith('[') && token.endsWith(']')) {
      translatedTokens.push(token); // Keep bracketed words as-is
      continue;
    }

    // Try to translate the token
    const kfaEquivalent = IPA_TO_KFA_MAP.get(token);
    if (kfaEquivalent) {
      translatedTokens.push(kfaEquivalent);
    } else if (token.match(/[ˈˌ]/)) {
      // Skip stress marks
      continue;
    } else if (token.match(/[ɪɨʉɯɘəɵɞɤɣɢʎʟɱɳɲɴɽɾɿʀʁʂʃʈʉʊʋʌʍʎʏʐʑʒʔʕʖʗʘʙʚʛʜʝʞʟʠʡʢʣʤʥʦʧʨʩʪʫʬʭʮʯ]/)) {
      // Unknown IPA symbol
      unknownSymbols.push(token);
      translatedTokens.push(token); // Keep as-is
    } else {
      // Regular character (like English letters)
      translatedTokens.push(token);
    }
  }

  const result = translatedTokens.join('');
  const hasUnknownSymbols = unknownSymbols.length > 0;

  return {
    success: !hasUnknownSymbols,
    result: result,
    error: hasUnknownSymbols ? 
      `Unknown IPA symbols found: ${[...new Set(unknownSymbols)].join(', ')}` : 
      undefined
  };
}

export function translateKfaToIpa(kfaText: string): ITranslationResult {
  // Create reverse mapping (kfa -> IPA)
  const KFA_TO_IPA_MAP = new Map<string, string>();
  for (const [ipa, kfa] of IPA_TO_KFA_MAP.entries()) {
    // Handle multiple IPA symbols mapping to same kfa (like θ and ð both -> T)
    if (!KFA_TO_IPA_MAP.has(kfa)) {
      KFA_TO_IPA_MAP.set(kfa, ipa);
    }
  }

  // Use tokenizer for proper phoneme segmentation
  const tokens = tokenizePhonemeText(kfaText, KFA_TO_IPA_MAP);
  const translatedTokens: string[] = [];

  for (const token of tokens) {
    // Skip whitespace and punctuation
    if (/[\s\p{P}]/u.test(token)) {
      translatedTokens.push(token);
      continue;
    }

    // Try to translate the token
    const ipaEquivalent = KFA_TO_IPA_MAP.get(token);
    if (ipaEquivalent) {
      translatedTokens.push(ipaEquivalent);
    } else {
      // Keep unknown tokens as-is
      translatedTokens.push(token);
    }
  }

  const result = translatedTokens.join('');

  return {
    success: true,
    result: result
  };
}

// Helper function for regex escaping (currently unused but may be needed later)
// function escapeRegExp(string: string): string {
//   return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// }

export default {
  translateIpaToKfa,
  translateKfaToIpa
};