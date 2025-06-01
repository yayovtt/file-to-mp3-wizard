
import { createClient } from '@supabase/supabase-js';

export type AIProvider = 'chatgpt' | 'claude';

const supabaseUrl = 'https://jfzvushqvqnzmnebxlcg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmenZ1c2hxdnFuem1uZWJ4bGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MDUyNzEsImV4cCI6MjA2MzQ4MTI3MX0.iy6t_nwqXfbkhU1pVcHe-YBfjfyIZ8JE0jx5rhnA0Wc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const processText = async (
  text: string, 
  prompts: string[], 
  selectedOptions: string[], 
  apiKey: string, // This parameter is kept for backwards compatibility but not used
  separateMode: boolean = false,
  provider: AIProvider = 'chatgpt'
): Promise<string> => {
  try {
    console.log('Calling Supabase Edge Function for text processing...', {
      provider,
      separateMode,
      promptsCount: prompts.length,
      textLength: text.length
    });
    
    const { data, error } = await supabase.functions.invoke('process-text', {
      body: {
        text,
        prompts,
        selectedOptions,
        separateMode,
        provider
      }
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(`שגיאה בעיבוד הטקסט: ${error.message}`);
    }

    if (data?.error) {
      console.error('Processing error from Edge Function:', data.error);
      throw new Error(`שגיאה בעיבוד הטקסט: ${data.error}`);
    }

    if (!data?.result) {
      console.error('No result from Edge Function:', data);
      throw new Error('לא התקבלה תוצאה מהשרת');
    }

    console.log('Text processing completed successfully');
    return data.result;
  } catch (error) {
    console.error('Text processing error:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('שגיאה בחיבור לשרת. אנא נסה שוב.');
    }
    
    if (error.message?.includes('API key')) {
      throw new Error('בעיה עם מפתח ה-API. אנא בדוק את ההגדרות.');
    }
    
    throw new Error(`שגיאה בעיבוד הטקסט: ${error.message || 'שגיאה לא ידועה'}`);
  }
};
