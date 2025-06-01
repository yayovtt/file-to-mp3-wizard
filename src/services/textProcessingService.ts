
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
  apiKey: string,
  separateMode: boolean = false
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
    console.error('API Error:', errorText);
    throw new Error(`Text processing failed: ${response.statusText}`);
  }

  const result: ChatGPTResponse = await response.json();
  return result.choices[0].message.content;
};
