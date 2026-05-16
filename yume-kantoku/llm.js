import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API client. It expects GEMINI_API_KEY to be set in the environment.
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. LLM calls will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || 'mock-key');

/**
 * Call the Gemini API with a prompt.
 * @param {string} prompt - The prompt to send to the model.
 * @param {object} options - Optional configuration.
 * @param {string} options.model - The model to use (default: 'gemini-3.1-flash-lite').
 * @param {string} options.systemInstruction - Optional system instruction to guide the model.
 * @returns {Promise<string>} The generated text.
 */
export async function askLLM(prompt, options = {}) {
  const modelName = options.model || process.env.KANTOKU_MODEL || 'gemini-3.1-flash-lite';
  
  const modelConfig = { model: modelName };
  if (options.systemInstruction) {
    modelConfig.systemInstruction = options.systemInstruction;
  }

  const model = genAI.getGenerativeModel(modelConfig);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error(`[Kantoku] LLM Error (Model: ${modelName}):`, error.message);
    throw error;
  }
}
