/**
 * Stub for on-device Android inference via MediaPipe LLM Inference API.
 * Replace body with react-native-mediapipe bindings when integrating Gemma weights.
 *
 * Model target: gemma-2b-it-gpu-int4.bin (~1.5GB)
 * Minimum device: Android API 26, GPU with OpenCL or OpenGL ES 3.1
 */
import type { AIMessage, AIProvider, AIResponse } from './AIService';

export class MediaPipeProvider implements AIProvider {
  async generate(
    _messages: AIMessage[],
    _onToken?: (chunk: string, done: boolean) => void,
  ): Promise<AIResponse> {
    throw new Error('MediaPipeProvider not yet implemented. Use OllamaProvider in dev.');
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }
}
