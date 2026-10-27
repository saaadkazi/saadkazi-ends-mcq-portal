import React from 'react';
import type { QuizEngine } from '../types/quiz';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export interface ResultViewProps {
  engine: QuizEngine;
}

export const ResultView: React.FC<ResultViewProps> = ({ engine }) => {
  const { stats, restartQuiz, startReview, resetToWelcome, startIncorrectPractice } = engine;
  const { totalQuestions, correctCount, incorrectCount, scorePercentage, accuracyPercentage, performanceTier } = stats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: 'auto 0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <Badge variant="blue">Assessment Summary</Badge>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>
          Practice Results
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Review your performance metrics across all {totalQuestions} questions.
        </p>
      </div>

      <Card style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1 }}>
            {scorePercentage}%
          </span>
          <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Score: {correctCount} / {totalQuestions} Correct &bull; Accuracy: {accuracyPercentage}%
          </span>
        </div>

        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-app)',
            border: `1.5px solid ${performanceTier.color}`,
            marginBottom: '1.5rem',
            maxWidth: '480px'
          }}
        >
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: performanceTier.color, marginBottom: '0.25rem' }}>
            {performanceTier.label}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {performanceTier.description}
          </span>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.75rem'
          }}
        >
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ display: 'block', fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {totalQuestions}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Total
            </span>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-success-border)' }}>
            <span style={{ display: 'block', fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-success-solid)' }}>
              {correctCount}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success-text)' }}>
              Correct
            </span>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger-border)' }}>
            <span style={{ display: 'block', fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-danger-solid)' }}>
              {incorrectCount}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-danger-text)' }}>
              Incorrect
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Button
            variant="primary"
            fullWidth
            onClick={startIncorrectPractice}
            disabled={incorrectCount === 0}
            id="practise-incorrect-btn"
          >
            Practise Incorrect Questions ({incorrectCount})
          </Button>

          {incorrectCount === 0 && (
            <div
              style={{
                padding: '0.6rem 0.9rem',
                backgroundColor: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-success-text)',
                fontSize: '0.85rem',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              🎉 Perfect Score! No incorrect questions to practise.
            </div>
          )}

          <Button variant="outline" fullWidth onClick={restartQuiz}>
            {engine.orderMode === 'original'
              ? '↻ Retake Quiz (Original Order)'
              : '↻ Retake Quiz (Fresh Random Order)'}
          </Button>

          <Button variant="outline" fullWidth onClick={() => startReview('all')}>
            Review All Answers ({totalQuestions})
          </Button>

          <Button
            variant="secondary"
            fullWidth
            onClick={() => startReview('incorrect')}
            disabled={incorrectCount === 0}
          >
            Review Incorrect Answers ({incorrectCount})
          </Button>

          <Button variant="ghost" fullWidth onClick={resetToWelcome} style={{ marginTop: '0.25rem' }}>
            &larr; Back to Welcome Screen
          </Button>
        </div>
      </Card>
    </div>
  );
};
