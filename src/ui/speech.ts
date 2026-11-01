export interface Speaker {
  /** Es gibt mindestens eine Stimme (nicht nur die API) – sonst bliebe der Knopf stumm. */
  ready: () => boolean;
  speak: (text: string) => void;
  /** Stimmen werden in manchen Browsern erst nachträglich geladen. */
  onVoicesChanged: (listener: () => void) => void;
}

/**
 * Vorlesen über die Web Speech API (de-DE). Unter Linux braucht Firefox dafür einen
 * laufenden speech-dispatcher mit Stimmen; ohne Stimmen bleibt ready() false.
 */
export function createSpeaker(): Speaker {
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  if (synth === null || typeof SpeechSynthesisUtterance === 'undefined') {
    return { ready: () => false, speak: () => undefined, onVoicesChanged: () => undefined };
  }

  const voices = (): SpeechSynthesisVoice[] => synth.getVoices();
  const germanVoice = (): SpeechSynthesisVoice | undefined =>
    voices().find((voice) => voice.lang.toLowerCase().startsWith('de'));

  return {
    ready: () => voices().length > 0,
    speak: (text) => {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;
      const voice = germanVoice();
      if (voice !== undefined) utterance.voice = voice;
      synth.speak(utterance);
    },
    onVoicesChanged: (listener) => {
      synth.addEventListener('voiceschanged', listener);
    },
  };
}
