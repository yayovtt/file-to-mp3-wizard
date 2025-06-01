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

const getProcessingPrompt = (processingTypes: string[]): string => {
  const prompts: { [key: string]: string } = {
    correct: 'תקן שגיאות כתיב ודקדוק, ובמידת הצורך הוסף מקורות או הפניות רלוונטיות',
    rewrite: 'ערוך מחדש את הטקסט בצורה ברורה יותר ומובנת יותר',
    expand: 'הרחב את הרעיונות הקיימים בטקסט והוסף פרטים נוספים',
    summarize: 'סכם את הטקסט בצורה קצרה וברורה תוך שמירה על הנקודות המרכזיות'
  };

  const selectedPrompts = processingTypes.map(type => prompts[type]).filter(Boolean);
  
  if (selectedPrompts.length === 1) {
    return selectedPrompts[0];
  } else {
    return `בצע את הפעולות הבאות על הטקסט: ${selectedPrompts.join(', ')}`;
  }
};

export const processTextWithAI = async (text: string, processingTypes: string[], apiKey: string): Promise<string> => {
  const processingPrompt = getProcessingPrompt(processingTypes);
  
  const messages: ChatGPTMessage[] = [
    {
      role: 'system',
      content: 'אתה עוזר מקצועי לעיבוד טקסטים בעברית. בצע את המשימות המבוקשות בצורה מקצועית ומדויקת.',
    },
    {
      role: 'user',
      content: `${processingPrompt}:\n\n${text}`,
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
      max_tokens: 1000,
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

// Keep the old function for backward compatibility
export const summarizeText = async (text: string, apiKey: string): Promise<string> => {
  return processTextWithAI(text, ['summarize'], apiKey);
};
