import { Box, Typography } from '@mui/material';
import type { IEnhancedTranslationResult, IWordTranslation } from '../types';
import TranslationWord from './TranslationWord';

interface IEnhancedTranslationDisplayProps {
  result: IEnhancedTranslationResult;
  format: 'english' | 'ipa' | 'kfa';
  title: string;
  onWordPronunciationChange: (wordIndex: number, newPronunciationIndex: number) => void;
}

export default function EnhancedTranslationDisplay({
  result,
  format,
  title,
  onWordPronunciationChange
}: IEnhancedTranslationDisplayProps) {
  
  const handlePronunciationChange = (wordIndex: number) => (newPronunciationIndex: number) => {
    onWordPronunciationChange(wordIndex, newPronunciationIndex);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Box
        sx={{
          minHeight: '120px',
          padding: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'background.paper',
          fontSize: '1rem',
          lineHeight: 1.6,
          fontFamily: format === 'ipa' ? 'monospace' : 'inherit'
        }}
      >
        {result.words.map((word: IWordTranslation, index: number) => (
          <TranslationWord
            key={index}
            word={word}
            format={format}
            onPronunciationChange={handlePronunciationChange(index)}
          />
        ))}
      </Box>

      {result.errors && result.errors.length > 0 && (
        <Typography 
          variant="caption" 
          color="warning.main" 
          sx={{ mt: 1, display: 'block' }}
        >
          Warnings: {result.errors.join('; ')}
        </Typography>
      )}
    </Box>
  );
}