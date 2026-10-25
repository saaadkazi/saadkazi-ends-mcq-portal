import React from 'react';
import { ProgressBar } from '../common/ProgressBar';

export interface QuizHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  correctCount: number;
  onQuit?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  currentIndex,
  totalQuestions,
  correctCount,
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
    </header>
  );
};
