/** One-click OpenAI-compatible providers (often lower TTFT than local CPU). */
export const CLOUD_PROVIDER_PRESETS = [
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    hint: 'API key required',
  },
  {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    hint: 'Fast hosted inference',
  },
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    hint: 'Many models, one API key',
  },
  {
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    hint: 'Hosted open models',
  },
] as const
