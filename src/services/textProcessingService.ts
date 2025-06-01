
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

export const processText = async (
  text: string, 
  prompts: string[], 
  selectedOptions: string[], 
  apiKey: string
): Promise<string> => {
  let combinedPrompt = '';
  
  if (prompts.length === 1) {
    combinedPrompt = prompts[0];
  } else {
    combinedPrompt = `בצע את הפעולות הבאות על הטקסט:\n${prompts.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n')}\n\nהחזר את התוצאה המעובדת עם כותרות ברורות לכל סוג עיבוד:`;
  }

  const messages: ChatGPTMessage[] = [
    {
      role: 'system',
      content: 'אתה עוזר מקצועי לעיבוד טקסטים בעברית. בצע את המשימות המבוקשות בצורה מקצועית ואיכותית.',
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
    console.error('API Error:', errorText);
    throw new Error(`Text processing failed: ${response.statusText}`);
  }

  const result: ChatGPTResponse = await response.json();
  return result.choices[0].message.content;
};
