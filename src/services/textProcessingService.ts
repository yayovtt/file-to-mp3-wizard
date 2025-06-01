
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

export type AIProvider = 'chatgpt' | 'claude';

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
      // Process each option separately with clear headers
      combinedPrompt = `בצע את הפעולות הבאות על הטקסט, כל פעולה בנפרד עם כותרת ברורה:

${prompts.map((prompt, index) => `${index + 1}. ${selectedOptions[index]}: ${prompt}`).join('\n')}

חשוב: הצג את התוצאה עם כותרת ברורה לכל סוג עיבוד (למשל "תיקון שגיאות:", "עריכה:", וכו'), והפרד בין הסעיפים בקו מפריד או רווח.`;
    } else {
      // Create a comprehensive prompt that applies all selected processing options together
      combinedPrompt = `בצע את כל הפעולות הבאות על הטקסט באופן משולב ומקיף, והחזר טקסט אחד מעובד שכולל את כל השיפורים:

${prompts.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n')}

חשוב: אל תפצל את התוצאה לחלקים נפרדים. החזר טקסט אחד רציף שעבר את כל העיבודים הנדרשים יחד.`;
    }
  }

  const systemMessage = separateMode 
    ? 'אתה עוזר מקצועי לעיבוד טקסטים בעברית. כאשר מתבקש לבצע מספר פעולות עיבוד בנפרד, הצג כל תוצאה עם כותרת ברורה והפרד בין הסעיפים.'
    : 'אתה עוזר מקצועי לעיבוד טקסטים בעברית. כאשר מתבקש לבצע מספר פעולות עיבוד, תבצע אותן באופן משולב ותחזיר טקסט אחד מעובד שכולל את כל השיפורים בצורה הרמונית וזורמת.';

  if (provider === 'claude') {
    // Use the provided Claude API key
    const claudeApiKey = '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';
    return await processWithClaude(combinedPrompt, text, systemMessage, claudeApiKey);
  } else {
    return await processWithChatGPT(combinedPrompt, text, systemMessage, apiKey);
  }
};

const processWithChatGPT = async (
  combinedPrompt: string,
  text: string,
  systemMessage: string,
  apiKey: string
): Promise<string> => {
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
  combinedPrompt: string,
  text: string,
  systemMessage: string,
  apiKey: string
): Promise<string> => {
  console.log('Starting Claude API request...');
  
  const messages: ClaudeMessage[] = [
    {
      role: 'user',
      content: `${systemMessage}\n\n${combinedPrompt}\n\nטקסט לעיבוד:\n\n${text}`,
    },
  ];

  const requestBody = {
    model: 'claude-3-haiku-20240307',
    max_tokens: 2000,
    temperature: 0.3,
    messages,
  };

  console.log('Claude request body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Claude response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API Error Response:', errorText);
      
      if (response.status === 401) {
        throw new Error('מפתח API של Claude לא תקין או פג תוקף. אנא בדוק את המפתח.');
      } else if (response.status === 403) {
        throw new Error('אין הרשאה לגשת ל-API של Claude. יכול להיות שהמפתח לא פעיל.');
      } else if (response.status === 429) {
        throw new Error('הגעת למגבלת הבקשות של Claude API. נסה שוב מאוחר יותר.');
      } else {
        throw new Error(`Claude API Error (${response.status}): ${errorText}`);
      }
    }

    const result: ClaudeResponse = await response.json();
    console.log('Claude response:', result);
    
    if (!result.content || !result.content[0] || !result.content[0].text) {
      throw new Error('תגובה לא תקינה מ-Claude API');
    }
    
    return result.content[0].text;
  } catch (error) {
    console.error('Claude API Detailed Error:', error);
    
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('לא ניתן להתחבר ל-Claude API. יכול להיות שיש בעיית רשת או שה-API חסום. נסה להשתמש ב-ChatGPT במקום.');
    }
    
    throw error;
  }
};
