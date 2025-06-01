
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatGPTMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

interface ChatGPTResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{
    text: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, prompts, selectedOptions, separateMode = false, provider = 'chatgpt' } = await req.json();

    console.log('Processing request:', { provider, separateMode, promptsCount: prompts.length });

    let combinedPrompt = '';
    
    if (prompts.length === 1) {
      combinedPrompt = prompts[0];
    } else {
      if (separateMode) {
        combinedPrompt = `בצע את הפעולות הבאות על הטקסט, כל פעולה בנפרד עם כותרת ברורה:

${prompts.map((prompt: string, index: number) => `${index + 1}. ${selectedOptions[index]}: ${prompt}`).join('\n')}

חשוב: הצג את התוצאה עם כותרת ברורה לכל סוג עיבוד (למשל "תיקון שגיאות:", "עריכה:", וכו'), והפרד בין הסעיפים בקו מפריד או רווח.`;
      } else {
        combinedPrompt = `בצע את כל הפעולות הבאות על הטקסט באופן משולב ומקיף, והחזר טקסט אחד מעובד שכולל את כל השיפורים:

${prompts.map((prompt: string, index: number) => `${index + 1}. ${prompt}`).join('\n')}

חשוב: אל תפצל את התוצאה לחלקים נפרדים. החזר טקסט אחד רציף שעבר את כל העיבודים הנדרשים יחד.`;
      }
    }

    let result: string;

    if (provider === 'chatgpt') {
      result = await processWithChatGPT(text, combinedPrompt, separateMode);
    } else {
      result = await processWithClaude(text, combinedPrompt, separateMode);
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Text processing error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'שגיאה בעיבוד הטקסט' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processWithChatGPT(
  text: string,
  combinedPrompt: string,
  separateMode: boolean
): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemMessage = separateMode 
    ? 'אתה עוזר מקצועי לעיבוד טקסטים בעברית. כאשר מתבקש לבצע מספר פעולות עיבוד בנפרד, הצג כל תוצאה עם כותרת ברורה והפרד בין הסעיפים.'
    : 'אתה עוזר מקצועי לעיבוד טקסטים בעברית. כאשר מתבקש לבצע מספר פעולות עיבוד, תבצע אותן באופן משולב ותחזיר טקסט אחד מעובד שכולל את כל השיפורים בצורה הרמונית וזורמת.';

  const messages: ChatGPTMessage[] = [
    {
      role: 'system',
      content: systemMessage,
    },
    {
      role: 'user',
      content: `${combinedPrompt}\n\nטקסט לעיבוד:\n\n${text}`,
    },
  ];

  console.log('Calling ChatGPT API...');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ChatGPT API Error:', errorText);
    throw new Error(`ChatGPT processing failed: ${response.statusText}`);
  }

  const result: ChatGPTResponse = await response.json();
  return result.choices[0].message.content;
}

async function processWithClaude(
  text: string,
  combinedPrompt: string,
  separateMode: boolean
): Promise<string> {
  const apiKey = Deno.env.get('CLAUDE_API_KEY');
  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  const systemMessage = separateMode 
    ? 'אתה עוזר מקצועי לעיבוד טקסטים בעברית. כאשר מתבקש לבצע מספר פעולות עיבוד בנפרד, הצג כל תוצאה עם כותרת ברורה והפרד בין הסעיפים.'
    : 'אתה עוזר מקצועי לעיבוד טקסטים בעברית. כאשר מתבקש לבצע מספר פעולות עיבוד, תבצע אותן באופן משולב ותחזיר טקסט אחד מעובד שכולל את כל השיפורים בצורה הרמונית וזורמת.';

  console.log('Calling Claude API...');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      system: systemMessage,
      messages: [
        {
          role: 'user',
          content: `${combinedPrompt}\n\nטקסט לעיבוד:\n\n${text}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API Error:', errorText);
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const result: ClaudeResponse = await response.json();
  return result.content[0].text;
}
