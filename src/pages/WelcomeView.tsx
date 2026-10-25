import React from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export interface WelcomeViewProps {
  totalQuestions: number;
  onStartQuiz: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ totalQuestions, onStartQuiz }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: 'auto 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <Badge variant="blue">Official Exam Preparation Portal</Badge>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
          Entrepreneurship Development
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
          Test and solidify your understanding of core entrepreneurship concepts, MSME classifications, feasibility analysis, and financial planning.
        </p>
      </div>

      <Card>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Exam Simulation Rules & Highlights
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ display: 'block', fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {totalQuestions}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              MCQs
            </span>
          </div>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ display: 'block', fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-accent-primary)' }}>
              Instant
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Feedback
            </span>
          </div>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
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
            <strong>Randomized Order:</strong> Questions and options are shuffled on every attempt to ensure rigorous practice.
          </li>
          <li>
            <strong>Single Submission:</strong> Once you submit an answer, it is locked immediately to prevent guessing.
          </li>
          <li>
            <strong>Full Analytics:</strong> Review all answered questions or isolate wrong answers after finishing.
          </li>
        </ul>

        <Button variant="primary" fullWidth onClick={onStartQuiz} style={{ fontSize: '1.05rem', padding: '0.9rem' }}>
          Start Practice Quiz &rarr;
        </Button>
      </Card>
    </div>
  );
};
