import React, { useState, useEffect } from 'react';
import type { OptionId, QuizEngine } from '../types/quiz';
import { QuizHeader } from '../components/quiz/QuizHeader';
import { QuestionCard } from '../components/quiz/QuestionCard';
import { OptionList } from '../components/quiz/OptionList';
import { FeedbackCard } from '../components/quiz/FeedbackCard';
import { Button } from '../components/common/Button';

export interface QuizViewProps {
  engine: QuizEngine;
}

export const QuizView: React.FC<QuizViewProps> = ({ engine }) => {
  const {
    currentQuestion,
    currentIndex,
    questions,
    currentShuffledOptions,
    isAnswerSubmitted,
    currentAnswer,
    stats,
    isLastQuestion,
    submitAnswer,
    nextQuestion,
    resetToWelcome
  } = engine;

  // Local pending selection before submission
  const [selectedOptionId, setSelectedOptionId] = useState<OptionId | null>(null);

  // Sync selection with state when question advances
  useEffect(() => {
    if (currentAnswer) {
      setSelectedOptionId(currentAnswer.selectedOptionId);
    } else {
      setSelectedOptionId(null);
    }
  }, [currentIndex, currentAnswer]);

  if (!currentQuestion) {
    return null;
  }

  const handleSelectOption = (id: OptionId) => {
    if (!isAnswerSubmitted) {
      setSelectedOptionId(id);
    }
  };

  const handleSubmit = () => {
    if (selectedOptionId && !isAnswerSubmitted) {
      submitAnswer(selectedOptionId);
    }
  };

  const handleNext = () => {
    nextQuestion();
  };

  // Find correct & selected option objects for feedback display
  const correctAnswerOption = currentShuffledOptions.find(
    (o) => o.id === currentQuestion.correctOptionId
  ) ?? null;

  const userAnswerOption = currentAnswer
    ? currentShuffledOptions.find((o) => o.id === currentAnswer.selectedOptionId) ?? null
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <QuizHeader
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        correctCount={stats.correctCount}
        onQuit={resetToWelcome}
      />

      <QuestionCard question={currentQuestion} questionNumber={currentIndex + 1} />

      <OptionList
        options={currentShuffledOptions}
        selectedOptionId={selectedOptionId}
        isSubmitted={isAnswerSubmitted}
        correctOptionId={currentQuestion.correctOptionId}
        userSelectionId={currentAnswer ? currentAnswer.selectedOptionId : selectedOptionId}
        onSelectOption={handleSelectOption}
        disabled={isAnswerSubmitted}
      />

      {isAnswerSubmitted && currentAnswer && (
        <FeedbackCard
          isCorrect={currentAnswer.isCorrect}
          userAnswerOption={userAnswerOption}
          correctAnswerOption={correctAnswerOption}
          explanation={currentQuestion.explanation}
        />
      )}

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        {!isAnswerSubmitted ? (
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={!selectedOptionId}
            style={{ padding: '0.9rem' }}
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            variant="primary"
            fullWidth
            onClick={handleNext}
            style={{ padding: '0.9rem' }}
          >
            {isLastQuestion ? 'Finish & View Results' : 'Next Question \u2192'}
          </Button>
        )}
      </div>
    </div>
  );
};
