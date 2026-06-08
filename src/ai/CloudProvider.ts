import type { AIMessage, AIProvider, AIResponse } from './AIService';

/**
 * Calls the Netlify serverless function which proxies to the Anthropic API.
 * Used automatically on web when the app is deployed to Netlify.
 */
export class CloudProvider implements AIProvider {
  private endpoint: string;

  constructor(endpoint = '/.netlify/functions/chat') {
    this.endpoint = endpoint;
  }

  async generate(
    messages: AIMessage[],
    onToken?: (chunk: string, done: boolean) => void,
  ): Promise<AIResponse> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) {
      let errMsg = `Error ${res.status}`;
      try {
        const body = await res.json();
        errMsg = body.error ?? errMsg;
      } catch { /* ignore parse error */ }
      throw new Error(errMsg);
    }

    const { text } = await res.json() as { text: string };
    onToken?.(text, true);
    return { text };
  }

  async isAvailable(): Promise<boolean> {
    // Assume available on web — errors surface via generate()
    return true;
  }
}
