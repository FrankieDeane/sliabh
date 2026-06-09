/**
 * Wraps a primary provider (Ollama) and falls back to KnowledgeProvider
 * when the primary is unreachable. This ensures hikers always get answers,
 * even with zero connectivity and no Ollama running.
 */
import type { AIMessage, AIProvider, AIResponse } from './AIService';
import { KnowledgeProvider } from './KnowledgeProvider';

const knowledgeFallback = new KnowledgeProvider();

export class FallbackProvider implements AIProvider {
  constructor(private primary: AIProvider) {}

  async generate(
    messages: AIMessage[],
    onToken?: (chunk: string, done: boolean) => void,
  ): Promise<AIResponse> {
    try {
      const available = await this.primary.isAvailable();
      if (available) {
        return await this.primary.generate(messages, onToken);
      }
    } catch {
      // primary failed — fall through to knowledge base
    }
    return knowledgeFallback.generate(messages, onToken);
  }

  async isAvailable(): Promise<boolean> {
    // Always available because the knowledge fallback never fails
    return true;
  }

  async isPrimaryAvailable(): Promise<boolean> {
    return this.primary.isAvailable();
  }
}
