// src/hooks/useSpeechRecognition.ts
// Browser-native Speech-to-Text hook — Chrome, Edge, Safari (webkit prefix)
import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseSpeechRecognitionOptions {
  onTranscript: (text: string) => void;
  lang?: string;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

/**
 * Returns the SpeechRecognition constructor cross-browser.
 * Uses `window as any` intentionally — avoids augmenting the DOM lib Window
 * interface (which would conflict with lib.dom.d.ts declarations).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSTTConstructor = (): ((new () => any) | null) => {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  // Standard (Chrome 33+, Edge 79+) or webkit-prefixed (older Chrome, Safari)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const useSpeechRecognition = ({
  onTranscript,
  lang = 'en-US',
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Stable ref so startListening closure never goes stale on prop changes
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const isSupported = getSTTConstructor() !== null;

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* already stopped */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const STTCtor = getSTTConstructor();
    if (!STTCtor) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new STTCtor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = Number(event.resultIndex); i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          text += String(event.results[i][0].transcript);
        }
      }
      if (text.trim()) onTranscriptRef.current(text.trim());
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('[STT] Speech recognition error:', String(event.error));
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang]); // onTranscript handled via ref — no stale closure risk

  // Abort active session on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isListening, isSupported, startListening, stopListening };
};
