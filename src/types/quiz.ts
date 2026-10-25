/**
 * Strict TypeScript Domain Definitions for ENDS-MCQ-PORTAL
 */

export type OptionId = 'A' | 'B' | 'C' | 'D';

export interface Option {
  id: OptionId;
  text: string;
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
  correctOptionId: OptionId;
  isCorrect: boolean;
  shuffledOptions: Option[];
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
  performanceTier: PerformanceTier;
}

export interface QuizState {
  viewMode: QuizViewMode;
  questions: Question[];
  currentIndex: number;
  currentShuffledOptions: Option[];
  userAnswers: Record<number, UserAnswer>;
  isAnswerSubmitted: boolean;
  reviewFilter: ReviewFilter;
}

export interface QuizEngine {
  // State
  viewMode: QuizViewMode;
  questions: Question[];
  currentIndex: number;
  currentQuestion: Question | null;
  currentShuffledOptions: Option[];
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
  startQuiz: () => void;
  submitAnswer: (selectedOptionId: OptionId) => boolean;
  nextQuestion: () => boolean;
  finishQuiz: () => void;
  restartQuiz: () => void;
  startReview: (filter?: ReviewFilter) => void;
  setReviewFilter: (filter: ReviewFilter) => void;
  resetToWelcome: () => void;
}
