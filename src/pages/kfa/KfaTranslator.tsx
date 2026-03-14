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
