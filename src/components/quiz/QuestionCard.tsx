import React from 'react';
import type { Question } from '../../types/quiz';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export interface QuestionCardProps {
  question: Question;
  questionNumber: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, questionNumber }) => {
  return (
    <Card className="question-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <Badge variant="blue">Question #{questionNumber}</Badge>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          ID: {question.id}
        </span>
      </div>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.5, color: 'var(--text-primary)' }}>
        {question.question}
      </h2>
    </Card>
  );
};
