
import { createClient } from '@supabase/supabase-js';

export type AIProvider = 'chatgpt' | 'claude';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    console.log('Calling Supabase Edge Function for text processing...');
    
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

    if (data.error) {
      throw new Error(data.error);
    }

    return data.result;
  } catch (error) {
    console.error('Text processing error:', error);
    throw new Error(`שגיאה בעיבוד הטקסט: ${error.message}`);
  }
};
