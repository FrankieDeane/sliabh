import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { WebLLMProvider } from './WebLLMProvider';

export type WebLLMStatus =
  | 'idle'       // not started
  | 'loading'    // downloading / compiling model
  | 'ready'      // model loaded, ready to chat
  | 'unsupported' // WebGPU not available
  | 'error';     // load failed

export function useWebLLM() {
  const [status, setStatus] = useState<WebLLMStatus>(() => {
    if (Platform.OS !== 'web') return 'unsupported';
    return WebLLMProvider.isWebGPUSupported() ? 'idle' : 'unsupported';
  });
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const providerRef = useRef<WebLLMProvider | null>(null);

  const load = useCallback(async () => {
    if (status === 'loading' || status === 'ready' || status === 'unsupported') return;
    setStatus('loading');
    setProgress(0);
    try {
      const provider = new WebLLMProvider();
      providerRef.current = provider;
      await provider.load((rpt) => {
        setProgress(Math.round(rpt.progress * 100));
        setProgressText(rpt.text ?? '');
      });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [status]);

  return { status, progress, progressText, provider: providerRef.current, load };
}
