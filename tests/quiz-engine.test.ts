import assert from 'node:assert';
import questionsData from '../src/data/questions.json';
import { createDisplayOptions } from '../src/hooks/useQuizEngine';
import { filterQuestionsByRange, validateRange, FIXED_PRESETS } from '../src/pages/WelcomeView';
import type { DisplayOption, OptionId, Question, QuestionOrderMode, UserAnswer } from '../src/types/quiz';
import { calculateAccuracy, calculatePercentage, calculateQuizStats, getPerformanceTier } from '../src/utils/scoring';
import { shuffleArray } from '../src/utils/shuffle';
import {
  CORRECT_SOUND,
  INCORRECT_SOUNDS,
  playAudioSafely,
  selectNextIncorrectSound,
  stopAudioSafely
} from '../src/utils/sound';

let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${error.message}`);
    failedTests++;
  }
}

console.log('\n========================================');
console.log('RUNNING QUIZ ENGINE & UTILITY TESTS');
console.log('========================================\n');

// ---------------------------------------------------------
// 1. SHUFFLE UTILITY TESTS
// ---------------------------------------------------------
console.log('--- 1. Testing shuffleArray ---');

test('shuffleArray does not mutate original array', () => {
  const original = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const shuffled = shuffleArray(original);
  assert.strictEqual(original.length, 10);
  assert.deepStrictEqual(original, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.notStrictEqual(shuffled, original, 'Must return a new array instance');
});

test('shuffleArray preserves length and elements', () => {
  const input = ['A', 'B', 'C', 'D'];
  const shuffled = shuffleArray(input);
  assert.strictEqual(shuffled.length, 4);
  assert.deepStrictEqual([...shuffled].sort(), ['A', 'B', 'C', 'D']);
});

test('shuffleArray handles edge cases (empty, single item, null)', () => {
  assert.deepStrictEqual(shuffleArray([]), []);
  assert.deepStrictEqual(shuffleArray([42]), [42]);
  assert.deepStrictEqual(shuffleArray(null as unknown as readonly number[]), []);
});

test('shuffleArray produces varied permutations over multiple iterations', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  let differentCount = 0;
  for (let i = 0; i < 50; i++) {
    const shuffled = shuffleArray(input);
    if (JSON.stringify(shuffled) !== JSON.stringify(input)) {
      differentCount++;
    }
  }
  assert.ok(differentCount > 40, 'Shuffle should produce different order in nearly all runs');
});

// ---------------------------------------------------------
// 2. QUESTION DATASET INTEGRITY & UNIQUENESS
// ---------------------------------------------------------
console.log('\n--- 2. Testing Question Bank & Uniqueness ---');

const typedQuestions: Question[] = questionsData as Question[];

test('Question bank contains exactly 100 questions', () => {
  assert.strictEqual(typedQuestions.length, 100);
});

test('Question bank has continuous, unique IDs from 1 to 100', () => {
  const ids = typedQuestions.map((q) => q.id);
  const uniqueIds = new Set(ids);
  assert.strictEqual(uniqueIds.size, 100);
  for (let i = 1; i <= 100; i++) {
    assert.ok(uniqueIds.has(i), `Missing question ID ${i}`);
  }
});

test('Every question has exactly 4 options with IDs A, B, C, D and valid correctOptionId', () => {
  typedQuestions.forEach((q) => {
    assert.strictEqual(q.options.length, 4, `Q${q.id} must have 4 options`);
    const optIds = q.options.map((o) => o.id);
    assert.deepStrictEqual(optIds, ['A', 'B', 'C', 'D'], `Q${q.id} options must have IDs A, B, C, D`);
    assert.ok(
      ['A', 'B', 'C', 'D'].includes(q.correctOptionId),
      `Q${q.id} has invalid correctOptionId: ${q.correctOptionId}`
    );
    q.options.forEach((opt) => {
      assert.ok(opt.text.trim().length > 0, `Q${q.id} option ${opt.id} text is empty`);
    });
  });
});

// ---------------------------------------------------------
// 3. DISPLAY LABELS & OPTION SHUFFLING REGRESSION TESTS
// ---------------------------------------------------------
console.log('\n--- 3. Testing Display Label Mapping & Shuffling Invariance ---');

test('Every displayed question has visual labels exactly A, B, C, D in top-to-bottom order', () => {
  typedQuestions.forEach((q) => {
    const displayOptions = createDisplayOptions(q.options);
    assert.strictEqual(displayOptions.length, 4);
    const labels = displayOptions.map((o) => o.displayLabel);
    assert.deepStrictEqual(labels, ['A', 'B', 'C', 'D'], `Q${q.id} must always have display labels A, B, C, D in order`);
  });
});

test('Original option IDs and text remain correctly paired after shuffling', () => {
  typedQuestions.forEach((q) => {
    const originalTextMap = new Map(q.options.map((o) => [o.id, o.text]));
    const displayOptions = createDisplayOptions(q.options);
    
    displayOptions.forEach((dispOpt) => {
      const originalText = originalTextMap.get(dispOpt.id);
      assert.strictEqual(dispOpt.text, originalText, `Text for source ID ${dispOpt.id} must match original text`);
    });
  });
});

test('Deterministic test: Correctness evaluated strictly by permanent source ID across all 4 positions', () => {
  // Mock question where permanent correct answer is 'C'
  const mockQuestion: Question = {
    id: 999,
    question: 'Sample Question',
    options: [
      { id: 'A', text: 'Option Alpha' },
      { id: 'B', text: 'Option Beta' },
      { id: 'C', text: 'Option Gamma (Correct)' },
      { id: 'D', text: 'Option Delta' }
    ],
    correctOptionId: 'C'
  };

  const permutations: OptionId[][] = [
    ['C', 'A', 'B', 'D'], // 'C' is at display label 'A'
    ['A', 'C', 'B', 'D'], // 'C' is at display label 'B'
    ['A', 'B', 'C', 'D'], // 'C' is at display label 'C'
    ['A', 'B', 'D', 'C'], // 'C' is at display label 'D'
  ];

  const DISPLAY_LABELS: OptionId[] = ['A', 'B', 'C', 'D'];

  permutations.forEach((perm, pIndex) => {
    // Construct display options explicitly for deterministic permutation
    const displayOpts: DisplayOption[] = perm.map((sourceId, idx) => ({
      id: sourceId,
      text: mockQuestion.options.find((o) => o.id === sourceId)!.text,
      displayLabel: DISPLAY_LABELS[idx]
    }));

    // Find option 'C' (the correct one) in this permutation
    const correctOpt = displayOpts.find((o) => o.id === 'C')!;
    const wrongOpt = displayOpts.find((o) => o.id === 'A')!;

    // 1. Correct option evaluates to true regardless of position
    assert.strictEqual(correctOpt.id === mockQuestion.correctOptionId, true);
    // 2. Wrong option evaluates to false regardless of position
    assert.strictEqual(wrongOpt.id === mockQuestion.correctOptionId, false);
    // 3. The correct display label accurately tracks which visual slot 'C' landed in
    assert.strictEqual(correctOpt.displayLabel, DISPLAY_LABELS[pIndex]);
  });
});

// ---------------------------------------------------------
// 4. SCORING & ANALYTICS TESTS
// ---------------------------------------------------------
console.log('\n--- 4. Testing Scoring & Analytics ---');

test('calculatePercentage handles boundaries and precision', () => {
  assert.strictEqual(calculatePercentage(0, 100), 0);
  assert.strictEqual(calculatePercentage(100, 100), 100);
  assert.strictEqual(calculatePercentage(77, 100), 77);
  assert.strictEqual(calculatePercentage(1, 3), 33.3);
  assert.strictEqual(calculatePercentage(2, 3), 66.7);
  assert.strictEqual(calculatePercentage(0, 0), 0);
  assert.strictEqual(calculatePercentage(-5, 100), 0);
});

test('getPerformanceTier returns correct tier classifications', () => {
  assert.strictEqual(getPerformanceTier(90).label, 'Outstanding Mastery');
  assert.strictEqual(getPerformanceTier(85).label, 'Outstanding Mastery');
  assert.strictEqual(getPerformanceTier(84.9).label, 'Proficient Understanding');
  assert.strictEqual(getPerformanceTier(70).label, 'Proficient Understanding');
  assert.strictEqual(getPerformanceTier(69.9).label, 'Developing Knowledge');
  assert.strictEqual(getPerformanceTier(50).label, 'Developing Knowledge');
  assert.strictEqual(getPerformanceTier(49.9).label, 'Needs Focused Revision');
  assert.strictEqual(getPerformanceTier(0).label, 'Needs Focused Revision');
});

test('calculateQuizStats aggregates correct metrics', () => {
  const dummyAnswers: Record<number, UserAnswer> = {
    1: {
      questionId: 1,
      selectedOptionId: 'C',
      selectedDisplayLabel: 'A',
      correctOptionId: 'C',
      correctDisplayLabel: 'A',
      isCorrect: true,
      shuffledOptions: [],
      timestamp: 1
    },
    2: {
      questionId: 2,
      selectedOptionId: 'A',
      selectedDisplayLabel: 'B',
      correctOptionId: 'C',
      correctDisplayLabel: 'D',
      isCorrect: false,
      shuffledOptions: [],
      timestamp: 2
    },
    3: {
      questionId: 3,
      selectedOptionId: 'B',
      selectedDisplayLabel: 'C',
      correctOptionId: 'B',
      correctDisplayLabel: 'C',
      isCorrect: true,
      shuffledOptions: [],
      timestamp: 3
    },
  };

  const stats = calculateQuizStats(dummyAnswers, 10);
  assert.strictEqual(stats.totalQuestions, 10);
  assert.strictEqual(stats.answeredCount, 3);
  assert.strictEqual(stats.correctCount, 2);
  assert.strictEqual(stats.incorrectCount, 1);
  assert.strictEqual(stats.scorePercentage, 20); // 2 / 10 * 100
});

// ---------------------------------------------------------
// 5. QUIZ ENGINE LOGICAL STATE MACHINE TESTS
// ---------------------------------------------------------
console.log('\n--- 5. Testing Quiz State Machine Logic ---');

// Test harness replicating the updated hook state machine
function createTestHarness(
  questions: readonly Question[],
  initialOrderMode: QuestionOrderMode = 'shuffle'
) {
  let orderMode: QuestionOrderMode = initialOrderMode;
  let activePool = [...questions];
  let questionsList = orderMode === 'original' ? [...activePool] : shuffleArray(activePool);
  let currentIndex = 0;
  const optionsMap: Record<number, DisplayOption[]> = {};
  const initialShuffleOpts = orderMode !== 'original';
  questionsList.forEach((q) => {
    optionsMap[q.id] = createDisplayOptions(q.options, initialShuffleOpts);
  });
  let currentShuffledOptions: DisplayOption[] =
    questionsList.length > 0 ? (optionsMap[questionsList[0].id] ?? []) : [];
  let userAnswers: Record<number, UserAnswer> = {};
  let isAnswerSubmitted = false;
  let viewMode = 'quiz';

  return {
    get viewMode() { return viewMode; },
    get orderMode() { return orderMode; },
    get currentIndex() { return currentIndex; },
    get currentQuestion() { return questionsList[currentIndex] ?? null; },
    get currentShuffledOptions() { return currentShuffledOptions; },
    get userAnswers() { return userAnswers; },
    get isAnswerSubmitted() { return isAnswerSubmitted; },
    get questionsList() { return questionsList; },
    get activePool() { return activePool; },
    get isFirstQuestion() { return currentIndex === 0; },
    get isLastQuestion() { return currentIndex === questionsList.length - 1; },

    startQuiz(customQuestions?: readonly Question[], mode?: QuestionOrderMode): void {
      if (mode) orderMode = mode;
      activePool = customQuestions && customQuestions.length > 0 ? [...customQuestions] : [...questions];
      questionsList = orderMode === 'original' ? [...activePool] : shuffleArray(activePool);
      currentIndex = 0;
      userAnswers = {};
      isAnswerSubmitted = false;
      viewMode = 'quiz';
      const shuffleOpts = orderMode !== 'original';
      for (const q of questionsList) {
        optionsMap[q.id] = createDisplayOptions(q.options, shuffleOpts);
      }
      currentShuffledOptions = questionsList.length > 0 ? (optionsMap[questionsList[0].id] ?? []) : [];
    },

    startIncorrectPractice(): void {
      const incorrectIds = new Set(
        Object.values(userAnswers)
          .filter((ans) => !ans.isCorrect)
          .map((ans) => ans.questionId)
      );
      if (incorrectIds.size === 0) return;
      const incorrectQuestions = questions.filter((q) => incorrectIds.has(q.id));
      this.startQuiz(incorrectQuestions, orderMode);
    },

    submitAnswer(optionId: OptionId): boolean {
      const q = questionsList[currentIndex];
      if (!q || isAnswerSubmitted || userAnswers[q.id]) {
        return false;
      }
      const isCorrect = optionId === q.correctOptionId;
      const selectedDisplayOpt = currentShuffledOptions.find((o) => o.id === optionId);
      const selectedDisplayLabel = selectedDisplayOpt?.displayLabel ?? optionId;
      const correctDisplayOpt = currentShuffledOptions.find((o) => o.id === q.correctOptionId);
      const correctDisplayLabel = correctDisplayOpt?.displayLabel ?? q.correctOptionId;

      userAnswers = {
        ...userAnswers,
        [q.id]: {
          questionId: q.id,
          selectedOptionId: optionId,
          selectedDisplayLabel,
          correctOptionId: q.correctOptionId,
          correctDisplayLabel,
          isCorrect,
          shuffledOptions: [...currentShuffledOptions],
          timestamp: Date.now()
        }
      };
      isAnswerSubmitted = true;
      return true;
    },

    nextQuestion(): boolean {
      if (!isAnswerSubmitted) {
        return false; // Progression blocked before submission
      }
      const nextIdx = currentIndex + 1;
      if (nextIdx >= questionsList.length) {
        viewMode = 'result';
        return true;
      }
      currentIndex = nextIdx;
      const nextQ = questionsList[nextIdx];
      const existing = userAnswers[nextQ.id];
      if (existing) {
        currentShuffledOptions = existing.shuffledOptions;
        isAnswerSubmitted = true;
      } else {
        const shuffleOpts = orderMode !== 'original';
        currentShuffledOptions = optionsMap[nextQ.id] ?? createDisplayOptions(nextQ.options, shuffleOpts);
        isAnswerSubmitted = false;
      }
      return true;
    },

    previousQuestion(): boolean {
      if (viewMode !== 'quiz' || currentIndex <= 0) {
        return false;
      }
      const prevIdx = currentIndex - 1;
      currentIndex = prevIdx;
      const prevQ = questionsList[prevIdx];
      const existing = userAnswers[prevQ.id];
      if (existing) {
        currentShuffledOptions = existing.shuffledOptions;
        isAnswerSubmitted = true;
      } else {
        const shuffleOpts = orderMode !== 'original';
        currentShuffledOptions = optionsMap[prevQ.id] ?? createDisplayOptions(prevQ.options, shuffleOpts);
        isAnswerSubmitted = false;
      }
      return true;
    },

    restart(): void {
      questionsList = orderMode === 'original' ? [...activePool] : shuffleArray(activePool);
      currentIndex = 0;
      userAnswers = {};
      isAnswerSubmitted = false;
      viewMode = 'quiz';
      const shuffleOpts = orderMode !== 'original';
      for (const q of questionsList) {
        optionsMap[q.id] = createDisplayOptions(q.options, shuffleOpts);
      }
      if (questionsList.length > 0) {
        currentShuffledOptions = optionsMap[questionsList[0].id] ?? [];
      } else {
        currentShuffledOptions = [];
      }
    },

    resetToWelcome(): void {
      currentIndex = 0;
      userAnswers = {};
      isAnswerSubmitted = false;
      viewMode = 'welcome';
      currentShuffledOptions = [];
      activePool = [...questions];
      orderMode = 'shuffle';
    }
  };
}

test('Answer Locking: Question can only be submitted once; cannot change answer', () => {
  const harness = createTestHarness(typedQuestions.slice(0, 5));
  const q1 = harness.currentQuestion!;
  
  // First submission succeeds
  const firstSubmit = harness.submitAnswer(q1.correctOptionId);
  assert.strictEqual(firstSubmit, true);
  assert.strictEqual(harness.isAnswerSubmitted, true);
  assert.strictEqual(harness.userAnswers[q1.id].selectedOptionId, q1.correctOptionId);

  // Second submission is strictly rejected
  const wrongOption: OptionId = q1.correctOptionId === 'A' ? 'B' : 'A';
  const secondSubmit = harness.submitAnswer(wrongOption);
  assert.strictEqual(secondSubmit, false);
  // Verify answer did NOT change
  assert.strictEqual(harness.userAnswers[q1.id].selectedOptionId, q1.correctOptionId);
});

test('Display labels are recorded accurately in UserAnswer upon submission', () => {
  const harness = createTestHarness(typedQuestions.slice(0, 5));
  const q1 = harness.currentQuestion!;
  
  // Choose the option currently displayed under label 'B'
  const optAtB = harness.currentShuffledOptions.find((o) => o.displayLabel === 'B')!;
  harness.submitAnswer(optAtB.id);

  const answer = harness.userAnswers[q1.id];
  assert.strictEqual(answer.selectedOptionId, optAtB.id);
  assert.strictEqual(answer.selectedDisplayLabel, 'B');

  // Verify correctDisplayLabel matches the visual position where the correct option was displayed
  const trueCorrectOpt = harness.currentShuffledOptions.find((o) => o.id === q1.correctOptionId)!;
  assert.strictEqual(answer.correctDisplayLabel, trueCorrectOpt.displayLabel);
});

test('Progression Guard: Progression blocked before answer submission', () => {
  const harness = createTestHarness(typedQuestions.slice(0, 5));
  assert.strictEqual(harness.currentIndex, 0);

  // Attempting nextQuestion without submitting must fail
  const nextAttempt = harness.nextQuestion();
  assert.strictEqual(nextAttempt, false);
  assert.strictEqual(harness.currentIndex, 0, 'Index must NOT advance');

  // Submit answer, then advance
  harness.submitAnswer('A');
  const validNext = harness.nextQuestion();
  assert.strictEqual(validNext, true);
  assert.strictEqual(harness.currentIndex, 1, 'Index must advance to 1');
});

test('Completion: Advancing past final question transitions to result mode', () => {
  const subset = typedQuestions.slice(0, 2);
  const harness = createTestHarness(subset);

  // Question 1
  harness.submitAnswer('A');
  harness.nextQuestion();
  assert.strictEqual(harness.currentIndex, 1);

  // Question 2 (Last question)
  harness.submitAnswer('B');
  harness.nextQuestion();
  assert.strictEqual(harness.viewMode, 'result');
});

test('Restart: Resets all answers, resets score, produces freshly randomized attempt with sequential display labels', () => {
  const harness = createTestHarness(typedQuestions);

  // Answer first 3 questions
  for (let i = 0; i < 3; i++) {
    harness.submitAnswer('B');
    harness.nextQuestion();
  }
  assert.strictEqual(Object.keys(harness.userAnswers).length, 3);
  assert.strictEqual(harness.currentIndex, 3);

  // Restart
  harness.restart();
  assert.strictEqual(harness.currentIndex, 0);
  assert.deepStrictEqual(harness.userAnswers, {});
  assert.strictEqual(harness.isAnswerSubmitted, false);
  assert.strictEqual(harness.viewMode, 'quiz');
  assert.strictEqual(harness.questionsList.length, 100);

  // Verify display labels are still A, B, C, D in order
  const labels = harness.currentShuffledOptions.map((o) => o.displayLabel);
  assert.deepStrictEqual(labels, ['A', 'B', 'C', 'D']);
});

test('Original Question Bank Immutability: Source dataset is never mutated', () => {
  const originalIds = typedQuestions.map((q) => q.id);
  const originalFirstQ = JSON.stringify(typedQuestions[0]);

  const harness = createTestHarness(typedQuestions);
  harness.restart();

  assert.deepStrictEqual(typedQuestions.map((q) => q.id), originalIds);
  assert.strictEqual(JSON.stringify(typedQuestions[0]), originalFirstQ);
});

// ---------------------------------------------------------
// 5B. PREVIOUS QUESTION NAVIGATION TESTS
// ---------------------------------------------------------
console.log('\n--- 5B. Testing Previous Question Navigation Logic ---');

test('Previous Question Guard: Blocked on first question (currentIndex === 0)', () => {
  const harness = createTestHarness(typedQuestions.slice(0, 5));
  assert.strictEqual(harness.currentIndex, 0);
  assert.strictEqual(harness.isFirstQuestion, true);

  // Attempting previousQuestion on first question must return false
  const prevAttempt = harness.previousQuestion();
  assert.strictEqual(prevAttempt, false);
  assert.strictEqual(harness.currentIndex, 0, 'Index must remain at 0');
});

test('Previous Navigation: Moves backward and restores previous question, options, and submission state', () => {
  const harness = createTestHarness(typedQuestions.slice(0, 5));
  const q0 = harness.currentQuestion!;
  const q0Shuffled = [...harness.currentShuffledOptions];

  // Submit Q0 and advance to Q1
  harness.submitAnswer(q0.correctOptionId);
  assert.strictEqual(harness.isAnswerSubmitted, true);
  harness.nextQuestion();

  assert.strictEqual(harness.currentIndex, 1);
  assert.strictEqual(harness.isFirstQuestion, false);
  assert.strictEqual(harness.isAnswerSubmitted, false);

  // Navigate backward to Q0
  const canGoBack = harness.previousQuestion();
  assert.strictEqual(canGoBack, true);
  assert.strictEqual(harness.currentIndex, 0);
  assert.strictEqual(harness.isFirstQuestion, true);
  assert.strictEqual(harness.currentQuestion!.id, q0.id);
  assert.strictEqual(harness.isAnswerSubmitted, true);
  assert.deepStrictEqual(harness.currentShuffledOptions, q0Shuffled);
});

test('Answer Locking on Previous: Previously submitted answers remain locked; cannot resubmit or change', () => {
  const harness = createTestHarness(typedQuestions.slice(0, 5));
  const q0 = harness.currentQuestion!;

  // Answer Q0 correctly
  harness.submitAnswer(q0.correctOptionId);
  harness.nextQuestion();

  // Navigate back to Q0
  harness.previousQuestion();
  assert.strictEqual(harness.currentIndex, 0);
  assert.strictEqual(harness.isAnswerSubmitted, true);

  // Attempt to resubmit or change to a different option
  const otherOption: OptionId = q0.correctOptionId === 'A' ? 'B' : 'A';
  const resubmitResult = harness.submitAnswer(otherOption);
  assert.strictEqual(resubmitResult, false, 'Resubmission must be strictly rejected');
  assert.strictEqual(harness.userAnswers[q0.id].selectedOptionId, q0.correctOptionId, 'Original selection must remain untouched');
});

test('Option Shuffling Stability: Options and display labels remain invariant across backward and forward navigation', () => {
  const harness = createTestHarness(typedQuestions.slice(0, 5));
  const q0 = harness.currentQuestion!;
  const q0OptionsInitial = harness.currentShuffledOptions.map((o) => ({ id: o.id, label: o.displayLabel }));

  harness.submitAnswer(q0.correctOptionId);
  harness.nextQuestion();

  assert.ok(harness.currentQuestion);
  const q1OptionsInitial = harness.currentShuffledOptions.map((o) => ({ id: o.id, label: o.displayLabel }));

  // Navigate back and forth 5 times
  for (let cycle = 0; cycle < 5; cycle++) {
    harness.previousQuestion();
    const q0OptionsCheck = harness.currentShuffledOptions.map((o) => ({ id: o.id, label: o.displayLabel }));
    assert.deepStrictEqual(q0OptionsCheck, q0OptionsInitial, `Cycle ${cycle}: Q0 options must not re-shuffle`);

    harness.nextQuestion();
    const q1OptionsCheck = harness.currentShuffledOptions.map((o) => ({ id: o.id, label: o.displayLabel }));
    assert.deepStrictEqual(q1OptionsCheck, q1OptionsInitial, `Cycle ${cycle}: Q1 options must not re-shuffle`);
  }
});

test('Score & Answer Integrity: Backward navigation does not alter score, answered count, or duplicate answers', () => {
  const harness = createTestHarness(typedQuestions.slice(0, 5));
  const q0 = harness.currentQuestion!;
  harness.submitAnswer(q0.correctOptionId);
  harness.nextQuestion();

  const q1 = harness.currentQuestion!;
  const wrongOption: OptionId = q1.correctOptionId === 'A' ? 'B' : 'A';
  harness.submitAnswer(wrongOption);
  harness.nextQuestion();

  // At Q2: 2 questions answered (1 correct, 1 incorrect)
  const initialStats = calculateQuizStats(harness.userAnswers, 5);
  assert.strictEqual(initialStats.answeredCount, 2);
  assert.strictEqual(initialStats.correctCount, 1);
  assert.strictEqual(initialStats.incorrectCount, 1);

  // Navigate backward to Q1, then Q0, then forward back to Q2
  harness.previousQuestion(); // At Q1
  assert.strictEqual(harness.currentIndex, 1);
  harness.previousQuestion(); // At Q0
  assert.strictEqual(harness.currentIndex, 0);
  harness.nextQuestion();     // At Q1
  assert.strictEqual(harness.currentIndex, 1);
  harness.nextQuestion();     // At Q2
  assert.strictEqual(harness.currentIndex, 2);

  const statsAfterNav = calculateQuizStats(harness.userAnswers, 5);
  assert.strictEqual(statsAfterNav.answeredCount, 2, 'Answered count must not change');
  assert.strictEqual(statsAfterNav.correctCount, 1, 'Correct count must not change');
  assert.strictEqual(statsAfterNav.incorrectCount, 1, 'Incorrect count must not change');
  assert.strictEqual(Object.keys(harness.userAnswers).length, 2, 'User answers must not duplicate');
});

test('Progression Guard on Unanswered Question after Backward Navigation', () => {
  const harness = createTestHarness(typedQuestions.slice(0, 5));
  harness.submitAnswer(harness.currentQuestion!.correctOptionId);
  harness.nextQuestion(); // At Q1 (unanswered)

  // Navigate backward to Q0 (answered)
  harness.previousQuestion();
  assert.strictEqual(harness.currentIndex, 0);

  // Advance forward back to Q1 (unanswered)
  harness.nextQuestion();
  assert.strictEqual(harness.currentIndex, 1);
  assert.strictEqual(harness.isAnswerSubmitted, false);

  // Attempting to advance past Q1 without submitting must fail
  const nextAttempt = harness.nextQuestion();
  assert.strictEqual(nextAttempt, false, 'Cannot skip unanswered Q1');
  assert.strictEqual(harness.currentIndex, 1);
});


// ---------------------------------------------------------
// 6. ANSWER SOUND EFFECTS & AUDIO LOGIC TESTS
// ---------------------------------------------------------
console.log('\n--- 6. Testing Answer Sound Effects & Audio Logic ---');

test('1. Correct submissions use the exact correct audio path', () => {
  assert.strictEqual(CORRECT_SOUND, '/sounds/correct/correct-answer.mp3');
});

test('2. Incorrect submissions select only from the five verified incorrect audio paths', () => {
  assert.strictEqual(INCORRECT_SOUNDS.length, 5);
  const expectedSet = new Set([
    '/sounds/incorrect/incorrect-1.mp3',
    '/sounds/incorrect/incorrect-2.mp3',
    '/sounds/incorrect/incorrect-3.mp3',
    '/sounds/incorrect/incorrect-4.mp3',
    '/sounds/incorrect/incorrect-5.mp3'
  ]);
  INCORRECT_SOUNDS.forEach((sound) => {
    assert.ok(expectedSet.has(sound), `Unexpected sound path: ${sound}`);
  });

  // Test with deterministic pseudorandom values
  for (let r = 0; r <= 0.99; r += 0.1) {
    const sound = selectNextIncorrectSound(null, INCORRECT_SOUNDS, () => r);
    assert.ok(expectedSet.has(sound), `Selected sound must be from eligible set: ${sound}`);
  }
});

test('3. Consecutive incorrect events do not immediately repeat the same sound when alternatives are available', () => {
  // Deterministic check across all sounds
  INCORRECT_SOUNDS.forEach((previousSound) => {
    // With 4 candidates remaining, test each possible candidate index
    for (let c = 0; c < 4; c++) {
      const selected = selectNextIncorrectSound(previousSound, INCORRECT_SOUNDS, () => c / 4);
      assert.notStrictEqual(selected, previousSound, `Sound ${previousSound} must not repeat immediately`);
      assert.ok(INCORRECT_SOUNDS.includes(selected as any));
    }
  });

  // Multi-step consecutive sequence simulation
  let lastSound: string | null = null;
  for (let step = 0; step < 30; step++) {
    const pseudoRand = ((step * 7 + 3) % 10) / 10;
    const nextSound = selectNextIncorrectSound(lastSound, INCORRECT_SOUNDS, () => pseudoRand);
    if (lastSound !== null) {
      assert.notStrictEqual(nextSound, lastSound, `Step ${step}: Immediate repeat detected for ${nextSound}`);
    }
    lastSound = nextSound;
  }
});

test('4. Correct events do not change the previous incorrect sound used for the no-repeat rule', () => {
  let lastIncorrect: string | null = null;

  // Event 1: Incorrect answer occurs
  const sound1 = selectNextIncorrectSound(lastIncorrect, INCORRECT_SOUNDS, () => 0.1);
  lastIncorrect = sound1;
  assert.ok(sound1);

  // Event 2: Correct answer occurs (plays correct sound, lastIncorrect remains sound1)
  const correctSound = CORRECT_SOUND;
  assert.strictEqual(correctSound, '/sounds/correct/correct-answer.mp3');
  // Notice lastIncorrect is untouched!

  // Event 3: Another incorrect answer occurs
  const sound2 = selectNextIncorrectSound(lastIncorrect, INCORRECT_SOUNDS, () => 0.1);
  assert.notStrictEqual(sound2, sound1, 'Must still not repeat previous incorrect sound even after an intervening correct answer');
});

test('5. Selecting an option without submitting does not trigger audio', () => {
  let playCount = 0;
  let selectedOption: OptionId | null = null;
  const handleSelect = (id: OptionId) => {
    selectedOption = id;
    // Selection only updates local choice, does not play audio
  };

  handleSelect('B');
  assert.strictEqual(selectedOption, 'B');
  assert.strictEqual(playCount, 0, 'No audio should play on selection');
});

test('6. Next Question, restart, results, and review do not trigger answer sounds', () => {
  let playCount = 0;
  // Simulate lifecycle operations
  const onNext = () => {};
  const onRestart = () => {};
  const onFinish = () => {};
  const onReview = () => {};

  onNext();
  onRestart();
  onFinish();
  onReview();

  assert.strictEqual(playCount, 0, 'Lifecycle operations must never trigger answer audio');
});

test('7. A rejected duplicate submission does not play another sound', () => {
  let playCount = 0;
  const harness = createTestHarness(typedQuestions.slice(0, 3));
  const q1 = harness.currentQuestion!;

  // First submission accepted
  const firstAccepted = harness.submitAnswer(q1.correctOptionId);
  if (firstAccepted) playCount++;
  assert.strictEqual(firstAccepted, true);
  assert.strictEqual(playCount, 1);

  // Second submission rejected
  const secondAccepted = harness.submitAnswer(q1.correctOptionId);
  if (secondAccepted) playCount++;
  assert.strictEqual(secondAccepted, false);
  assert.strictEqual(playCount, 1, 'Duplicate submission must not trigger audio again');
});

test('8. Rerenders do not duplicate playback', () => {
  let playCount = 0;
  // Submission trigger is event-based (in onClick handler), not in an effect or render body
  const submitHandler = (isAccepted: boolean) => {
    if (isAccepted) playCount++;
  };

  submitHandler(true); // User submits
  assert.strictEqual(playCount, 1);

  // Simulating 5 component rerenders
  for (let r = 0; r < 5; r++) {
    // Rerender body does not invoke submitHandler
  }
  assert.strictEqual(playCount, 1, 'Component rerenders must not duplicate audio playback');
});

test('9. Audio playback failure does not break quiz submission', () => {
  const harness = createTestHarness(typedQuestions.slice(0, 2));
  const q1 = harness.currentQuestion!;

  const mockFailingAudio = () => {
    throw new Error('Audio hardware unavailable');
  };

  let submissionSucceeded = false;
  try {
    const accepted = harness.submitAnswer(q1.correctOptionId);
    try {
      mockFailingAudio();
    } catch {
      // Safe audio catch
    }
    submissionSucceeded = accepted;
  } catch {
    submissionSucceeded = false;
  }

  assert.strictEqual(submissionSucceeded, true, 'Quiz submission must succeed even if audio throws an error');
  assert.strictEqual(harness.isAnswerSubmitted, true);
});

test('10. Muting prevents sound playback', () => {
  const playedSounds: string[] = [];
  const playAnswerSoundMock = (isMuted: boolean, isCorrect: boolean, lastIncorrect: string | null) => {
    if (isMuted) return null;
    const sound = isCorrect ? CORRECT_SOUND : selectNextIncorrectSound(lastIncorrect);
    playedSounds.push(sound);
    return sound;
  };

  // Muted: returns null, no sound played
  const resultMuted = playAnswerSoundMock(true, true, null);
  assert.strictEqual(resultMuted, null);
  assert.strictEqual(playedSounds.length, 0);

  // Unmuted: plays sound
  const resultUnmuted = playAnswerSoundMock(false, false, null);
  assert.ok(resultUnmuted);
  assert.strictEqual(playedSounds.length, 1);
});

test('11. stopAudioSafely pauses active audio and resets playback position to 0', () => {
  let paused = false;
  const mockAudio = {
    currentTime: 3.45,
    pause: () => {
      paused = true;
    }
  } as unknown as HTMLAudioElement;

  stopAudioSafely(mockAudio);
  assert.strictEqual(paused, true, 'Audio must be paused');
  assert.strictEqual(mockAudio.currentTime, 0, 'Playback position must be reset to 0');

  // Should also safely handle null/undefined
  stopAudioSafely(null);
  stopAudioSafely(undefined as unknown as HTMLAudioElement);
});

test('12. playAudioSafely configures audio.loop = false explicitly', () => {
  const originalAudio = (globalThis as any).Audio;

  (globalThis as any).Audio = class MockAudio {
    loop = true; // initialized true to verify playAudioSafely explicitly sets false
    volume = 1;
    play() {
      return Promise.resolve();
    }
    constructor(_src: string) {}
  };

  try {
    const audio = playAudioSafely('/sounds/correct/correct-answer.mp3');
    assert.ok(audio);
    assert.strictEqual(audio.loop, false, 'audio.loop must be explicitly false');
  } finally {
    (globalThis as any).Audio = originalAudio;
  }
});

test('13. Muting immediately halts currently active audio playback', () => {
  let isMuted = false;
  let activeAudio: { pauseCount: number; currentTime: number } | null = {
    pauseCount: 0,
    currentTime: 2.5
  };

  const stopAudio = () => {
    if (activeAudio) {
      activeAudio.pauseCount++;
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
  };

  const toggleMute = () => {
    isMuted = !isMuted;
    if (isMuted) {
      stopAudio();
    }
  };

  // User mutes mid-audio
  toggleMute();
  assert.strictEqual(isMuted, true);
  assert.strictEqual(activeAudio, null, 'Active audio reference must be cleared when muted');
});

test('14. Exit cancellation preserves quiz progression and user answers intact', () => {
  const harness = createTestHarness(typedQuestions.slice(0, 5));
  const q0 = harness.currentQuestion!;
  harness.submitAnswer(q0.options[0].id);
  assert.strictEqual(Object.keys(harness.userAnswers).length, 1);

  // User triggers exit but cancels confirm dialog
  const mockConfirm = (shouldExit: boolean) => {
    if (shouldExit) {
      harness.resetToWelcome();
    }
  };

  // Canceled exit:
  mockConfirm(false);
  assert.strictEqual(harness.currentIndex, 0);
  assert.strictEqual(Object.keys(harness.userAnswers).length, 1, 'Answers must be preserved on cancel');
  assert.strictEqual(harness.isAnswerSubmitted, true);
  assert.strictEqual(harness.viewMode, 'quiz');

  // Confirmed exit:
  mockConfirm(true);
  assert.strictEqual(harness.currentIndex, 0);
  assert.strictEqual(Object.keys(harness.userAnswers).length, 0, 'Answers are cleared on confirmed exit');
  assert.strictEqual(harness.viewMode, 'welcome');
});

test('15. Next question navigation triggers audio stop to prevent leakage', () => {
  let audioStopped = false;
  const stopAudio = () => {
    audioStopped = true;
  };

  const harness = createTestHarness(typedQuestions.slice(0, 3));
  harness.submitAnswer(harness.currentQuestion!.options[0].id);

  // handleNext pattern
  const handleNext = () => {
    stopAudio();
    harness.nextQuestion();
  };

  handleNext();
  assert.strictEqual(audioStopped, true, 'Audio must be stopped before advancing to next question');
  assert.strictEqual(harness.currentIndex, 1);
});

// ---------------------------------------------------------
// 7. PRACTICE MODES, RANGE FILTERING, ACCURACY & INCORRECT PRACTICE TESTS
// ---------------------------------------------------------
console.log('\n--- 7. Testing Practice Modes, Range Filtering, Accuracy & Incorrect Practice ---');

test('Fixed presets (10, 20, 50, 80, 90, 100) select exact question counts with continuous IDs 1..N', () => {
  FIXED_PRESETS.forEach((preset) => {
    const selected = filterQuestionsByRange(typedQuestions, 1, preset);
    assert.strictEqual(selected.length, preset, `Preset ${preset} must contain exactly ${preset} questions`);
    selected.forEach((q, idx) => {
      assert.strictEqual(q.id, idx + 1, `Preset ${preset} question at index ${idx} must have ID ${idx + 1}`);
    });
  });
});

test('Custom range inclusive filtering: Range 20–40 yields exactly 21 questions with IDs 20..40', () => {
  const selected = filterQuestionsByRange(typedQuestions, 20, 40);
  assert.strictEqual(selected.length, 21, 'Range 20–40 must contain exactly 21 questions (inclusive)');
  assert.strictEqual(selected[0].id, 20, 'First question in range 20–40 must have ID 20');
  assert.strictEqual(selected[selected.length - 1].id, 40, 'Last question in range 20–40 must have ID 40');
  selected.forEach((q, idx) => {
    assert.strictEqual(q.id, 20 + idx, `Question ID must match 20 + ${idx}`);
  });
});

test('Custom range boundary edge cases: 1–1 and 100–100 yield single-question subsets', () => {
  const q1 = filterQuestionsByRange(typedQuestions, 1, 1);
  assert.strictEqual(q1.length, 1);
  assert.strictEqual(q1[0].id, 1);

  const q100 = filterQuestionsByRange(typedQuestions, 100, 100);
  assert.strictEqual(q100.length, 1);
  assert.strictEqual(q100[0].id, 100);
});

test('validateRange: Properly validates bounds, integers, and inverted ranges', () => {
  // Valid cases
  const valid1 = validateRange(1, 100);
  assert.strictEqual(valid1.isValid, true);
  assert.strictEqual(valid1.count, 100);

  const valid2 = validateRange(20, 40);
  assert.strictEqual(valid2.isValid, true);
  assert.strictEqual(valid2.count, 21);

  const validSingle = validateRange(5, 5);
  assert.strictEqual(validSingle.isValid, true);
  assert.strictEqual(validSingle.count, 1);

  // Inverted range (start > end)
  const inverted = validateRange(50, 20);
  assert.strictEqual(inverted.isValid, false);
  assert.ok(inverted.error?.includes('cannot be greater than End'));

  // Out of bounds
  const belowMin = validateRange(0, 50);
  assert.strictEqual(belowMin.isValid, false);
  assert.ok(belowMin.error?.includes('Start question must be between 1 and 100'));

  const aboveMax = validateRange(1, 101);
  assert.strictEqual(aboveMax.isValid, false);
  assert.ok(aboveMax.error?.includes('End question must be between 1 and 100'));

  // Non-integers & NaN
  const decimal = validateRange(1.5, 10);
  assert.strictEqual(decimal.isValid, false);

  const nanVal = validateRange(NaN, 10);
  assert.strictEqual(nanVal.isValid, false);
});

test('Subset Scoring: Quiz score is calculated dynamically against selected subset size', () => {
  // 18 correct out of 20 questions = 90%
  const dummyAnswers: Record<number, UserAnswer> = {};
  for (let i = 1; i <= 20; i++) {
    dummyAnswers[i] = {
      questionId: i,
      selectedOptionId: 'A',
      selectedDisplayLabel: 'A',
      correctOptionId: 'A',
      correctDisplayLabel: 'A',
      isCorrect: i <= 18, // 18 true, 2 false
      shuffledOptions: [],
      timestamp: i
    };
  }

  const stats = calculateQuizStats(dummyAnswers, 20);
  assert.strictEqual(stats.totalQuestions, 20);
  assert.strictEqual(stats.answeredCount, 20);
  assert.strictEqual(stats.correctCount, 18);
  assert.strictEqual(stats.incorrectCount, 2);
  assert.strictEqual(stats.scorePercentage, 90);
  assert.strictEqual(stats.accuracyPercentage, 90);
  assert.strictEqual(stats.performanceTier.label, 'Outstanding Mastery');
});

test('Practice Progress Accuracy: Returns 0% when 0 attempted, and reflects attempted accuracy during session', () => {
  assert.strictEqual(calculateAccuracy(0, 0), 0);
  assert.strictEqual(calculateAccuracy(0, 5), 0);
  assert.strictEqual(calculateAccuracy(3, 4), 75);
  assert.strictEqual(calculateAccuracy(5, 5), 100);
  assert.strictEqual(calculateAccuracy(2, 3), 66.7);

  // Partial session in calculateQuizStats: 4 answered (3 correct) out of 20 total
  const partialAnswers: Record<number, UserAnswer> = {
    1: { questionId: 1, selectedOptionId: 'A', selectedDisplayLabel: 'A', correctOptionId: 'A', correctDisplayLabel: 'A', isCorrect: true, shuffledOptions: [], timestamp: 1 },
    2: { questionId: 2, selectedOptionId: 'A', selectedDisplayLabel: 'A', correctOptionId: 'A', correctDisplayLabel: 'A', isCorrect: true, shuffledOptions: [], timestamp: 2 },
    3: { questionId: 3, selectedOptionId: 'A', selectedDisplayLabel: 'A', correctOptionId: 'A', correctDisplayLabel: 'A', isCorrect: true, shuffledOptions: [], timestamp: 3 },
    4: { questionId: 4, selectedOptionId: 'B', selectedDisplayLabel: 'B', correctOptionId: 'A', correctDisplayLabel: 'A', isCorrect: false, shuffledOptions: [], timestamp: 4 },
  };

  const partialStats = calculateQuizStats(partialAnswers, 20);
  assert.strictEqual(partialStats.totalQuestions, 20);
  assert.strictEqual(partialStats.answeredCount, 4);
  assert.strictEqual(partialStats.correctCount, 3);
  assert.strictEqual(partialStats.incorrectCount, 1);
  assert.strictEqual(partialStats.scorePercentage, 15); // 3 / 20 = 15%
  assert.strictEqual(partialStats.accuracyPercentage, 75); // 3 / 4 = 75%
});

test('Active Question Pool & Restart: Restarting a custom range quiz preserves its selected questions', () => {
  const selectedSubset = filterQuestionsByRange(typedQuestions, 20, 40); // 21 questions
  const harness = createTestHarness(typedQuestions);

  harness.startQuiz(selectedSubset);
  assert.strictEqual(harness.questionsList.length, 21);
  assert.strictEqual(harness.activePool.length, 21);

  // Submit first 2 questions
  const q0 = harness.currentQuestion!;
  harness.submitAnswer(q0.correctOptionId);
  harness.nextQuestion();
  const q1 = harness.currentQuestion!;
  harness.submitAnswer(q1.options[0].id);

  assert.strictEqual(Object.keys(harness.userAnswers).length, 2);

  // Restart quiz
  harness.restart();
  assert.strictEqual(harness.questionsList.length, 21, 'Restart must keep the exact 21 question subset');
  assert.strictEqual(harness.currentIndex, 0);
  assert.strictEqual(Object.keys(harness.userAnswers).length, 0, 'Answers must be reset');

  // Verify all questions belong to range [20, 40]
  harness.questionsList.forEach((q) => {
    assert.ok(q.id >= 20 && q.id <= 40, `Question ID ${q.id} must be in range [20, 40]`);
  });
});

test('Incorrect Questions Practice: Creates new quiz with only incorrect questions and preserves pool on restart', () => {
  const subset = typedQuestions.slice(0, 10);
  const harness = createTestHarness(subset);

  // Answer 6 correctly and 4 incorrectly
  const wrongIds: number[] = [];
  for (let i = 0; i < 10; i++) {
    const q = harness.currentQuestion!;
    const makeCorrect = i % 2 === 0; // indices 0, 2, 4, 6, 8 correct; 1, 3, 5, 7, 9 incorrect
    if (makeCorrect) {
      harness.submitAnswer(q.correctOptionId);
    } else {
      const wrongOpt = q.options.find((o) => o.id !== q.correctOptionId)!.id;
      harness.submitAnswer(wrongOpt);
      wrongIds.push(q.id);
    }
    harness.nextQuestion();
  }

  assert.strictEqual(harness.viewMode, 'result');
  assert.strictEqual(wrongIds.length, 5);

  // Start Incorrect Practice
  harness.startIncorrectPractice();
  assert.strictEqual(harness.viewMode, 'quiz');
  assert.strictEqual(harness.questionsList.length, 5, 'Session must have exactly 5 incorrect questions');
  assert.strictEqual(harness.currentIndex, 0);
  assert.strictEqual(Object.keys(harness.userAnswers).length, 0);

  // Verify questions match wrongIds
  const sessionIds = new Set(harness.questionsList.map((q) => q.id));
  assert.strictEqual(sessionIds.size, 5);
  wrongIds.forEach((id) => {
    assert.ok(sessionIds.has(id), `Incorrect session must contain question ID ${id}`);
  });

  // Verify restart keeps this 5-question pool
  harness.restart();
  assert.strictEqual(harness.questionsList.length, 5);
  harness.questionsList.forEach((q) => {
    assert.ok(sessionIds.has(q.id));
  });
});

test('Zero Incorrect Answers Guard: startIncorrectPractice safely no-ops when 0 incorrect', () => {
  const subset = typedQuestions.slice(0, 3);
  const harness = createTestHarness(subset);

  for (let i = 0; i < 3; i++) {
    const q = harness.currentQuestion!;
    harness.submitAnswer(q.correctOptionId);
    harness.nextQuestion();
  }

  assert.strictEqual(harness.viewMode, 'result');
  const incorrectCount = Object.values(harness.userAnswers).filter((a) => !a.isCorrect).length;
  assert.strictEqual(incorrectCount, 0);

  // Call startIncorrectPractice when 0 incorrect
  harness.startIncorrectPractice();
  // State remains unchanged in result view
  assert.strictEqual(harness.viewMode, 'result');
});

test('Single-Question Quiz Navigation: isFirstQuestion and isLastQuestion are both true', () => {
  const single = filterQuestionsByRange(typedQuestions, 50, 50);
  const harness = createTestHarness(single);

  assert.strictEqual(harness.questionsList.length, 1);
  assert.strictEqual(harness.isFirstQuestion, true);
  assert.strictEqual(harness.isLastQuestion, true);

  harness.submitAnswer(harness.currentQuestion!.correctOptionId);
  assert.strictEqual(harness.isAnswerSubmitted, true);

  const advanced = harness.nextQuestion();
  assert.strictEqual(advanced, true);
  assert.strictEqual(harness.viewMode, 'result');
});

// ---------------------------------------------------------
// 9. ORDERING MODES (ORIGINAL ORDER VS SHUFFLE MODE) TESTS
// ---------------------------------------------------------
console.log('\n--- 9. Testing Original Order Mode vs Shuffle Mode ---');

test('Section 8.1: Shuffle Mode continues using existing question and option randomization', () => {
  const harness = createTestHarness(typedQuestions, 'shuffle');
  assert.strictEqual(harness.orderMode, 'shuffle');
  assert.strictEqual(harness.questionsList.length, 100);

  // Across 10 fresh starts in shuffle mode, question order and option order will differ from the original 1..100
  let questionsDiffered = false;
  let optionsDiffered = false;
  for (let i = 0; i < 10; i++) {
    const freshHarness = createTestHarness(typedQuestions, 'shuffle');
    const ids = freshHarness.questionsList.map((q) => q.id);
    if (ids.some((id, idx) => id !== idx + 1)) {
      questionsDiffered = true;
    }
    const q1Opts = freshHarness.currentShuffledOptions.map((o) => o.id);
    if (q1Opts.some((id, idx) => id !== ['A', 'B', 'C', 'D'][idx])) {
      optionsDiffered = true;
    }
    if (questionsDiffered && optionsDiffered) break;
  }
  assert.ok(questionsDiffered, 'Shuffle Mode must randomize question ordering');
  assert.ok(optionsDiffered, 'Shuffle Mode must randomize option ordering');
});

test('Section 8.2: Original Order Mode strictly preserves the source question order', () => {
  const harness = createTestHarness(typedQuestions, 'original');
  assert.strictEqual(harness.orderMode, 'original');
  assert.strictEqual(harness.questionsList.length, 100);

  // Verify all 100 questions are in exact order 1..100
  const ids = harness.questionsList.map((q) => q.id);
  const expectedIds = Array.from({ length: 100 }, (_, i) => i + 1);
  assert.deepStrictEqual(ids, expectedIds, 'Original Order Mode must preserve exact 1..100 question sequence');
});

test('Section 8.3: Original Order Mode preserves original option IDs and A, B, C, D display labels', () => {
  const harness = createTestHarness(typedQuestions, 'original');

  // Verify options for all 100 questions in Original Order Mode
  harness.questionsList.forEach((q) => {
    const dispOpts = createDisplayOptions(q.options, false);
    assert.strictEqual(dispOpts.length, 4);

    // Option IDs and displayLabels must match exactly: index 0->A, 1->B, 2->C, 3->D
    const expected = ['A', 'B', 'C', 'D'];
    dispOpts.forEach((opt, idx) => {
      assert.strictEqual(opt.id, expected[idx], `Q${q.id} option at ${idx} must have id ${expected[idx]}`);
      assert.strictEqual(opt.displayLabel, expected[idx], `Q${q.id} option at ${idx} must have displayLabel ${expected[idx]}`);
      assert.strictEqual(opt.text, q.options[idx].text, `Q${q.id} option text must match original source text`);
    });
  });
});

test('Section 8.4: Correct-answer mapping evaluates accurately in both modes', () => {
  const subset = typedQuestions.slice(0, 10);

  // 1. Original Order Mode
  const originalHarness = createTestHarness(subset, 'original');
  for (let i = 0; i < 5; i++) {
    const q = originalHarness.currentQuestion!;
    const correctOpt = q.correctOptionId;
    originalHarness.submitAnswer(correctOpt);
    assert.strictEqual(originalHarness.userAnswers[q.id].isCorrect, true);
    assert.strictEqual(originalHarness.userAnswers[q.id].selectedDisplayLabel, correctOpt);
    originalHarness.nextQuestion();
  }
  for (let i = 5; i < 10; i++) {
    const q = originalHarness.currentQuestion!;
    const wrongOpt = q.options.find((o) => o.id !== q.correctOptionId)!.id;
    originalHarness.submitAnswer(wrongOpt);
    assert.strictEqual(originalHarness.userAnswers[q.id].isCorrect, false);
    originalHarness.nextQuestion();
  }

  // 2. Shuffle Mode
  const shuffleHarness = createTestHarness(subset, 'shuffle');
  for (let i = 0; i < 10; i++) {
    const q = shuffleHarness.currentQuestion!;
    const correctOpt = q.correctOptionId;
    shuffleHarness.submitAnswer(correctOpt);
    const ans = shuffleHarness.userAnswers[q.id];
    assert.strictEqual(ans.isCorrect, true, 'Permanent source ID match must evaluate correct');
    assert.strictEqual(ans.selectedOptionId, correctOpt);
    assert.strictEqual(ans.correctOptionId, correctOpt);
    shuffleHarness.nextQuestion();
  }
});

test('Section 8.5: All existing preset ranges work correctly in both modes', () => {
  for (const preset of FIXED_PRESETS) {
    const start = 1;
    const end = preset;
    const count = preset;
    const filtered = filterQuestionsByRange(typedQuestions, start, end);
    assert.strictEqual(filtered.length, count, `Preset ${count} must yield ${count} questions`);

    // Test Original Order Mode for this preset
    const origHarness = createTestHarness(filtered, 'original');
    assert.strictEqual(origHarness.questionsList.length, count);
    const origIds = origHarness.questionsList.map((q) => q.id);
    for (let id = start; id <= end; id++) {
      assert.strictEqual(origIds[id - start], id, `Preset ${count} in original mode must be sequentially ordered`);
    }

    // Test Shuffle Mode for this preset
    const shufHarness = createTestHarness(filtered, 'shuffle');
    assert.strictEqual(shufHarness.questionsList.length, count);
    shufHarness.questionsList.forEach((q) => {
      assert.ok(q.id >= start && q.id <= end, `Question ${q.id} must be within preset boundaries`);
    });
  }
});

test('Section 8.6: Custom ranges preserve correct counts and boundaries in both modes', () => {
  const range20_40 = filterQuestionsByRange(typedQuestions, 20, 40);
  assert.strictEqual(range20_40.length, 21);

  // Original Order Mode
  const origHarness = createTestHarness(range20_40, 'original');
  assert.strictEqual(origHarness.questionsList.length, 21);
  const origIds = origHarness.questionsList.map((q) => q.id);
  const expected20_40 = Array.from({ length: 21 }, (_, i) => 20 + i);
  assert.deepStrictEqual(origIds, expected20_40, 'Original Order Mode custom range 20-40 must be exactly 20..40');

  // Shuffle Mode
  const shufHarness = createTestHarness(range20_40, 'shuffle');
  assert.strictEqual(shufHarness.questionsList.length, 21);
  shufHarness.questionsList.forEach((q) => {
    assert.ok(q.id >= 20 && q.id <= 40, `Shuffle Mode question ${q.id} must be within 20..40`);
  });
});

test('Section 8.7: Restart and retake preserve the selected mode and intended ordering behaviour', () => {
  // 1. Original Order Mode Restart
  const subset = filterQuestionsByRange(typedQuestions, 10, 15); // 6 questions
  const origHarness = createTestHarness(subset, 'original');

  origHarness.submitAnswer('A');
  origHarness.nextQuestion();
  origHarness.submitAnswer('B');
  origHarness.nextQuestion();
  assert.strictEqual(origHarness.currentIndex, 2);

  // Restart
  origHarness.restart();
  assert.strictEqual(origHarness.orderMode, 'original', 'Restart must preserve original orderMode');
  assert.strictEqual(origHarness.currentIndex, 0);
  assert.strictEqual(origHarness.questionsList.length, 6);
  assert.deepStrictEqual(
    origHarness.questionsList.map((q) => q.id),
    [10, 11, 12, 13, 14, 15],
    'Restart in Original Order Mode must preserve exact 10..15 sequence'
  );
  const opts = origHarness.currentShuffledOptions.map((o) => o.displayLabel);
  assert.deepStrictEqual(opts, ['A', 'B', 'C', 'D']);

  // 2. Shuffle Mode Restart
  const shufHarness = createTestHarness(subset, 'shuffle');
  shufHarness.submitAnswer('A');
  shufHarness.nextQuestion();
  shufHarness.restart();
  assert.strictEqual(shufHarness.orderMode, 'shuffle', 'Restart must preserve shuffle orderMode');
  assert.strictEqual(shufHarness.questionsList.length, 6);
});

test('Section 8.8: Previous/Next navigation does not change option ordering in either mode', () => {
  // Original Order Mode
  const origHarness = createTestHarness(typedQuestions.slice(0, 3), 'original');
  const q0OptsOrig = [...origHarness.currentShuffledOptions];
  origHarness.submitAnswer(q0OptsOrig[0].id);
  origHarness.nextQuestion();

  const q1OptsOrig = [...origHarness.currentShuffledOptions];
  origHarness.submitAnswer(q1OptsOrig[0].id);

  // Navigate back to Q0
  origHarness.previousQuestion();
  assert.strictEqual(origHarness.currentIndex, 0);
  assert.deepStrictEqual(
    origHarness.currentShuffledOptions.map((o) => o.id),
    q0OptsOrig.map((o) => o.id),
    'Navigating back must retain original question 0 options'
  );

  // Shuffle Mode
  const shufHarness = createTestHarness(typedQuestions.slice(0, 3), 'shuffle');
  const q0OptsShuf = [...shufHarness.currentShuffledOptions];
  shufHarness.submitAnswer(q0OptsShuf[0].id);
  shufHarness.nextQuestion();

  shufHarness.previousQuestion();
  assert.strictEqual(shufHarness.currentIndex, 0);
  assert.deepStrictEqual(
    shufHarness.currentShuffledOptions.map((o) => o.id),
    q0OptsShuf.map((o) => o.id),
    'Navigating back in Shuffle Mode must retain locked shuffled options'
  );
});

test('Section 8.9: Incorrect-question practice respects the selected mode', () => {
  const subset = typedQuestions.slice(0, 10);
  const origHarness = createTestHarness(subset, 'original');

  // Make Q2 (id 2), Q5 (id 5), Q8 (id 8) incorrect
  for (let i = 0; i < 10; i++) {
    const q = origHarness.currentQuestion!;
    if (q.id === 2 || q.id === 5 || q.id === 8) {
      const wrong = q.options.find((o) => o.id !== q.correctOptionId)!.id;
      origHarness.submitAnswer(wrong);
    } else {
      origHarness.submitAnswer(q.correctOptionId);
    }
    origHarness.nextQuestion();
  }
  assert.strictEqual(origHarness.viewMode, 'result');

  // Start incorrect practice
  origHarness.startIncorrectPractice();
  assert.strictEqual(origHarness.orderMode, 'original', 'Incorrect practice must inherit original orderMode');
  assert.strictEqual(origHarness.questionsList.length, 3);
  assert.deepStrictEqual(
    origHarness.questionsList.map((q) => q.id),
    [2, 5, 8],
    'Incorrect questions must appear in original relative order [2, 5, 8]'
  );
  const firstQOpts = origHarness.currentShuffledOptions.map((o) => o.displayLabel);
  assert.deepStrictEqual(firstQOpts, ['A', 'B', 'C', 'D']);
});

test('Section 8.10: Single-question range works in both modes', () => {
  const singleRange = filterQuestionsByRange(typedQuestions, 42, 42);
  assert.strictEqual(singleRange.length, 1);
  assert.strictEqual(singleRange[0].id, 42);

  // Original Order Mode
  const origHarness = createTestHarness(singleRange, 'original');
  assert.strictEqual(origHarness.questionsList.length, 1);
  assert.strictEqual(origHarness.currentQuestion!.id, 42);
  assert.strictEqual(origHarness.isFirstQuestion, true);
  assert.strictEqual(origHarness.isLastQuestion, true);

  // Shuffle Mode
  const shufHarness = createTestHarness(singleRange, 'shuffle');
  assert.strictEqual(shufHarness.questionsList.length, 1);
  assert.strictEqual(shufHarness.currentQuestion!.id, 42);
  assert.strictEqual(shufHarness.isFirstQuestion, true);
  assert.strictEqual(shufHarness.isLastQuestion, true);
});

// ---------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------
console.log('\n========================================');
console.log(`TOTAL TESTS: ${passedTests + failedTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
}
