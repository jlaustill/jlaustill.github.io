export interface IToken {
  type: 'word' | 'punctuation' | 'whitespace';
  value: string;
  originalCase?: string; // For preserving case
}

export function tokenizeEnglishText(text: string): IToken[] {
  const tokens: IToken[] = [];
  let currentPos = 0;
  
  while (currentPos < text.length) {
    const char = text[currentPos];
    
    // Handle whitespace
    if (/\s/.test(char)) {
      let whitespace = '';
      while (currentPos < text.length && /\s/.test(text[currentPos])) {
        whitespace += text[currentPos];
        currentPos++;
      }
      tokens.push({ type: 'whitespace', value: whitespace });
    }
    // Handle punctuation
    else if (/[^\w\s]/.test(char)) {
      let punctuation = '';
      while (currentPos < text.length && /[^\w\s]/.test(text[currentPos])) {
        punctuation += text[currentPos];
        currentPos++;
      }
      tokens.push({ type: 'punctuation', value: punctuation });
    }
    // Handle words (including contractions with apostrophes)
    else {
      let word = '';
      while (currentPos < text.length && (/\w/.test(text[currentPos]) || 
             (text[currentPos] === "'" && currentPos + 1 < text.length && /\w/.test(text[currentPos + 1])))) {
        word += text[currentPos];
        currentPos++;
      }
      tokens.push({ 
        type: 'word', 
        value: word.toLowerCase(),
        originalCase: word
      });
    }
  }
  
  return tokens;
}

export function reconstructText(tokens: IToken[]): string {
  return tokens.map(token => {
    if (token.type === 'word' && token.originalCase) {
      return token.originalCase;
    }
    return token.value;
  }).join('');
}

// For IPA/kfa tokenization - longest first matching
export function tokenizePhonemeText(text: string, phonemeMap: Map<string, string>): string[] {
  const tokens: string[] = [];
  const phonemes = Array.from(phonemeMap.keys()).sort((a, b) => b.length - a.length);
  
  let currentPos = 0;
  
  while (currentPos < text.length) {
    const char = text[currentPos];
    
    // Handle whitespace and punctuation - keep as-is
    if (/[\s\p{P}]/u.test(char)) {
      tokens.push(char);
      currentPos++;
      continue;
    }
    
    // Find longest matching phoneme
    let matched = false;
    for (const phoneme of phonemes) {
      if (text.substr(currentPos, phoneme.length) === phoneme) {
        tokens.push(phoneme);
        currentPos += phoneme.length;
        matched = true;
        break;
      }
    }
    
    // If no phoneme matched, add the character as-is
    if (!matched) {
      tokens.push(char);
      currentPos++;
    }
  }
  
  return tokens;
}

// For handling ambiguous kfa sequences like "ur" (UR vs UUR)
export function generateKfaAmbiguousOptions(kfaText: string): string[][] {
  const words = kfaText.split(/\s+/);
  return words.map(word => generateWordAmbiguousOptions(word));
}

function generateWordAmbiguousOptions(word: string): string[] {
  // Handle ambiguous sequences - this will be implemented later
  // const ambiguousMap = new Map([
  //   ['ur', ['ɜː', 'ʊə']], // UR sound vs UUR sound
  //   ['T', ['θ', 'ð']],     // TH thin vs TH this
  //   ['o', ['ɑː', 'ɔː', 'ɒ']], // Various O sounds
  //   ['u', ['ə', 'ʌ']]      // Schwa vs schwa-like
  // ]);
  
  // For now, return the word as-is
  // TODO: Implement proper ambiguity resolution
  return [word];
}

export default {
  tokenizeEnglishText,
  reconstructText,
  tokenizePhonemeText,
  generateKfaAmbiguousOptions
};