import React from 'react';
import type { DisplayOption, UserAnswer } from '../../types/quiz';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export interface ReviewCardProps {
  questionNumber: number;
  questionText: string;
  options: DisplayOption[];
  userAnswer: UserAnswer;
  explanation?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  questionNumber,
  questionText,
  options,
  userAnswer,
  explanation
}) => {
  const isCorrect = userAnswer.isCorrect;
  const correctOption = options.find((o) => o.id === userAnswer.correctOptionId);
  const selectedOption = options.find((o) => o.id === userAnswer.selectedOptionId);

  return (
    <Card style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Question #{questionNumber}
        </span>
        {isCorrect ? (
          <Badge variant="emerald">Correct ✓</Badge>
        ) : (
          <Badge variant="rose">Incorrect ✕</Badge>
        )}
      </div>

      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.45, marginBottom: '1rem', color: 'var(--text-primary)' }}>
        {questionText}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {options.map((opt) => {
          const isSelected = opt.id === userAnswer.selectedOptionId;
          const isRight = opt.id === userAnswer.correctOptionId;

          let bg = 'var(--bg-surface)';
          let border = 'var(--border-subtle)';
          let textColor = 'var(--text-primary)';
          let tag: React.ReactNode = null;

          if (isRight) {
            bg = 'var(--color-success-bg)';
            border = 'var(--color-success-border)';
            textColor = 'var(--color-success-text)';
            tag = (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success-solid)' }}>
                {isSelected ? '✓ Your Choice (Correct)' : '✓ Correct Answer'}
              </span>
            );
          } else if (isSelected) {
            bg = 'var(--color-danger-bg)';
            border = 'var(--color-danger-border)';
            textColor = 'var(--color-danger-text)';
            tag = (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-danger-solid)' }}>
                ✕ Your Choice
              </span>
            );
          }

          return (
            <div
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: bg,
                border: `1.5px solid ${border}`,
                color: textColor,
                fontSize: '0.9rem',
                lineHeight: 1.4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '22px',
                    height: '22px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isRight ? 'var(--color-success-solid)' : isSelected ? 'var(--color-danger-solid)' : 'var(--bg-surface-subtle)',
                    color: isRight || isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}
                >
                  {opt.displayLabel}
                </span>
                <span>{opt.text}</span>
              </div>
              {tag && <div style={{ marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>{tag}</div>}
            </div>
          );
        })}
      </div>

      {!isCorrect && correctOption && (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem'
          }}
        >
          {selectedOption && (
            <div style={{ marginBottom: '0.35rem', color: 'var(--color-danger-text)' }}>
              <strong>Your Choice: </strong>Option {userAnswer.selectedDisplayLabel} &mdash; {selectedOption.text}
            </div>
          )}
          <div>
            <strong style={{ color: 'var(--color-success-solid)' }}>Correct Key: </strong>
            <span style={{ color: 'var(--text-primary)' }}>
              Option {userAnswer.correctDisplayLabel} &mdash; {correctOption.text}
            </span>
          </div>
        </div>
      )}

      {explanation && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          {explanation}
        </div>
      )}
    </Card>
  );
};
