export interface AIConfig {
  provider: 'huggingface' | 'groq' | 'ollama' | 'together' | 'openai';
  apiKey?: string;
  model: string;
  endpoint: string;
  isEnabled: boolean;
  maxTokens: number;
  temperature: number;
}

export const AI_PROVIDERS = {
  // Hugging Face (Free tier available)
  huggingface: {
    provider: 'huggingface' as const,
    apiKey: '', // Optional for free tier, required for higher limits
    model: 'microsoft/DialoGPT-large',
    endpoint: 'https://api-inference.huggingface.co/models/',
    isEnabled: true,
    maxTokens: 200,
    temperature: 0.7
  },

  // Groq (Free tier with 6000 tokens/minute)
  groq: {
    provider: 'groq' as const,
    apiKey: '', // Get free API key from https://console.groq.com
    model: 'llama3-8b-8192',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    isEnabled: false, // Enable when you have API key
    maxTokens: 200,
    temperature: 0.7
  },

  // Ollama (Self-hosted, completely free)
  ollama: {
    provider: 'ollama' as const,
    apiKey: '', // Not required
    model: 'llama2',
    endpoint: 'http://localhost:11434/api/generate',
    isEnabled: false, // Enable if you have Ollama running locally
    maxTokens: 200,
    temperature: 0.7
  },

  // Together AI (Free tier available)
  together: {
    provider: 'together' as const,
    apiKey: '', // Get free API key from https://api.together.xyz
    model: 'togethercomputer/llama-2-7b-chat',
    endpoint: 'https://api.together.xyz/inference',
    isEnabled: false, // Enable when you have API key
    maxTokens: 200,
    temperature: 0.7
  },

  // OpenAI (Paid, but included for completeness)
  openai: {
    provider: 'openai' as const,
    apiKey: '', // Your OpenAI API key
    model: 'gpt-3.5-turbo',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    isEnabled: false, // Enable when you have API key
    maxTokens: 200,
    temperature: 0.7
  }
} as const;

export const AI_CONFIG = {
  // Primary AI provider (will fallback to others if this fails)
  primaryProvider: 'huggingface',
  
  // Fallback order
  fallbackOrder: ['huggingface', 'groq', 'together', 'ollama', 'openai'],
  
  // Request timeout (ms)
  requestTimeout: 10000,
  
  // Enable/disable AI features
  enableAI: true,
  
  // Use enhanced rule-based system if all AI APIs fail
  fallbackToRules: true,

  // Real estate specific prompts
  systemPrompts: {
    propertySearch: `You are a real estate search assistant. Help users find properties based on their criteria including location, price, features, and preferences. Provide specific, actionable advice.`,
    
    investmentAdvice: `You are a real estate investment advisor. Provide analysis on ROI, market trends, cash flow, and investment strategies. Be specific with calculations and market insights.`,
    
    bookingAssistant: `You are a booking and appointment manager for a real estate platform. Help users schedule viewings, manage reservations, and coordinate property visits.`,
    
    supportAgent: `You are a customer support agent for a real estate platform. Help users with technical issues, account problems, payment questions, and general platform support.`,
    
    generalAssistant: `You are a comprehensive real estate AI assistant. You help with property search, investment advice, booking management, market analysis, and general real estate questions. Be helpful, professional, and provide detailed, actionable responses.`
  }
};

// Helper function to get enabled AI providers
export function getEnabledAIProviders(): AIConfig[] {
  return Object.values(AI_PROVIDERS).filter(provider => provider.isEnabled);
}

// Helper function to get provider by name
export function getAIProvider(name: keyof typeof AI_PROVIDERS): AIConfig | null {
  return AI_PROVIDERS[name] || null;
}

// Instructions for setting up free AI APIs
export const AI_SETUP_INSTRUCTIONS = {
  huggingface: {
    title: "Hugging Face (Recommended - Free)",
    steps: [
      "1. Visit https://huggingface.co/join",
      "2. Create a free account",
      "3. Go to https://huggingface.co/settings/tokens",
      "4. Create a new token (optional for free tier)",
      "5. Add token to AI_PROVIDERS.huggingface.apiKey if desired"
    ],
    features: "Free tier available, large model selection, good for conversations"
  },

  groq: {
    title: "Groq (Fast & Free)",
    steps: [
      "1. Visit https://console.groq.com",
      "2. Sign up for a free account",
      "3. Generate an API key",
      "4. Add key to AI_PROVIDERS.groq.apiKey",
      "5. Set AI_PROVIDERS.groq.isEnabled = true"
    ],
    features: "Very fast inference, 6000 tokens/minute free, excellent for real-time chat"
  },

  ollama: {
    title: "Ollama (Self-hosted, Completely Free)",
    steps: [
      "1. Download Ollama from https://ollama.ai",
      "2. Install and run: ollama serve",
      "3. Pull a model: ollama pull llama2",
      "4. Set AI_PROVIDERS.ollama.isEnabled = true",
      "5. Runs locally, no API key needed"
    ],
    features: "Completely free, private, runs offline, no API limits"
  },

  together: {
    title: "Together AI (Free Tier)",
    steps: [
      "1. Visit https://api.together.xyz",
      "2. Create an account",
      "3. Get your API key",
      "4. Add key to AI_PROVIDERS.together.apiKey",
      "5. Set AI_PROVIDERS.together.isEnabled = true"
    ],
    features: "Free tier available, multiple model options, good performance"
  }
};
