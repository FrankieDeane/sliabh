import axios from 'axios';
import type { AIMessage, AIProvider, AIResponse } from './AIService';

const DEFAULT_BASE_URL = 'http://10.0.2.2:11434'; // Android emulator → host machine
const DEFAULT_MODEL = 'gemma3:4b';

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
    this.timeoutMs = config.timeoutMs ?? 90_000;
  }

  async generate(
    messages: AIMessage[],
    onToken?: (chunk: string, done: boolean) => void,
  ): Promise<AIResponse> {
    const prompt = this.messagesToPrompt(messages);
    const stream = typeof onToken === 'function';

    const res = await axios.post(
      `${this.baseUrl}/api/generate`,
      { model: this.model, prompt, stream },
      {
        timeout: this.timeoutMs,
        responseType: stream ? 'stream' : 'json',
      },
    );

    if (!stream) {
      return { text: res.data.response as string };
    }

    // Streaming: accumulate NDJSON lines
    return new Promise<AIResponse>((resolve, reject) => {
      let accumulated = '';
      let buffer = '';

      res.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line) as { response: string; done: boolean };
            accumulated += parsed.response;
            onToken!(accumulated, parsed.done);
            if (parsed.done) resolve({ text: accumulated });
          } catch {
            // malformed line — skip
          }
        }
      });

      res.data.on('error', reject);
      res.data.on('end', () => resolve({ text: accumulated }));
    });
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
