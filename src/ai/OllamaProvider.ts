import axios from 'axios';
import type { AIMessage, AIProvider, AIResponse } from './AIService';

const DEFAULT_BASE_URL = 'http://10.0.2.2:11434'; // Android emulator → host
const DEFAULT_MODEL = 'gemma2:2b';

interface OllamaConfig {
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.model = config.model ?? DEFAULT_MODEL;
    this.timeoutMs = config.timeoutMs ?? 60_000;
  }

  async generate(messages: AIMessage[]): Promise<AIResponse> {
    const prompt = this.messagesToPrompt(messages);

    const res = await axios.post(
      `${this.baseUrl}/api/generate`,
      { model: this.model, prompt, stream: false },
      { timeout: this.timeoutMs },
    );

    return { text: res.data.response as string };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`, { timeout: 3_000 });
      return true;
    } catch {
      return false;
    }
  }

  private messagesToPrompt(messages: AIMessage[]): string {
    return messages
      .map((m) => {
        if (m.role === 'system') return `[SYSTEM]\n${m.content}`;
        if (m.role === 'user') return `User: ${m.content}`;
        return `Assistant: ${m.content}`;
      })
      .join('\n\n');
  }
}
