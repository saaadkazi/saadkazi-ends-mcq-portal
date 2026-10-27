import React from 'react';
import { ProgressBar } from '../common/ProgressBar';

export interface QuizHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  answeredCount?: number;
  correctCount: number;
  incorrectCount?: number;
  accuracyPercentage?: number;
  onQuit?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  currentIndex,
  totalQuestions,
  answeredCount = 0,
  correctCount,
  incorrectCount = 0,
  accuracyPercentage = 0,
  onQuit,
  isMuted = false,
  onToggleMute
}) => {
  const currentNumber = currentIndex + 1;

  return (
    <header className="quiz-header" style={{ marginBottom: '1.5rem' }}>
      <div className="quiz-header-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ENDS Practice Portal
          </span>
        </div>
        <div className="quiz-header-actions">
          {onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              className="btn btn-ghost header-action-btn"
              aria-label={isMuted ? 'Unmute answer sound effects' : 'Mute answer sound effects'}
              title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            >
              <span aria-hidden="true">{isMuted ? '🔇' : '🔊'}</span>
              <span>{isMuted ? 'Muted' : 'Sound'}</span>
            </button>
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0 0.25rem' }}>
            Score: <strong style={{ color: 'var(--color-primary)' }}>{correctCount}</strong>
          </span>
          {onQuit && (
            <button
              type="button"
              onClick={onQuit}
              className="btn btn-ghost header-action-btn"
              title="Exit Practice"
            >
              Exit
            </button>
          )}
        </div>
      </div>
      <ProgressBar current={currentNumber} total={totalQuestions} label={`Question ${currentNumber} of ${totalQuestions}`} />

      {/* Real-time Session Practice Progress */}
      <div
        className="quiz-progress-stats"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem',
          marginTop: '0.75rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}
      >
        <div>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Attempted
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {answeredCount}/{totalQuestions}
          </span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Correct
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-success-solid)' }}>
            {correctCount}
          </span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Incorrect
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-danger-solid)' }}>
            {incorrectCount}
          </span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Accuracy
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {accuracyPercentage}%
          </span>
        </div>
      </div>
    </header>
  );
};
