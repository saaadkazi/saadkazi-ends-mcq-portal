import { useState, useCallback, useRef, useEffect } from 'react';
import {
  CORRECT_SOUND,
  playAudioSafely,
  selectNextIncorrectSound,
  stopAudioSafely
} from '../utils/sound';

export interface UseAnswerSoundResult {
  isMuted: boolean;
  toggleMute: () => void;
  playAnswerSound: (isCorrect: boolean) => string | null;
  stopAudio: () => void;
  lastIncorrectSound: string | null;
}

const STORAGE_KEY = 'ends_portal_sound_muted';

export function useAnswerSound(): UseAnswerSoundResult {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(STORAGE_KEY) === 'true';
      }
    } catch {
      // Safe fallback
    }
    return false;
  });

  const lastIncorrectRef = useRef<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (activeAudioRef.current) {
      stopAudioSafely(activeAudioRef.current);
      activeAudioRef.current = null;
    }
  }, []);

  // Cleanup active audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      // Immediately stop active audio when muting
      if (next) {
        stopAudio();
      }
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, String(next));
        }
      } catch {
        // Safe fallback
      }
      return next;
    });
  }, [stopAudio]);

  const playAnswerSound = useCallback(
    (isCorrect: boolean): string | null => {
      if (isMuted) {
        return null;
      }

      let soundPath: string;
      if (isCorrect) {
        soundPath = CORRECT_SOUND;
      } else {
        soundPath = selectNextIncorrectSound(lastIncorrectRef.current);
        lastIncorrectRef.current = soundPath;
      }

      // Stop previous audio playback if still playing
      stopAudio();

      activeAudioRef.current = playAudioSafely(soundPath);
      return soundPath;
    },
    [isMuted, stopAudio]
  );

  return {
    isMuted,
    toggleMute,
    playAnswerSound,
    stopAudio,
    get lastIncorrectSound() {
      return lastIncorrectRef.current;
    }
  };
}
