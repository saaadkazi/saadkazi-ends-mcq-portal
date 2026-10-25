# Architecture Specification: Entrepreneurship Development MCQ Portal (`ENDS-MCQ-PORTAL`)

## 1. Executive Overview
`ENDS-MCQ-PORTAL` is a lightweight, responsive, client-side web application designed for students and learners to practice 100 Entrepreneurship Development Multiple Choice Questions (MCQs).

The system operates as a zero-backend, zero-database Single Page Application (SPA) deployable seamlessly on static hosts such as Vercel. All question data is statically bundled and processed in-memory during the user session.

---

## 2. Technical Stack
- **Framework**: React 18+ (Functional Components & Hooks)
- **Language**: TypeScript (Strict mode enabled)
- **Bundler & Tooling**: Vite
- **Styling**: Modern Vanilla CSS with CSS Custom Properties (Design Tokens)
- **Data Source**: Static JSON (`src/data/questions.json`) pre-compiled from `EXCEL_SHEET/`
- **Deployment Target**: Vercel (Static Web Build)
- **External Dependencies**: Zero runtime server, authentication, or third-party database APIs.

---

## 3. Directory & Folder Structure

```
ENDS-MCQ-PORTAL/
├── EXCEL_SHEET/
│   └── Entrepreneurship_Development_100_MCQs (1) (1).xlsx   # Immutable raw data source
├── public/
│   ├── favicon.svg                                          # Brand icon
│   └── robots.txt
├── scripts/
│   └── convert-excel.ts                                     # Build-time script to convert & validate Excel to JSON
├── src/
│   ├── assets/                                              # Static icons, illustrations, badges
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx                                   # Styled interactive buttons (primary, secondary, ghost)
│   │   │   ├── Card.tsx                                     # Surface container with elevation/glass styling
│   │   │   ├── ProgressBar.tsx                              # Quiz progress & score ratio indicator
│   │   │   └── Badge.tsx                                    # Status tags (Correct, Incorrect, Category)
│   │   ├── quiz/
│   │   │   ├── QuizHeader.tsx                               # Header displaying progress, score, and active index
│   │   │   ├── QuestionCard.tsx                             # Active question prompt display
│   │   │   ├── OptionList.tsx                               # Grid/list of options
│   │   │   ├── OptionItem.tsx                               # Individual selectable option with stateful feedback styles
│   │   │   └── FeedbackCard.tsx                             # Instant feedback box (correctness indicator + explanation)
│   │   └── review/
│   │       ├── ReviewCard.tsx                               # Detailed view of an answered question
│   │       └── ReviewFilter.tsx                             # Filter buttons (All Questions vs. Incorrect Only)
│   ├── data/
│   │   └── questions.json                                   # Generated static dataset (100 verified records)
│   ├── hooks/
│   │   └── useQuizEngine.ts                                 # State machine for quiz progression, shuffle, & locking
│   ├── pages/
│   │   ├── WelcomeView.tsx                                  # Quiz introduction, instructions, and start trigger
│   │   ├── QuizView.tsx                                     # Main question-and-answer interactive view
│   │   ├── ResultView.tsx                                   # Final score card, performance analytics, and actions
│   │   └── ReviewView.tsx                                   # Comprehensive review of answered questions
│   ├── styles/
│   │   ├── tokens.css                                       # Color palette, spacing, typography, shadow variables
│   │   └── index.css                                        # Global CSS reset, base styles, and utility classes
│   ├── types/
│   │   └── quiz.ts                                          # TypeScript domain definitions
│   ├── utils/
│   │   ├── shuffle.ts                                       # Pure Fisher-Yates array shuffling algorithm
│   │   └── scoring.ts                                       # Score calculations, percentages, and grade tiers
│   ├── App.tsx                                              # Root layout & view routing controller
│   └── main.tsx                                             # Application entry point
├── ARCHITECTURE.md                                          # Architectural blueprint (this document)
├── index.html                                               # Vite HTML entry point
├── package.json                                             # Dependency manifests and scripts
├── tsconfig.json                                            # TypeScript root configuration
├── tsconfig.node.json                                       # Node tooling TypeScript configuration
└── vite.config.ts                                           # Vite build configuration
```

---

## 4. Module Responsibilities & System Boundaries

| Module / Layer | Path | Core Responsibility | Boundaries & Rules |
| :--- | :--- | :--- | :--- |
| **Raw Excel Source** | `EXCEL_SHEET/` | Source of truth containing raw questions. | Read-only. Never modified by frontend code. |
| **Data Ingestion** | `scripts/convert-excel.ts` | Audits, normalizes, and validates records from Excel into `questions.json`. | Runs only during build/dev maintenance. Never bundled into client build. |
| **Static Dataset** | `src/data/questions.json` | 100 structured question records. | Static JSON asset. Read-only at runtime. |
| **Domain Types** | `src/types/quiz.ts` | Interfaces for `Question`, `Option`, `UserAnswer`, `QuizState`, `QuizConfig`. | Shared contract across hooks, pages, and components. Pure types, zero runtime code. |
| **Quiz Logic Hook** | `src/hooks/useQuizEngine.ts` | Manages quiz state, question sequencing, answer locking, instant feedback, scoring, and review filtering. | Pure business logic. Completely decoupled from UI rendering and CSS classes. |
| **Pure Utilities** | `src/utils/` | Algorithmic logic (`shuffleArray`, score percentage computations). | Pure deterministic functions. Zero side-effects and zero component dependencies. |
| **Reusable UI** | `src/components/common/` | Atomic presentation components (buttons, badges, progress bar, containers). | Generic, theme-aware, reusable across any view. |
| **Domain Components**| `src/components/quiz/`, `review/` | Composed UI blocks for questions, options, and review items. | Controlled components driven strictly by props and callbacks. |
| **Views / Screens** | `src/pages/` | Screen-level composition (`Welcome`, `Quiz`, `Result`, `Review`). | Binds `useQuizEngine` state and handlers to UI components. |
| **Styling System** | `src/styles/` | Global CSS custom properties (design tokens) and responsive layouts. | Pure CSS. Avoids heavy CSS-in-JS runtimes or external CSS framework overhead. |

---

## 5. Data Schema & Stable Option Identifiers

A primary pitfall in randomized quiz systems is answer misalignment when options are shuffled. To guarantee **100% data integrity**, the architecture employs **Stable Option Identifiers**.

### 5.1 Question & Option Schema (`src/types/quiz.ts`)

```typescript
export type OptionId = 'A' | 'B' | 'C' | 'D';

export interface Option {
  id: OptionId;     // Immutable identifier tied to this specific option text
  text: string;     // Option text description
}

export interface Question {
  id: number;                   // Unique question index (1 to 100)
  question: string;             // Question statement
  options: Option[];            // Array of 4 options
  correctOptionId: OptionId;    // Points to the immutable OptionId that is correct
  explanation?: string;         // Pedagogical explanation for review
}

export interface UserAnswer {
  questionId: number;
  selectedOptionId: OptionId;
  correctOptionId: OptionId;
  isCorrect: boolean;
  shuffledOptions: Option[];    // Stored to maintain identical display order in review mode
}

export type QuizViewMode = 'welcome' | 'quiz' | 'result' | 'review';

export interface QuizState {
  viewMode: QuizViewMode;
  questions: Question[];              // Randomized question sequence for current session
  currentIndex: number;               // 0 to questions.length - 1
  userAnswers: Record<number, UserAnswer>; // Keyed by questionId
  isAnswerSubmitted: boolean;         // Locked status for current question
  currentShuffledOptions: Option[];   // Shuffled options for the active question
}
```

### 5.2 Option Shuffling & Invariant Answer Mapping
1. **Raw Ingestion**: Each question defines options with fixed IDs (`A`, `B`, `C`, `D`) and specifies `correctOptionId` pointing to the true answer ID.
2. **Session Initialization**:
   - The question bank array is randomized using Fisher-Yates shuffle.
3. **Question Display**:
   - When question $i$ is loaded, its `options` array is cloned and shuffled using Fisher-Yates:
     $$\text{shuffledOptions} = \text{shuffleArray}([...question.options])$$
   - The UI displays options in the shuffled sequence.
4. **Submission & Lock**:
   - When the user selects an option, the component transmits the option's immutable `id` (e.g. `'C'`), **not** its visual index ($0, 1, 2, 3$).
   - Verification is evaluated strictly by ID equality:
     $$\text{isCorrect} = (\text{selectedOptionId} === \text{question.correctOptionId})$$
   - Once submitted, `isAnswerSubmitted` is set to `true`, instantly locking the radio/button inputs from further modification.
   - Immediate visual feedback highlights:
     - The selected option (green if correct, red if incorrect).
     - The true correct option (highlighted green if user chose incorrectly).
     - Explanation banner below the question.

---

## 6. Core Data-Flow & State Lifecycle

```mermaid
stateDiagram-v2
    [*] --> WelcomeView: User loads application
    
    WelcomeView --> QuizView: Click "Start Quiz" (Initialize session, shuffle 100 questions)
    
    state QuizView {
        [*] --> QuestionDisplay: Load question at currentIndex & shuffle options
        QuestionDisplay --> AnswerLocked: User selects option (Locks input, evaluates isCorrect)
        AnswerLocked --> FeedbackDisplay: Reveal correct/incorrect styling + explanation
        FeedbackDisplay --> QuestionDisplay: Click "Next Question" (currentIndex++)
        FeedbackDisplay --> [*]: Click "Finish Quiz" (currentIndex === questions.length - 1)
    }

    QuizView --> ResultView: All questions completed (or user finishes)
    
    state ResultView {
        [*] --> SummaryDisplay: Display final score, percentage, badge
        SummaryDisplay --> QuizView: "Retake Quiz" (Reset state, re-shuffle questions)
        SummaryDisplay --> ReviewView: "Review Answers"
    }

    state ReviewView {
        [*] --> ReviewFilter: Filter by "All" or "Incorrect Only"
        ReviewFilter --> DetailedReview: Step through or browse cards with explanations
        DetailedReview --> ResultView: "Back to Results"
        DetailedReview --> QuizView: "Retry Quiz"
    }
```

### 6.1 State Management Pattern (`useQuizEngine`)
- The state engine is encapsulated inside a custom React hook `useQuizEngine`.
- Actions dispatched to the hook:
  - `startQuiz()`: Initializes randomized question order and resets answer records.
  - `selectOption(optionId)`: Records selection, compares with `correctOptionId`, locks current question, and updates aggregate score.
  - `nextQuestion()`: Advances `currentIndex` and prepares shuffled options for next question.
  - `previousQuestion()`: Moves back (if permitted in practice mode).
  - `finishQuiz()`: Transitions `viewMode` to `'result'`.
  - `retakeQuiz()`: Re-initializes state with a new randomized sequence.
  - `setReviewFilter(filter)`: Toggles review mode between all questions and wrong answers only.

---

## 7. Recommended Implementation Sequence

To maintain strict phase separation, rapid development speed, and zero regressions, the project will follow this sequential roadmap:

```
[Phase 1: Architecture] ─── (Completed)
          │
          ▼
[Phase 2: Excel Audit & 100-Record Verification]
          │ - Inspect Excel workbook sheet name, headers, structure
          │ - Verify exactly 100 valid MCQs, options A-D, correct keys
          │ - Identify and report any formatting anomalies or missing keys
          │
          ▼
[Phase 3: Data Ingestion Pipeline & questions.json]
          │ - Write scripts/convert-excel.ts (using xlsx parser)
          │ - Output validated src/data/questions.json matching TypeScript types
          │ - Establish automated schema validation check
          │
          ▼
[Phase 4: Project Scaffolding & Design Foundation]
          │ - Initialize Vite + React + TypeScript configuration
          │ - Define src/types/quiz.ts
          │ - Establish CSS design tokens (tokens.css) & layout foundation
          │
          ▼
[Phase 5: Quiz Logic Engine & Shuffling Utilities]
          │ - Implement Fisher-Yates utility (src/utils/shuffle.ts)
          │ - Implement useQuizEngine hook with single-submission lock
          │ - Unit-test answer mapping invariance under option shuffling
          │
          ▼
[Phase 6: UI Component & Page Assembly]
          │ - Build WelcomeView, QuizView, ResultView, ReviewView
          │ - Build QuestionCard, OptionList, OptionItem, FeedbackCard
          │ - Integrate immediate feedback & explanation reveal
          │
          ▼
[Phase 7: Visual Polish, Micro-Animations & Responsiveness]
          │ - Premium aesthetics: dark/light balance, sleek cards, micro-interactions
          │ - Accessible keyboard navigation & mobile touch responsiveness
          │ - Wrong-answer review filter implementation
          │
          ▼
[Phase 8: Production Build Verification & Vercel Readiness]
          │ - TypeScript type-checking (`tsc --noEmit`)
          │ - Production bundle build (`vite build`)
          │ - Verification of zero-backend static deployment readiness
```

---

## 8. Summary of Scope Boundaries
- **Phase 1 (Current)**: Architecture specification only. No code or files modified beyond creating `ARCHITECTURE.md`.
- **Phase 2 (Next)**: Audit raw Excel workbook in `EXCEL_SHEET/` and verify integrity of 100 questions.
