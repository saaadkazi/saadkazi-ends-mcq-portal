import React from 'react';
import type { DisplayOption } from '../../types/quiz';

export interface FeedbackCardProps {
  isCorrect: boolean;
  userAnswerOption: DisplayOption | null;
  correctAnswerOption: DisplayOption | null;
  explanation?: string;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  isCorrect,
  userAnswerOption,
  correctAnswerOption,
  explanation
}) => {
  if (isCorrect) {
    return (
      <div className="feedback-card feedback-card--correct" role="alert">
        <div className="feedback-title">
          <span>✓</span>
          <span>Correct Answer!</span>
        </div>
        <p className="feedback-detail" style={{ color: 'var(--color-success-text)' }}>
          Great job! <strong>Option {correctAnswerOption?.displayLabel}</strong> is correct: &ldquo;{correctAnswerOption?.text}&rdquo;.
        </p>
        {explanation && (
          <p className="feedback-detail" style={{ marginTop: '0.4rem', fontStyle: 'italic', color: 'var(--color-success-text)' }}>
            {explanation}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="feedback-card feedback-card--incorrect" role="alert">
      <div className="feedback-title">
        <span>✕</span>
        <span>Incorrect</span>
      </div>
      <div className="feedback-detail" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <p style={{ color: 'var(--color-danger-text)' }}>
          You selected: <strong>Option {userAnswerOption?.displayLabel}</strong> (&ldquo;{userAnswerOption?.text}&rdquo;)
        </p>
        <p style={{ color: 'var(--color-danger-text)', fontWeight: 600 }}>
          Correct answer: Option {correctAnswerOption?.displayLabel} &mdash; &ldquo;{correctAnswerOption?.text}&rdquo;
        </p>
      </div>
      {explanation && (
        <p className="feedback-detail" style={{ marginTop: '0.4rem', fontStyle: 'italic', color: 'var(--color-danger-text)' }}>
          {explanation}
        </p>
      )}
    </div>
  );
};
