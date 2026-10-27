import type { PerformanceTier, QuizStats, UserAnswer } from '../types/quiz';

/**
 * Calculates percentage with 1 decimal precision, safe against 0 division and clamping to [0, 100].
 */
export function calculatePercentage(correctCount: number, totalQuestions: number): number {
  if (totalQuestions <= 0 || correctCount <= 0) {
    return 0;
  }
  const percentage = (correctCount / totalQuestions) * 100;
  return Math.min(100, Math.round(percentage * 10) / 10);
}

/**
 * Maps percentage score to performance tier, badge label, description, and color.
 */
export function getPerformanceTier(percentage: number): PerformanceTier {
  if (percentage >= 85) {
    return {
      label: 'Outstanding Mastery',
      description: 'Exceptional command of Entrepreneurship Development principles, MSME norms, and business strategies.',
      color: '#10B981' // Emerald
    };
  }
  if (percentage >= 70) {
    return {
      label: 'Proficient Understanding',
      description: 'Strong grasp of core entrepreneurial fundamentals, project feasibility, and financial metrics.',
      color: '#3B82F6' // Blue
    };
  }
  if (percentage >= 50) {
    return {
      label: 'Developing Knowledge',
      description: 'Adequate foundational awareness. Targeted review of institutional schemes and calculations recommended.',
      color: '#F59E0B' // Amber
    };
  }
  return {
    label: 'Needs Focused Revision',
    description: 'Substantial revision needed across entrepreneurial competencies, business models, and statutory regulations.',
    color: '#EF4444' // Rose
  };
}

/**
 * Calculates accuracy percentage based on attempted questions.
 * Returns 0% when answeredCount <= 0.
 */
export function calculateAccuracy(correctCount: number, answeredCount: number): number {
  if (answeredCount <= 0 || correctCount <= 0) {
    return 0;
  }
  return calculatePercentage(correctCount, answeredCount);
}

/**
 * Aggregates complete analytics from user answers.
 */
export function calculateQuizStats(
  userAnswers: Record<number, UserAnswer>,
  totalQuestions: number
): QuizStats {
  const answersList = Object.values(userAnswers);
  const answeredCount = answersList.length;
  const correctCount = answersList.filter((ans) => ans.isCorrect).length;
  const incorrectCount = answeredCount - correctCount;
  const scorePercentage = calculatePercentage(correctCount, totalQuestions);
  const accuracyPercentage = calculateAccuracy(correctCount, answeredCount);
  const performanceTier = getPerformanceTier(scorePercentage);

  return {
    totalQuestions,
    answeredCount,
    correctCount,
    incorrectCount,
    scorePercentage,
    accuracyPercentage,
    performanceTier
  };
}
