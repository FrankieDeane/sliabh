export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  text: string;
  tokensUsed?: number;
}

export interface AIProvider {
  generate(
    messages: AIMessage[],
    onToken?: (chunk: string, done: boolean) => void,
  ): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
}

export type AIProviderType = 'ollama' | 'mediapipe';

let _provider: AIProvider | null = null;

export function setAIProvider(provider: AIProvider): void {
  _provider = provider;
}

export async function generate(
  messages: AIMessage[],
  onToken?: (chunk: string, done: boolean) => void,
): Promise<AIResponse> {
  if (!_provider) throw new Error('AI provider not initialized');
  return _provider.generate(messages, onToken);
}

export async function isAIAvailable(): Promise<boolean> {
  if (!_provider) return false;
  return _provider.isAvailable();
}
