import { useState, useCallback, useMemo } from 'react';
import rawQuestions from '../data/questions.json';
import type {
  DisplayOption,
  Option,
  OptionId,
  Question,
  QuestionOrderMode,
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
 * Creates display options for a question and assigns sequential display labels 'A', 'B', 'C', 'D'.
 * When shouldShuffle is false (Original Order Mode), preserves original source option sequence.
 * Preserves each option's permanent source ID and text.
 */
export function createDisplayOptions(
  options: readonly Option[],
  shouldShuffle: boolean = true
): DisplayOption[] {
  const list = shouldShuffle ? shuffleArray(options) : [...options];
  return list.map((opt, index) => ({
    ...opt,
    displayLabel: DISPLAY_LABELS[index] ?? 'A'
  }));
}

/**
 * Quiz State Machine Hook
 *
 * Implements strict quiz progression, answer locking, selectable ordering modes
 * (Shuffle Mode vs Original Order Mode), sequential visual display labels (A-D),
 * accurate scoring, and review filtering.
 */
export function useQuizEngine(
  initialQuestions: readonly Question[] = DEFAULT_QUESTIONS
): QuizEngine {
  const [viewMode, setViewMode] = useState<QuizViewMode>('welcome');
  const [orderMode, setOrderMode] = useState<QuestionOrderMode>('shuffle');
  const [activePool, setActivePool] = useState<readonly Question[]>(() => [...initialQuestions]);
  const [questions, setQuestions] = useState<Question[]>(() => [...initialQuestions]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentShuffledOptions, setCurrentShuffledOptions] = useState<DisplayOption[]>([]);
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<Record<number, DisplayOption[]>>({});
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
   * Starts a brand new quiz session with the specified or active ordering mode.
   * Can accept an optional custom subset of questions (e.g. range or incorrect set).
   */
  const startQuiz = useCallback(
    (customQuestions?: readonly Question[], mode?: QuestionOrderMode) => {
      const poolToUse =
        customQuestions && customQuestions.length > 0
          ? [...customQuestions]
          : [...initialQuestions];

      const effectiveMode = mode ?? orderMode;
      setOrderMode(effectiveMode);
      setActivePool(poolToUse);

      const orderedQuestions =
        effectiveMode === 'original'
          ? [...poolToUse]
          : shuffleArray(poolToUse);

      setQuestions(orderedQuestions);
      setCurrentIndex(0);
      setUserAnswers({});
      setIsAnswerSubmitted(false);
      setViewMode('quiz');

      const shouldShuffleOpts = effectiveMode !== 'original';
      const optionsMap: Record<number, DisplayOption[]> = {};
      orderedQuestions.forEach((q) => {
        optionsMap[q.id] = createDisplayOptions(q.options, shouldShuffleOpts);
      });
      setShuffledOptionsMap(optionsMap);

      if (orderedQuestions.length > 0) {
        setCurrentShuffledOptions(optionsMap[orderedQuestions[0].id] ?? []);
      } else {
        setCurrentShuffledOptions([]);
      }
    },
    [initialQuestions, orderMode]
  );

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
      // Use the stable options for this question and bind sequential display labels
      const shouldShuffleOpts = orderMode !== 'original';
      const options = shuffledOptionsMap[nextQ.id] ?? createDisplayOptions(nextQ.options, shouldShuffleOpts);
      setCurrentShuffledOptions(options);
      setIsAnswerSubmitted(false);
    }

    return true;
  }, [currentQuestion, isAnswerSubmitted, currentIndex, questions, userAnswers, shuffledOptionsMap, orderMode]);

  /**
   * Navigates to the previous question.
   *
   * CRITICAL RULES ENFORCED:
   * 1. Cannot navigate backward if on or before the first question (currentIndex <= 0).
   * 2. Cannot navigate backward if quiz is not in 'quiz' mode.
   * 3. Restores previously answered question state (options, locked submitted answer).
   * 4. Preserves option shuffling, scoring, and does not replay sounds.
   */
  const previousQuestion = useCallback((): boolean => {
    if (viewMode !== 'quiz' || currentIndex <= 0) {
      return false;
    }

    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);

    const prevQ = questions[prevIndex];
    const existingAnswer = userAnswers[prevQ.id];

    if (existingAnswer) {
      // Restore previously seen shuffled options and lock state
      setCurrentShuffledOptions(existingAnswer.shuffledOptions);
      setIsAnswerSubmitted(true);
    } else {
      const shouldShuffleOpts = orderMode !== 'original';
      const options = shuffledOptionsMap[prevQ.id] ?? createDisplayOptions(prevQ.options, shouldShuffleOpts);
      setCurrentShuffledOptions(options);
      setIsAnswerSubmitted(false);
    }

    return true;
  }, [viewMode, currentIndex, questions, userAnswers, shuffledOptionsMap, orderMode]);

  /**
   * Finishes the quiz and transitions to results.
   */
  const finishQuiz = useCallback(() => {
    setViewMode('result');
  }, []);

  /**
   * Restarts the quiz with all answers cleared.
   * In Original Order Mode, preserves original question sequence and original option order.
   * In Shuffle Mode, produces a freshly randomized attempt.
   */
  const restartQuiz = useCallback(() => {
    const orderedQuestions =
      orderMode === 'original'
        ? [...activePool]
        : shuffleArray(activePool);

    setQuestions(orderedQuestions);
    setCurrentIndex(0);
    setUserAnswers({});
    setIsAnswerSubmitted(false);
    setViewMode('quiz');

    const shouldShuffleOpts = orderMode !== 'original';
    const optionsMap: Record<number, DisplayOption[]> = {};
    orderedQuestions.forEach((q) => {
      optionsMap[q.id] = createDisplayOptions(q.options, shouldShuffleOpts);
    });
    setShuffledOptionsMap(optionsMap);

    if (orderedQuestions.length > 0) {
      setCurrentShuffledOptions(optionsMap[orderedQuestions[0].id] ?? []);
    } else {
      setCurrentShuffledOptions([]);
    }
  }, [activePool, orderMode]);

  /**
   * Starts a brand new practice session targeting only questions answered incorrectly
   * in the completed session, keeping the selected ordering mode intact.
   */
  const startIncorrectPractice = useCallback(() => {
    const incorrectIds = new Set(
      Object.values(userAnswers)
        .filter((ans) => !ans.isCorrect)
        .map((ans) => ans.questionId)
    );

    if (incorrectIds.size === 0) {
      return;
    }

    // Select questions using their original Excel IDs before starting
    const incorrectQuestions = initialQuestions.filter((q) => incorrectIds.has(q.id));
    startQuiz(incorrectQuestions, orderMode);
  }, [userAnswers, initialQuestions, startQuiz, orderMode]);

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
    setShuffledOptionsMap({});
    setActivePool([...initialQuestions]);
    setOrderMode('shuffle');
  }, [initialQuestions]);

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
    orderMode,
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
    startIncorrectPractice,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    finishQuiz,
    restartQuiz,
    startReview,
    setReviewFilter,
    resetToWelcome
  };
}
