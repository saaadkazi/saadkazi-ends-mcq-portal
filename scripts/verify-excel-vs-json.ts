import * as fs from 'node:fs';
import * as path from 'node:path';
import * as XLSXModule from 'xlsx';
import type { Question } from '../src/types/quiz';
import { calculateQuizStats } from '../src/utils/scoring';
import { createDisplayOptions } from '../src/hooks/useQuizEngine';
import { shuffleArray } from '../src/utils/shuffle';

const XLSX = (XLSXModule as { default?: typeof XLSXModule }).default || XLSXModule;

interface FieldMismatch {
  id: number;
  field: string;
  expected: string;
  actual: string;
}

function runVerification() {
  console.log('====================================================');
  console.log('STARTING END-TO-END EXCEL VS JSON & QUIZ LOGIC AUDIT');
  console.log('====================================================\n');

  const excelPath = path.resolve(
    process.cwd(),
    'EXCEL_SHEET',
    'Entrepreneurship_Development_100_MCQs (1) (1).xlsx'
  );
  const jsonPath = path.resolve(process.cwd(), 'src', 'data', 'questions.json');

  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel file missing at ${excelPath}`);
  }
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file missing at ${jsonPath}`);
  }

  // 1. Read Excel
  const workbook = XLSX.readFile(excelPath, { raw: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: ''
  });

  // Extract Excel data rows
  const excelQuestions: {
    id: number;
    question: string;
    options: Record<'A' | 'B' | 'C' | 'D', string>;
    correctOptionId: 'A' | 'B' | 'C' | 'D';
  }[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const isRowEmpty = row.every((c) => c === undefined || String(c).trim() === '');
    if (isRowEmpty) continue;

    const id = typeof row[0] === 'number' ? row[0] : parseInt(String(row[0]).trim(), 10);
    const question = String(row[1] ?? '').trim();
    const optA = String(row[2] ?? '').trim();
    const optB = String(row[3] ?? '').trim();
    const optC = String(row[4] ?? '').trim();
    const optD = String(row[5] ?? '').trim();
    const correctOptionId = String(row[6] ?? '').trim() as 'A' | 'B' | 'C' | 'D';

    excelQuestions.push({
      id,
      question,
      options: { A: optA, B: optB, C: optC, D: optD },
      correctOptionId
    });
  }

  // 2. Read JSON
  const rawJson = fs.readFileSync(jsonPath, 'utf-8');
  const websiteQuestions: Question[] = JSON.parse(rawJson);

  console.log(`[Counts] Excel Total Rows: ${excelQuestions.length}`);
  console.log(`[Counts] Website JSON Total Records: ${websiteQuestions.length}`);

  const mismatches: FieldMismatch[] = [];
  let matchingQuestionsCount = 0;
  let matchingOptionsCount = 0;
  let matchingAnswersCount = 0;

  const totalRecords = Math.max(excelQuestions.length, websiteQuestions.length);

  for (let i = 0; i < totalRecords; i++) {
    const ex = excelQuestions[i];
    const ws = websiteQuestions[i];

    if (!ex) {
      mismatches.push({
        id: ws.id,
        field: 'Record Existence',
        expected: 'None (Extra record in JSON)',
        actual: `Question ID ${ws.id}`
      });
      continue;
    }

    if (!ws) {
      mismatches.push({
        id: ex.id,
        field: 'Record Existence',
        expected: `Question ID ${ex.id} from Excel`,
        actual: 'Missing in JSON'
      });
      continue;
    }

    // Verify ID
    if (ex.id !== ws.id) {
      mismatches.push({
        id: ex.id,
        field: 'id',
        expected: String(ex.id),
        actual: String(ws.id)
      });
    }

    // Verify Question Text
    if (ex.question === ws.question) {
      matchingQuestionsCount++;
    } else {
      mismatches.push({
        id: ex.id,
        field: 'question text',
        expected: ex.question,
        actual: ws.question
      });
    }

    // Verify Options
    const wsOptMap = new Map(ws.options.map((o) => [o.id, o.text]));
    const optIds: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

    for (const optId of optIds) {
      const exOpt = ex.options[optId];
      const wsOpt = wsOptMap.get(optId) ?? '';
      if (exOpt === wsOpt) {
        matchingOptionsCount++;
      } else {
        mismatches.push({
          id: ex.id,
          field: `Option ${optId}`,
          expected: exOpt,
          actual: wsOpt
        });
      }
    }

    // Verify Correct Answer
    if (ex.correctOptionId === ws.correctOptionId) {
      matchingAnswersCount++;
    } else {
      mismatches.push({
        id: ex.id,
        field: 'correctOptionId',
        expected: ex.correctOptionId,
        actual: ws.correctOptionId
      });
    }
  }

  console.log('\n--- DATA VERIFICATION SUMMARY ---');
  console.log(`Matching Questions: ${matchingQuestionsCount} / ${excelQuestions.length}`);
  console.log(`Matching Options: ${matchingOptionsCount} / ${excelQuestions.length * 4}`);
  console.log(`Matching Answer Keys: ${matchingAnswersCount} / ${excelQuestions.length}`);
  console.log(`Total Mismatches Found: ${mismatches.length}`);

  if (mismatches.length > 0) {
    console.error('\nDETAILED MISMATCHES:');
    mismatches.forEach((m) => {
      console.error(`- Q#${m.id} [${m.field}]:`);
      console.error(`    Expected: "${m.expected}"`);
      console.error(`    Actual:   "${m.actual}"`);
    });
  } else {
    console.log('✓ 100% PERFECT MATCH: All questions, options, and keys match Excel exactly.');
  }

  // 3. Verify Quiz Logic
  console.log('\n--- TESTING QUIZ ANSWER & SCORING LOGIC ---');

  // Test 3.1: All 100 questions accessible
  console.log('1. Checking question accessibility across 100 iterations...');
  const shuffledQuiz = shuffleArray(websiteQuestions);
  if (shuffledQuiz.length !== 100) {
    throw new Error(`Shuffled quiz has length ${shuffledQuiz.length}, expected 100`);
  }
  const seenQIds = new Set(shuffledQuiz.map((q) => q.id));
  if (seenQIds.size !== 100) {
    throw new Error(`Duplicate questions detected in quiz pool (${seenQIds.size}/100 unique)`);
  }
  console.log('  ✓ All 100 questions accessible and unique.');

  // Test 3.2: Shuffled options retain correct-answer mappings
  console.log('2. Testing option shuffling invariance across all 100 questions...');
  let totalDisplayOptionsTested = 0;
  for (const q of websiteQuestions) {
    const displayOpts = createDisplayOptions(q.options);
    if (displayOpts.length !== 4) {
      throw new Error(`Q${q.id} produced ${displayOpts.length} display options, expected 4`);
    }
    const displayLabels = displayOpts.map((o) => o.displayLabel);
    if (displayLabels.join('') !== 'ABCD') {
      throw new Error(`Q${q.id} display labels not ABCD: ${displayLabels.join('')}`);
    }

    // Verify every option matches original permanent text
    const origMap = new Map(q.options.map((o) => [o.id, o.text]));
    for (const dOpt of displayOpts) {
      if (dOpt.text !== origMap.get(dOpt.id)) {
        throw new Error(`Q${q.id} option ${dOpt.id} text mismatch after shuffling`);
      }
      totalDisplayOptionsTested++;
    }

    // Verify correct option lookup by permanent ID
    const correctDisplayOpt = displayOpts.find((o) => o.id === q.correctOptionId);
    if (!correctDisplayOpt) {
      throw new Error(`Q${q.id} correct option ID ${q.correctOptionId} not found in display options`);
    }
  }
  console.log(`  ✓ ${totalDisplayOptionsTested} display options verified for exact permanent ID preservation.`);

  // Test 3.3: Perfect Score Simulation (100/100)
  console.log('3. Simulating 100% correct answers...');
  const perfectAnswers: Record<number, any> = {};
  for (const q of websiteQuestions) {
    perfectAnswers[q.id] = {
      questionId: q.id,
      selectedOptionId: q.correctOptionId,
      selectedDisplayLabel: 'A',
      correctOptionId: q.correctOptionId,
      correctDisplayLabel: 'A',
      isCorrect: true,
      shuffledOptions: createDisplayOptions(q.options),
      timestamp: Date.now()
    };
  }
  const perfectStats = calculateQuizStats(perfectAnswers, 100);
  if (perfectStats.correctCount !== 100 || perfectStats.scorePercentage !== 100) {
    throw new Error(`Perfect score calculation failed: ${JSON.stringify(perfectStats)}`);
  }
  console.log(`  ✓ 100% score calculation verified (${perfectStats.correctCount}/100, ${perfectStats.scorePercentage}%, tier: ${perfectStats.performanceTier.label}).`);

  // Test 3.4: Zero Score Simulation (0/100)
  console.log('4. Simulating 0% correct answers...');
  const zeroAnswers: Record<number, any> = {};
  for (const q of websiteQuestions) {
    // Pick an intentionally wrong option
    const wrongOptId = q.options.find((o) => o.id !== q.correctOptionId)!.id;
    zeroAnswers[q.id] = {
      questionId: q.id,
      selectedOptionId: wrongOptId,
      selectedDisplayLabel: 'B',
      correctOptionId: q.correctOptionId,
      correctDisplayLabel: 'A',
      isCorrect: false,
      shuffledOptions: createDisplayOptions(q.options),
      timestamp: Date.now()
    };
  }
  const zeroStats = calculateQuizStats(zeroAnswers, 100);
  if (zeroStats.correctCount !== 0 || zeroStats.scorePercentage !== 0) {
    throw new Error(`Zero score calculation failed: ${JSON.stringify(zeroStats)}`);
  }
  console.log(`  ✓ 0% score calculation verified (${zeroStats.correctCount}/100, ${zeroStats.scorePercentage}%, tier: ${zeroStats.performanceTier.label}).`);

  // Test 3.5: Mixed Score Simulation (e.g. 73 correct, 27 incorrect)
  console.log('5. Simulating mixed answers (73 correct, 27 incorrect)...');
  const mixedAnswers: Record<number, any> = {};
  for (let idx = 0; idx < websiteQuestions.length; idx++) {
    const q = websiteQuestions[idx];
    const isCorrect = idx < 73;
    const selectedId = isCorrect ? q.correctOptionId : q.options.find((o) => o.id !== q.correctOptionId)!.id;
    mixedAnswers[q.id] = {
      questionId: q.id,
      selectedOptionId: selectedId,
      selectedDisplayLabel: 'C',
      correctOptionId: q.correctOptionId,
      correctDisplayLabel: 'C',
      isCorrect,
      shuffledOptions: createDisplayOptions(q.options),
      timestamp: Date.now()
    };
  }
  const mixedStats = calculateQuizStats(mixedAnswers, 100);
  if (mixedStats.correctCount !== 73 || mixedStats.scorePercentage !== 73 || mixedStats.incorrectCount !== 27) {
    throw new Error(`Mixed score calculation failed: ${JSON.stringify(mixedStats)}`);
  }
  console.log(`  ✓ Mixed score calculation verified (${mixedStats.correctCount}/100, ${mixedStats.scorePercentage}%, tier: ${mixedStats.performanceTier.label}).`);

  console.log('\n====================================================');
  console.log('END-TO-END VERIFICATION COMPLETED SUCCESSFULLY!');
  console.log('====================================================\n');

  if (mismatches.length > 0) {
    process.exit(1);
  }
}

runVerification();
