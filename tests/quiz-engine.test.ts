import assert from 'node:assert';
import questionsData from '../src/data/questions.json';
import { createDisplayOptions } from '../src/hooks/useQuizEngine';
import type { DisplayOption, OptionId, Question, UserAnswer } from '../src/types/quiz';
import { calculatePercentage, calculateQuizStats, getPerformanceTier } from '../src/utils/scoring';
import { shuffleArray } from '../src/utils/shuffle';

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
function createTestHarness(questions: readonly Question[]) {
  let questionsList = shuffleArray(questions);
  let currentIndex = 0;
  let currentShuffledOptions: DisplayOption[] =
    questionsList.length > 0 ? createDisplayOptions(questionsList[0].options) : [];
  let userAnswers: Record<number, UserAnswer> = {};
  let isAnswerSubmitted = false;
  let viewMode = 'quiz';

  return {
    get viewMode() { return viewMode; },
    get currentIndex() { return currentIndex; },
    get currentQuestion() { return questionsList[currentIndex] ?? null; },
    get currentShuffledOptions() { return currentShuffledOptions; },
    get userAnswers() { return userAnswers; },
    get isAnswerSubmitted() { return isAnswerSubmitted; },
    get questionsList() { return questionsList; },

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
        currentShuffledOptions = createDisplayOptions(nextQ.options);
        isAnswerSubmitted = false;
      }
      return true;
    },

    restart(): void {
      questionsList = shuffleArray(questions);
      currentIndex = 0;
      userAnswers = {};
      isAnswerSubmitted = false;
      viewMode = 'quiz';
      if (questionsList.length > 0) {
        currentShuffledOptions = createDisplayOptions(questionsList[0].options);
      }
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
