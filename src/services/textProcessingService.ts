
export type AIProvider = 'chatgpt' | 'claude';

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

export const processText = async (
  text: string, 
  prompts: string[], 
  selectedOptions: string[], 
  apiKey: string,
  separateMode: boolean = false,
  provider: AIProvider = 'chatgpt'
): Promise<string> => {
  let combinedPrompt = '';
  
  if (prompts.length === 1) {
    combinedPrompt = prompts[0];
  } else {
    if (separateMode) {
      combinedPrompt = `בצע את הפעולות הבאות על הטקסט, כל פעולה בנפרד עם כותרת ברורה:

${prompts.map((prompt, index) => `${index + 1}. ${selectedOptions[index]}: ${prompt}`).join('\n')}

חשוב: הצג את התוצאה עם כותרת ברורה לכל סוג עיבוד (למשל "תיקון שגיאות:", "עריכה:", וכו'), והפרד בין הסעיפים בקו מפריד או רווח.`;
    } else {
      combinedPrompt = `בצע את כל הפעולות הבאות על הטקסט באופן משולב ומקיף, והחזר טקסט אחד מעובד שכולל את כל השיפורים:

${prompts.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n')}

חשוב: אל תפצל את התוצאה לחלקים נפרדים. החזר טקסט אחד רציף שעבר את כל העיבודים הנדרשים יחד.`;
    }
  }

  if (provider === 'chatgpt') {
    return await processWithChatGPT(text, combinedPrompt, separateMode, apiKey);
  } else {
    return await processWithClaude(text, combinedPrompt, separateMode, apiKey);
  }
};

const processWithChatGPT = async (
  text: string,
  combinedPrompt: string,
  separateMode: boolean,
  apiKey: string
): Promise<string> => {
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
};

const processWithClaude = async (
  text: string,
  combinedPrompt: string,
  separateMode: boolean,
  apiKey: string
): Promise<string> => {
  const systemMessage = separateMode 
    ? 'אתה עוזר מקצועי לעיבוד טקסטים בעברית. כאשר מתבקש לבצע מספר פעולות עיבוד בנפרד, הצג כל תוצאה עם כותרת ברורה והפרד בין הסעיפים.'
    : 'אתה עוזר מקצועי לעיבוד טקסטים בעברית. כאשר מתבקש לבצע מספר פעולות עיבוד, תבצע אותן באופן משולב ותחזיר טקסט אחד מעובד שכולל את כל השיפורים בצורה הרמונית וזורמת.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
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
      throw new Error(`Claude processing failed: ${response.statusText}`);
    }

    const result: ClaudeResponse = await response.json();
    return result.content[0].text;
  } catch (error) {
    console.error('Claude fetch error:', error);
    // Fallback to ChatGPT if Claude fails
    console.log('Falling back to ChatGPT due to Claude error');
    throw new Error(`Claude API לא זמין כרגע. נסה שוב או השתמש ב-ChatGPT`);
  }
};
