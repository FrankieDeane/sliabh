/**
 * Runs an LLM entirely in the browser via WebGPU (MLC web-llm).
 * No server needed — model is cached in IndexedDB after first download.
 * Falls back gracefully when WebGPU is unavailable (Safari/iOS).
 */
import type { AIMessage, AIProvider, AIResponse } from './AIService';

// Llama 3.2 1B is ~700 MB — small enough for mobile data plans
const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';

type ProgressCallback = (report: { progress: number; text: string }) => void;

export class WebLLMProvider implements AIProvider {
  private engine: any = null;
  private loading = false;
  private failed = false;

  static isWebGPUSupported(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  async isAvailable(): Promise<boolean> {
    return WebLLMProvider.isWebGPUSupported();
  }

  async load(onProgress?: ProgressCallback): Promise<void> {
    if (this.engine || this.loading) return;
    if (!WebLLMProvider.isWebGPUSupported()) throw new Error('WebGPU not supported');
    this.loading = true;
    try {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      this.engine = await CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (rpt: { progress: number; text: string }) => {
          onProgress?.(rpt);
        },
      });
    } catch (err) {
      this.failed = true;
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async generate(
    messages: AIMessage[],
    onToken?: (chunk: string, done: boolean) => void,
  ): Promise<AIResponse> {
    if (!this.engine) throw new Error('Model not loaded');

    const chunks = await this.engine.chat.completions.create({
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 512,
    });

    let full = '';
    for await (const chunk of chunks) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        full += delta;
        onToken?.(delta, false);
      }
    }
    onToken?.('', true);
    return { text: full };
  }
}
