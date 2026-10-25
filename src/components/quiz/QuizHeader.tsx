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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ENDS Practice Portal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              className="btn btn-ghost"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              aria-label={isMuted ? 'Unmute answer sound effects' : 'Mute answer sound effects'}
              title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            >
              <span aria-hidden="true">{isMuted ? '🔇' : '🔊'}</span>
              <span>{isMuted ? 'Muted' : 'Sound'}</span>
            </button>
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Score: <strong style={{ color: 'var(--color-primary)' }}>{correctCount}</strong>
          </span>
          {onQuit && (
            <button
              type="button"
              onClick={onQuit}
              className="btn btn-ghost"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
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
