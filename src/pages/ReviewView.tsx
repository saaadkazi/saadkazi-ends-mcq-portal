import React from 'react';
import type { QuizEngine } from '../types/quiz';
import { ReviewFilter } from '../components/review/ReviewFilter';
import { ReviewCard } from '../components/review/ReviewCard';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export interface ReviewViewProps {
  engine: QuizEngine;
}

export const ReviewView: React.FC<ReviewViewProps> = ({ engine }) => {
  const {
    questions,
    userAnswers,
    stats,
    reviewFilter,
    setReviewFilter,
    finishQuiz,
    restartQuiz
  } = engine;

  // Compile list of questions with answers
  const answeredQuestions = questions
    .map((q, index) => {
      const answer = userAnswers[q.id];
      return {
        question: q,
        originalIndex: index,
        answer
      };
    })
    .filter((item) => item.answer !== undefined);

  // Filter based on selected review mode
  const displayedItems = answeredQuestions.filter((item) => {
    if (reviewFilter === 'incorrect') {
      return !item.answer.isCorrect;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            Answer Review
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Comparing your submissions against the designated exam keys.
          </p>
        </div>
        <Button variant="outline" onClick={finishQuiz} style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}>
          &larr; Results
        </Button>
      </div>

      {/* Filter Bar */}
      <ReviewFilter
        activeFilter={reviewFilter}
        totalCount={answeredQuestions.length}
        incorrectCount={stats.incorrectCount}
        onFilterChange={setReviewFilter}
      />

      {/* Empty State for Incorrect filter when 100% correct */}
      {reviewFilter === 'incorrect' && displayedItems.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>&#127881;</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success-solid)', marginBottom: '0.5rem' }}>
            Zero Incorrect Answers!
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            Remarkable work! You answered every question correctly with a perfect 100% score.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="outline" onClick={() => setReviewFilter('all')}>
              Browse All Questions
            </Button>
            <Button variant="primary" onClick={restartQuiz}>
              Retake Quiz
            </Button>
          </div>
        </Card>
      ) : (
        /* Review List */
        <div>
          {displayedItems.map((item) => (
            <ReviewCard
              key={item.question.id}
              questionNumber={item.originalIndex + 1}
              questionText={item.question.question}
              options={item.answer.shuffledOptions}
              userAnswer={item.answer}
              explanation={item.question.explanation}
            />
          ))}
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'space-between' }}>
        <Button variant="outline" onClick={finishQuiz}>
          &larr; Back to Results
        </Button>
        <Button variant="primary" onClick={restartQuiz}>
          &#8635; Retake Quiz
        </Button>
      </div>
    </div>
  );
};
