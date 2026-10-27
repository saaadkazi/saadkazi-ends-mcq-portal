/**
 * Strict TypeScript Domain Definitions for ENDS-MCQ-PORTAL
 */

export type OptionId = 'A' | 'B' | 'C' | 'D';

/**
 * Raw option representation from source dataset.
 * `id` is the permanent immutable source identifier.
 */
export interface Option {
  id: OptionId;
  text: string;
}

/**
 * Option with assigned visual display label ('A', 'B', 'C', 'D' from top to bottom).
 */
export interface DisplayOption extends Option {
  displayLabel: OptionId;
}

export interface Question {
  id: number;
  question: string;
  options: Option[];
  correctOptionId: OptionId;
  explanation?: string;
}

export interface UserAnswer {
  questionId: number;
  selectedOptionId: OptionId;
  selectedDisplayLabel: OptionId;
  correctOptionId: OptionId;
  correctDisplayLabel: OptionId;
  isCorrect: boolean;
  shuffledOptions: DisplayOption[];
  timestamp: number;
}

export type QuizViewMode = 'welcome' | 'quiz' | 'result' | 'review';

export type ReviewFilter = 'all' | 'incorrect';

export interface PerformanceTier {
  label: string;
  description: string;
  color: string;
}

export interface QuizStats {
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  scorePercentage: number;
  accuracyPercentage: number;
  performanceTier: PerformanceTier;
}

export interface QuizState {
  viewMode: QuizViewMode;
  questions: Question[];
  currentIndex: number;
  currentShuffledOptions: DisplayOption[];
  userAnswers: Record<number, UserAnswer>;
  isAnswerSubmitted: boolean;
  reviewFilter: ReviewFilter;
}

export type QuestionOrderMode = 'shuffle' | 'original';

export interface QuizEngine {
  // State
  viewMode: QuizViewMode;
  orderMode: QuestionOrderMode;
  questions: Question[];
  currentIndex: number;
  currentQuestion: Question | null;
  currentShuffledOptions: DisplayOption[];
  userAnswers: Record<number, UserAnswer>;
  isAnswerSubmitted: boolean;
  currentAnswer: UserAnswer | null;
  reviewFilter: ReviewFilter;
  
  // Derived Analytics
  stats: QuizStats;
  wrongAnswers: UserAnswer[];
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  
  // Actions
  startQuiz: (customQuestions?: readonly Question[], mode?: QuestionOrderMode) => void;
  startIncorrectPractice: () => void;
  submitAnswer: (selectedOptionId: OptionId) => boolean;
  nextQuestion: () => boolean;
  previousQuestion: () => boolean;
  finishQuiz: () => void;
  restartQuiz: () => void;
  startReview: (filter?: ReviewFilter) => void;
  setReviewFilter: (filter: ReviewFilter) => void;
  resetToWelcome: () => void;
}
