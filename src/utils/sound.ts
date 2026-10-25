/**
 * Audio Sound Effect Utilities for ENDS-MCQ-PORTAL
 */

export const CORRECT_SOUND = '/sounds/correct/correct-answer.mp3';

export const INCORRECT_SOUNDS = [
  '/sounds/incorrect/incorrect-1.mp3',
  '/sounds/incorrect/incorrect-2.mp3',
  '/sounds/incorrect/incorrect-3.mp3',
  '/sounds/incorrect/incorrect-4.mp3',
  '/sounds/incorrect/incorrect-5.mp3'
] as const;

export type IncorrectSoundPath = typeof INCORRECT_SOUNDS[number];

/**
 * Pure function to select the next incorrect sound.
 * Enforces the no-immediate-repeat rule whenever >= 2 sounds are available.
 * Supports injected randomFn for 100% deterministic testing.
 */
export function selectNextIncorrectSound(
  lastIncorrectSound: string | null,
  soundList: readonly string[] = INCORRECT_SOUNDS,
  randomFn: () => number = Math.random
): string {
  if (soundList.length === 0) {
    return '';
  }
  if (soundList.length === 1) {
    return soundList[0];
  }

  // Filter out the sound used in the previous incorrect event
  const eligible = soundList.filter((sound) => sound !== lastIncorrectSound);
  const candidates = eligible.length > 0 ? eligible : soundList;

  const rawRandom = randomFn();
  const clampedRandom = Math.max(0, Math.min(0.999999, rawRandom));
  const selectedIndex = Math.floor(clampedRandom * candidates.length);

  return candidates[selectedIndex];
}

/**
 * Safe audio player that handles browser audio APIs, volume levels,
 * and promise rejections (e.g. autoplay restrictions) without crashing.
 */
export function playAudioSafely(
  src: string,
  volume = 0.6
): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') {
    return null;
  }

  try {
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, volume));
    const promise = audio.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        // Safe silent handling for browser autoplay/interruption blocks
      });
    }
    return audio;
  } catch {
    return null;
  }
}
