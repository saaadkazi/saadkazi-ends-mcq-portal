import * as fs from 'node:fs';
import * as path from 'node:path';
import * as XLSXModule from 'xlsx';

// Universal ESM/CJS interop for SheetJS (xlsx)
const XLSX = (XLSXModule as { default?: typeof XLSXModule }).default || XLSXModule;

export type OptionId = 'A' | 'B' | 'C' | 'D';

export interface RawOption {
  id: OptionId;
  text: string;
}

export interface QuestionRecord {
  id: number;
  question: string;
  options: RawOption[];
  correctOptionId: OptionId;
}

const EXPECTED_HEADERS = [
  'Sr. No.',
  'Question',
  'Option A',
  'Option B',
  'Option C',
  'Option D',
  'Correct Answer'
];

const VALID_OPTION_IDS: OptionId[] = ['A', 'B', 'C', 'D'];

export function convertExcelToQuestions(
  inputPath: string,
  outputPath: string
): QuestionRecord[] {
  console.log(`[Data Pipeline] Reading workbook from: ${inputPath}`);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Workbook not found at: ${inputPath}`);
  }

  const workbook = XLSX.readFile(inputPath, { raw: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('Workbook contains no sheets.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: ''
  });

  if (rows.length < 2) {
    throw new Error(`Insufficient data in sheet "${sheetName}". Total rows: ${rows.length}`);
  }

  // 1. Validate Header
  const headerRow = rows[0].map((h) => String(h ?? '').trim());
  console.log(`[Data Pipeline] Detected headers:`, headerRow);

  for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
    const expected = EXPECTED_HEADERS[i];
    const actual = headerRow[i];
    if (actual !== expected) {
      throw new Error(
        `Header mismatch at column ${i + 1}: expected "${expected}", received "${actual}"`
      );
    }
  }

  const questions: QuestionRecord[] = [];
  const errors: string[] = [];
  const seenIds = new Set<number>();

  // 2. Validate and Convert Rows
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];

    // Skip trailing blank rows if any
    const isRowEmpty = row.every((cell) => cell === undefined || String(cell).trim() === '');
    if (isRowEmpty) {
      continue;
    }

    const rowNumber = rowIndex + 1; // 1-based row number in Excel
    const rawSrNo = row[0];
    const rawQuestion = row[1];
    const rawOptA = row[2];
    const rawOptB = row[3];
    const rawOptC = row[4];
    const rawOptD = row[5];
    const rawAnswer = row[6];

    // Validate Serial Number
    const id = typeof rawSrNo === 'number' ? rawSrNo : parseInt(String(rawSrNo ?? '').trim(), 10);
    if (isNaN(id)) {
      errors.push(`Row ${rowNumber}: Sr. No. is not a valid number ("${rawSrNo}")`);
    } else if (seenIds.has(id)) {
      errors.push(`Row ${rowNumber}: Duplicate Sr. No. ${id}`);
    } else {
      seenIds.add(id);
      const expectedId = questions.length + 1;
      if (id !== expectedId) {
        errors.push(`Row ${rowNumber}: Out-of-order Sr. No. Expected ${expectedId}, received ${id}`);
      }
    }

    // Validate Question
    const questionText = String(rawQuestion ?? '').trim();
    if (!questionText) {
      errors.push(`Row ${rowNumber} (ID ${id}): Question text is empty`);
    }

    // Validate Options
    const optAText = String(rawOptA ?? '').trim();
    const optBText = String(rawOptB ?? '').trim();
    const optCText = String(rawOptC ?? '').trim();
    const optDText = String(rawOptD ?? '').trim();

    if (!optAText) errors.push(`Row ${rowNumber} (ID ${id}): Option A is empty`);
    if (!optBText) errors.push(`Row ${rowNumber} (ID ${id}): Option B is empty`);
    if (!optCText) errors.push(`Row ${rowNumber} (ID ${id}): Option C is empty`);
    if (!optDText) errors.push(`Row ${rowNumber} (ID ${id}): Option D is empty`);

    // Validate Correct Answer
    const answerKey = String(rawAnswer ?? '').trim() as OptionId;
    if (!VALID_OPTION_IDS.includes(answerKey)) {
      errors.push(
        `Row ${rowNumber} (ID ${id}): Invalid Correct Answer key "${answerKey}". Must be one of ['A', 'B', 'C', 'D']`
      );
    }

    questions.push({
      id,
      question: questionText,
      options: [
        { id: 'A', text: optAText },
        { id: 'B', text: optBText },
        { id: 'C', text: optCText },
        { id: 'D', text: optDText }
      ],
      correctOptionId: answerKey
    });
  }

  // 3. Final Count and Validation Check
  if (questions.length !== 100) {
    errors.push(`Expected exactly 100 records, but found ${questions.length}`);
  }

  if (errors.length > 0) {
    console.error(`[Data Pipeline] Conversion failed with ${errors.length} validation errors:`);
    errors.forEach((err) => console.error(` - ${err}`));
    throw new Error(`Data validation failed with ${errors.length} errors.`);
  }

  // 4. Ensure destination folder exists and write JSON
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const jsonString = JSON.stringify(questions, null, 2);
  fs.writeFileSync(outputPath, jsonString, 'utf-8');

  console.log(`[Data Pipeline] SUCCESS: Converted ${questions.length} records.`);
  console.log(`[Data Pipeline] Written to: ${outputPath}`);
  return questions;
}

// Self-invoking execution when called via CLI
const defaultExcelPath = path.resolve(
  process.cwd(),
  'EXCEL_SHEET',
  'Entrepreneurship_Development_100_MCQs (1) (1).xlsx'
);
const defaultOutputPath = path.resolve(process.cwd(), 'src', 'data', 'questions.json');

try {
  convertExcelToQuestions(defaultExcelPath, defaultOutputPath);
} catch (err: unknown) {
  const error = err as Error;
  console.error('[Data Pipeline] Fatal Error:', error.message);
  process.exit(1);
}
