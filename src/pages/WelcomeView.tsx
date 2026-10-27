import React, { useState, useMemo } from 'react';
import rawQuestions from '../data/questions.json';
import type { Question, QuestionOrderMode } from '../types/quiz';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export type FixedPreset = 10 | 20 | 50 | 80 | 90 | 100;
export const FIXED_PRESETS: readonly FixedPreset[] = [10, 20, 50, 80, 90, 100];

export interface RangeValidationResult {
  isValid: boolean;
  error: string | null;
  count: number;
}

/**
 * Validates custom range inputs (inclusive [1, 100]).
 */
export function validateRange(start: number, end: number, min = 1, max = 100): RangeValidationResult {
  if (isNaN(start) || isNaN(end)) {
    return { isValid: false, error: 'Please enter valid question numbers.', count: 0 };
  }
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    return { isValid: false, error: 'Question numbers must be whole integers.', count: 0 };
  }
  if (start < min || start > max) {
    return { isValid: false, error: `Start question must be between ${min} and ${max}.`, count: 0 };
  }
  if (end < min || end > max) {
    return { isValid: false, error: `End question must be between ${min} and ${max}.`, count: 0 };
  }
  if (start > end) {
    return { isValid: false, error: 'Start question cannot be greater than End question.', count: 0 };
  }
  const count = end - start + 1;
  return { isValid: true, error: null, count };
}

/**
 * Selects questions using original Excel IDs before shuffling or ordering.
 */
export function filterQuestionsByRange(
  questions: readonly Question[],
  start: number,
  end: number
): Question[] {
  return questions.filter((q) => q.id >= start && q.id <= end);
}

export interface WelcomeViewProps {
  totalQuestions?: number;
  allQuestions?: readonly Question[];
  onStartQuiz: (customQuestions?: readonly Question[], mode?: QuestionOrderMode) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  allQuestions = rawQuestions as Question[],
  onStartQuiz,
  isMuted = false,
  onToggleMute
}) => {
  const [orderMode, setOrderMode] = useState<QuestionOrderMode>('shuffle');
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<FixedPreset>(100);
  const [customStart, setCustomStart] = useState<string>('1');
  const [customEnd, setCustomEnd] = useState<string>('25');

  const startNum = parseInt(customStart, 10);
  const endNum = parseInt(customEnd, 10);

  const rangeValidation = useMemo<RangeValidationResult>(() => {
    return validateRange(startNum, endNum, 1, allQuestions.length || 100);
  }, [startNum, endNum, allQuestions.length]);

  const selectedQuestions = useMemo<Question[]>(() => {
    if (mode === 'preset') {
      return filterQuestionsByRange(allQuestions, 1, selectedPreset);
    }
    if (rangeValidation.isValid) {
      return filterQuestionsByRange(allQuestions, startNum, endNum);
    }
    return [];
  }, [mode, selectedPreset, rangeValidation.isValid, allQuestions, startNum, endNum]);

  const totalCount = selectedQuestions.length;
  const isStartDisabled = mode === 'custom' && !rangeValidation.isValid;

  const handleStart = () => {
    if (isStartDisabled || selectedQuestions.length === 0) {
      return;
    }
    onStartQuiz(selectedQuestions, orderMode);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: 'auto 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <Badge variant="blue">Official Exam Preparation Portal</Badge>
          {onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              className="btn btn-ghost header-action-btn"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
              aria-label={isMuted ? 'Unmute answer sound effects' : 'Mute answer sound effects'}
              title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            >
              <span aria-hidden="true">{isMuted ? '🔇' : '🔊'}</span>
              <span>{isMuted ? 'Sound Muted' : 'Sound On'}</span>
            </button>
          )}
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
          Entrepreneurship Development
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
          Test and solidify your understanding of core entrepreneurship concepts, MSME classifications, feasibility analysis, and financial planning.
        </p>
      </div>

      <Card>
        {/* Step 1: Select Ordering Mode */}
        <div style={{ marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Step 1: Select Ordering Mode
            </h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Active: {orderMode === 'shuffle' ? 'Shuffle Mode' : 'Original Order'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.75rem',
              marginBottom: '0.75rem'
            }}
            role="radiogroup"
            aria-label="Question and option ordering mode"
          >
            {/* Shuffle Mode Card */}
            <button
              type="button"
              role="radio"
              aria-checked={orderMode === 'shuffle'}
              onClick={() => setOrderMode('shuffle')}
              id="order-mode-shuffle-btn"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${orderMode === 'shuffle' ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                backgroundColor: orderMode === 'shuffle' ? 'var(--color-accent-subtle)' : 'var(--bg-app)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  🔀 Shuffle Mode
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: orderMode === 'shuffle' ? 'var(--color-primary)' : 'var(--bg-surface-subtle)',
                    color: orderMode === 'shuffle' ? '#FFFFFF' : 'var(--text-muted)'
                  }}
                >
                  Default
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Questions and options are randomized for practice.
              </p>
            </button>

            {/* Original Order Mode Card */}
            <button
              type="button"
              role="radio"
              aria-checked={orderMode === 'original'}
              onClick={() => setOrderMode('original')}
              id="order-mode-original-btn"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${orderMode === 'original' ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                backgroundColor: orderMode === 'original' ? 'var(--color-accent-subtle)' : 'var(--bg-app)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  📋 Original Order Mode
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: orderMode === 'original' ? 'var(--color-primary)' : 'var(--bg-surface-subtle)',
                    color: orderMode === 'original' ? '#FFFFFF' : 'var(--text-muted)'
                  }}
                >
                  Excel Order
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Questions and options follow the original Excel order.
              </p>
            </button>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
            💡 <strong>Note:</strong> Original Order Mode is useful for ordered revision, while Shuffle Mode provides randomized practice.
          </p>
        </div>

        {/* Step 2: Select Practice Mode */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Step 2: Select Practice Set
            </h2>
            <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--bg-app)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setMode('preset')}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: mode === 'preset' ? 'var(--color-primary)' : 'transparent',
                  color: mode === 'preset' ? '#FFFFFF' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Fixed Sets
              </button>
              <button
                type="button"
                onClick={() => setMode('custom')}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: mode === 'custom' ? 'var(--color-primary)' : 'transparent',
                  color: mode === 'custom' ? '#FFFFFF' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Custom Range
              </button>
            </div>
          </div>

          {mode === 'preset' ? (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}
              >
                {FIXED_PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSelectedPreset(preset)}
                      className="btn"
                      style={{
                        padding: '0.65rem 0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--bg-app)',
                        color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                        border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      Questions 1–{preset}
                      {preset === 100 && (
                        <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.85, fontWeight: 500 }}>
                          (Full Practice)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--color-accent-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-accent-border)',
                  fontSize: '0.85rem',
                  color: 'var(--color-accent-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>
                  Fixed Set Active: <strong>Questions 1–{selectedPreset}</strong>
                </span>
                <strong style={{ fontSize: '0.95rem' }}>{selectedPreset} Questions</strong>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                  marginBottom: '0.75rem'
                }}
              >
                <div>
                  <label
                    htmlFor="custom-start-input"
                    style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}
                  >
                    Start Question (1–100)
                  </label>
                  <input
                    id="custom-start-input"
                    type="number"
                    min={1}
                    max={100}
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${!rangeValidation.isValid ? 'var(--color-danger-border)' : 'var(--border-strong)'}`,
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="custom-end-input"
                    style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}
                  >
                    End Question (1–100)
                  </label>
                  <input
                    id="custom-end-input"
                    type="number"
                    min={1}
                    max={100}
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${!rangeValidation.isValid ? 'var(--color-danger-border)' : 'var(--border-strong)'}`,
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {rangeValidation.error ? (
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--color-danger-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-danger-border)',
                    fontSize: '0.82rem',
                    color: 'var(--color-danger-text)',
                    marginBottom: '0.75rem'
                  }}
                >
                  ⚠️ {rangeValidation.error}
                </div>
              ) : (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--color-accent-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-accent-border)',
                    fontSize: '0.85rem',
                    color: 'var(--color-accent-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                  }}
                >
                  <span>
                    Range (Inclusive): <strong>Q{startNum} – Q{endNum}</strong>
                  </span>
                  <strong style={{ fontSize: '0.95rem' }}>
                    {rangeValidation.count} Question{rangeValidation.count === 1 ? '' : 's'}
                  </strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ display: 'block', fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {totalCount}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Selected MCQs
            </span>
          </div>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ display: 'block', fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-accent-primary)' }}>
              {orderMode === 'original' ? 'Original' : 'Shuffled'}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {orderMode === 'original' ? 'Excel Sequence' : 'Questions & Options'}
            </span>
          </div>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ display: 'block', fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-success-solid)' }}>
              Locked
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Submissions
            </span>
          </div>
        </div>

        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          <li>
            <strong>{orderMode === 'original' ? 'Sequential Order:' : 'Pre-Filtered Shuffling:'}</strong>{' '}
            {orderMode === 'original'
              ? 'Questions follow original Excel order and options remain locked to A, B, C, D.'
              : 'Selected questions are filtered by original Excel ID before being randomized for the session.'}
          </li>
          <li>
            <strong>Single Submission:</strong> Once you submit an answer, it is locked immediately to prevent guessing.
          </li>
          <li>
            <strong>Adaptive Revision:</strong> Review completed answers or start a focused session targeting only incorrect questions.
          </li>
        </ul>

        <Button
          variant="primary"
          fullWidth
          onClick={handleStart}
          disabled={isStartDisabled || totalCount === 0}
          id="welcome-start-btn"
          style={{ fontSize: '1.05rem', padding: '0.9rem' }}
        >
          Start Practice Quiz ({totalCount} {totalCount === 1 ? 'MCQ' : 'MCQs'}) &rarr;
        </Button>
      </Card>
    </div>
  );
};
