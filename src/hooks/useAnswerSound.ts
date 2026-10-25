import { useState, useCallback, useRef } from 'react';
import {
  CORRECT_SOUND,
  playAudioSafely,
  selectNextIncorrectSound
} from '../utils/sound';

export interface UseAnswerSoundResult {
  isMuted: boolean;
  toggleMute: () => void;
  playAnswerSound: (isCorrect: boolean) => string | null;
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

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, String(next));
        }
      } catch {
        // Safe fallback
      }
      return next;
    });
  }, []);

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
      if (activeAudioRef.current) {
        try {
          activeAudioRef.current.pause();
          activeAudioRef.current.currentTime = 0;
        } catch {
          // Safe ignore
        }
      }

      activeAudioRef.current = playAudioSafely(soundPath);
      return soundPath;
    },
    [isMuted]
  );

  return {
    isMuted,
    toggleMute,
    playAnswerSound,
    get lastIncorrectSound() {
      return lastIncorrectRef.current;
    }
  };
}
