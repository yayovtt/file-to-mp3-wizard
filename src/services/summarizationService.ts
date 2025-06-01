
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

export const summarizeText = async (text: string, apiKey: string): Promise<string> => {
  const messages: ChatGPTMessage[] = [
    {
      role: 'system',
      content: 'אתה עוזר מקצועי לסיכום טקסטים בעברית. סכם את הטקסט הבא בצורה קצרה וברורה, תוך שמירה על הנקודות המרכזיות.',
    },
    {
      role: 'user',
      content: `אנא סכם את הטקסט הבא:\n\n${text}`,
    },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Summarization failed: ${response.statusText}`);
  }

  const result: ChatGPTResponse = await response.json();
  return result.choices[0].message.content;
};
