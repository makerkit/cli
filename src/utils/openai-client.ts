import OpenAI from 'openai';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY env variable is not set. Please set it in' +
        ' your .env.local file of your Makerkit workspace.'
    );
  }

  return new OpenAI({ apiKey });
}

export default getOpenAIClient;
