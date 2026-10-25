import { useState, useCallback, useMemo } from 'react';
import rawQuestions from '../data/questions.json';
import type {
  DisplayOption,
  Option,
  OptionId,
  Question,
  QuizEngine,
  QuizViewMode,
  ReviewFilter,
  UserAnswer
} from '../types/quiz';
import { calculateQuizStats } from '../utils/scoring';
import { shuffleArray } from '../utils/shuffle';

const DEFAULT_QUESTIONS: readonly Question[] = rawQuestions as Question[];
const DISPLAY_LABELS: readonly OptionId[] = ['A', 'B', 'C', 'D'];

/**
 * Shuffles options for a question and assigns sequential display labels 'A', 'B', 'C', 'D'.
 * Preserves each option's permanent source ID and text.
 */
export function createDisplayOptions(options: readonly Option[]): DisplayOption[] {
  const shuffled = shuffleArray(options);
  return shuffled.map((opt, index) => ({
    ...opt,
    displayLabel: DISPLAY_LABELS[index] ?? 'A'
  }));
}

/**
 * Quiz State Machine Hook
 *
 * Implements strict quiz progression, answer locking, independent option shuffling,
 * sequential visual display labels (A-D), accurate scoring, and review filtering.
 */
export function useQuizEngine(
  initialQuestions: readonly Question[] = DEFAULT_QUESTIONS
): QuizEngine {
  const [viewMode, setViewMode] = useState<QuizViewMode>('welcome');
  const [questions, setQuestions] = useState<Question[]>(() => [...initialQuestions]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentShuffledOptions, setCurrentShuffledOptions] = useState<DisplayOption[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswer>>({});
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');

  // Derived current question
  const currentQuestion = useMemo<Question | null>(() => {
    return questions[currentIndex] ?? null;
  }, [questions, currentIndex]);

  // Derived answer for the active question
  const currentAnswer = useMemo<UserAnswer | null>(() => {
    if (!currentQuestion) return null;
    return userAnswers[currentQuestion.id] ?? null;
  }, [currentQuestion, userAnswers]);

  /**
   * Starts a brand new quiz session with a freshly randomized question order.
   */
  const startQuiz = useCallback(() => {
    const randomized = shuffleArray(initialQuestions);
    setQuestions(randomized);
    setCurrentIndex(0);
    setUserAnswers({});
    setIsAnswerSubmitted(false);
    setViewMode('quiz');

    if (randomized.length > 0) {
      setCurrentShuffledOptions(createDisplayOptions(randomized[0].options));
    } else {
      setCurrentShuffledOptions([]);
    }
  }, [initialQuestions]);

  /**
   * Submits an answer for the current question.
   *
   * CRITICAL RULES ENFORCED:
   * 1. Single-submission answer locking: Cannot submit if already submitted.
   * 2. Cannot change answer after submission.
   * 3. Evaluates correctness strictly via permanent OptionId.
   * 4. Maps and preserves both permanent IDs and visual display labels.
   */
  const submitAnswer = useCallback(
    (selectedOptionId: OptionId): boolean => {
      if (!currentQuestion) {
        return false;
      }

      // Check if already submitted for current question
      if (isAnswerSubmitted || userAnswers[currentQuestion.id]) {
        return false;
      }

      const isCorrect = selectedOptionId === currentQuestion.correctOptionId;

      // Identify the displayed label for user's selection
      const selectedDisplayOpt = currentShuffledOptions.find((o) => o.id === selectedOptionId);
      const selectedDisplayLabel = selectedDisplayOpt?.displayLabel ?? selectedOptionId;

      // Identify the displayed label for the correct answer
      const correctDisplayOpt = currentShuffledOptions.find((o) => o.id === currentQuestion.correctOptionId);
      const correctDisplayLabel = correctDisplayOpt?.displayLabel ?? currentQuestion.correctOptionId;

      const newAnswer: UserAnswer = {
        questionId: currentQuestion.id,
        selectedOptionId,
        selectedDisplayLabel,
        correctOptionId: currentQuestion.correctOptionId,
        correctDisplayLabel,
        isCorrect,
        shuffledOptions: [...currentShuffledOptions],
        timestamp: Date.now()
      };

      setUserAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: newAnswer
      }));

      setIsAnswerSubmitted(true);
      return true;
    },
    [currentQuestion, isAnswerSubmitted, userAnswers, currentShuffledOptions]
  );

  /**
   * Advances to the next question.
   *
   * CRITICAL RULE ENFORCED:
   * Progression is strictly blocked if current question has not been submitted.
   */
  const nextQuestion = useCallback((): boolean => {
    if (!currentQuestion) {
      return false;
    }

    // Guard: Do not allow progression before submission
    if (!isAnswerSubmitted) {
      return false;
    }

    const nextIndex = currentIndex + 1;

    // If reaching the end, transition to result screen
    if (nextIndex >= questions.length) {
      setViewMode('result');
      return true;
    }

    setCurrentIndex(nextIndex);

    const nextQ = questions[nextIndex];
    const existingAnswer = userAnswers[nextQ.id];

    if (existingAnswer) {
      // Restore previously seen shuffled options and lock state
      setCurrentShuffledOptions(existingAnswer.shuffledOptions);
      setIsAnswerSubmitted(true);
    } else {
      // Shuffle options freshly for the new question and bind sequential display labels
      setCurrentShuffledOptions(createDisplayOptions(nextQ.options));
      setIsAnswerSubmitted(false);
    }

    return true;
  }, [currentQuestion, isAnswerSubmitted, currentIndex, questions, userAnswers]);

  /**
   * Finishes the quiz and transitions to results.
   */
  const finishQuiz = useCallback(() => {
    setViewMode('result');
  }, []);

  /**
   * Restarts the quiz with all answers cleared and a fresh randomized attempt.
   */
  const restartQuiz = useCallback(() => {
    startQuiz();
  }, [startQuiz]);

  /**
   * Initiates review mode.
   */
  const startReview = useCallback((filter: ReviewFilter = 'all') => {
    setReviewFilter(filter);
    setViewMode('review');
  }, []);

  /**
   * Resets all state back to the welcome screen.
   */
  const resetToWelcome = useCallback(() => {
    setViewMode('welcome');
    setCurrentIndex(0);
    setUserAnswers({});
    setIsAnswerSubmitted(false);
    setCurrentShuffledOptions([]);
  }, []);

  // Compute analytics
  const stats = useMemo(() => {
    return calculateQuizStats(userAnswers, questions.length);
  }, [userAnswers, questions.length]);

  const wrongAnswers = useMemo(() => {
    return Object.values(userAnswers).filter((ans) => !ans.isCorrect);
  }, [userAnswers]);

  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  return {
    viewMode,
    questions,
    currentIndex,
    currentQuestion,
    currentShuffledOptions,
    userAnswers,
    isAnswerSubmitted,
    currentAnswer,
    reviewFilter,
    stats,
    wrongAnswers,
    isFirstQuestion,
    isLastQuestion,
    startQuiz,
    submitAnswer,
    nextQuestion,
    finishQuiz,
    restartQuiz,
    startReview,
    setReviewFilter,
    resetToWelcome
  };
}
