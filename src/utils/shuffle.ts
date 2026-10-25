/**
 * Pure Fisher-Yates (Knuth) Array Shuffler
 *
 * Guarantees uniform random distribution without mutating the original input array.
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
  if (!array || array.length <= 1) {
    return array ? [...array] : [];
  }

  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }

  return copy;
}
