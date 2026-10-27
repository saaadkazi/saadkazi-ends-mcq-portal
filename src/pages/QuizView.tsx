import React, { useState, useEffect } from 'react';
import type { OptionId, QuizEngine } from '../types/quiz';
import { useAnswerSound, type UseAnswerSoundResult } from '../hooks/useAnswerSound';
import { useQuizKeyboard } from '../utils/keyboard';
import { QuizHeader } from '../components/quiz/QuizHeader';
import { QuestionCard } from '../components/quiz/QuestionCard';
import { OptionList } from '../components/quiz/OptionList';
import { FeedbackCard } from '../components/quiz/FeedbackCard';
import { Button } from '../components/common/Button';

export interface QuizViewProps {
  engine: QuizEngine;
  sound?: UseAnswerSoundResult;
}

export const QuizView: React.FC<QuizViewProps> = ({ engine, sound: propSound }) => {
  const {
    currentQuestion,
    currentIndex,
    questions,
    currentShuffledOptions,
    isAnswerSubmitted,
    currentAnswer,
    stats,
    isFirstQuestion,
    isLastQuestion,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    resetToWelcome
  } = engine;

  const fallbackSound = useAnswerSound();
  const { isMuted, toggleMute, playAnswerSound, stopAudio } = propSound ?? fallbackSound;

  // Local pending selections by question id before submission
  const [pendingSelections, setPendingSelections] = useState<Record<number, OptionId>>({});
  const [selectedOptionId, setSelectedOptionId] = useState<OptionId | null>(null);

  // Stop audio on unmount or question advancement
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // Sync selection with state when question advances or moves backward
  useEffect(() => {
    if (currentAnswer) {
      setSelectedOptionId(currentAnswer.selectedOptionId);
    } else if (currentQuestion && pendingSelections[currentQuestion.id]) {
      setSelectedOptionId(pendingSelections[currentQuestion.id]);
    } else {
      setSelectedOptionId(null);
    }
  }, [currentIndex, currentAnswer, currentQuestion, pendingSelections]);

  if (!currentQuestion) {
    return null;
  }

  const handleSelectOption = (id: OptionId) => {
    if (!isAnswerSubmitted) {
      setSelectedOptionId(id);
      if (currentQuestion) {
        setPendingSelections((prev) => ({
          ...prev,
          [currentQuestion.id]: id
        }));
      }
    }
  };

  const handleSubmit = () => {
    if (selectedOptionId && !isAnswerSubmitted) {
      const isCorrect = selectedOptionId === currentQuestion.correctOptionId;
      const wasAccepted = submitAnswer(selectedOptionId);
      if (wasAccepted) {
        playAnswerSound(isCorrect);
      }
    }
  };

  const handleNext = () => {
    stopAudio();
    nextQuestion();
  };

  const handlePrevious = () => {
    stopAudio();
    previousQuestion();
  };

  const handleQuit = () => {
    const shouldExit =
      typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm('Are you sure you want to exit? Your progress in this quiz session will be lost.')
        : true;

    if (shouldExit) {
      stopAudio();
      resetToWelcome();
    }
  };

  // Register keyboard-driven MCQ controls (A/B/C/D, Enter, ArrowLeft, ArrowRight)
  useQuizKeyboard({
    options: currentShuffledOptions,
    isSubmitted: isAnswerSubmitted,
    selectedOptionId,
    onSelectOption: handleSelectOption,
    onSubmit: handleSubmit,
    onNext: handleNext,
    onPrevious: handlePrevious,
    isFirstQuestion
  });

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
        answeredCount={stats.answeredCount}
        correctCount={stats.correctCount}
        incorrectCount={stats.incorrectCount}
        accuracyPercentage={stats.accuracyPercentage}
        onQuit={handleQuit}
        isMuted={isMuted}
        onToggleMute={toggleMute}
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

      <div className="quiz-action-bar">
        <Button
          id="quiz-prev-btn"
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstQuestion}
          className="quiz-action-btn"
          aria-label="Navigate to previous question"
        >
          {'\u2190 Previous'}
        </Button>

        {!isAnswerSubmitted ? (
          <Button
            id="quiz-submit-btn"
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedOptionId}
            className="quiz-action-btn"
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            id="quiz-next-btn"
            variant="primary"
            onClick={handleNext}
            className="quiz-action-btn"
          >
            {isLastQuestion ? 'Finish & View Results' : 'Next Question \u2192'}
          </Button>
        )}
      </div>

      <div
        className="quiz-shortcut-hint"
        style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          paddingTop: '0.1rem',
          letterSpacing: '0.02em',
          userSelect: 'none'
        }}
        aria-label="Keyboard shortcuts: A through D to select option, Enter to submit or advance, Left and Right arrows to navigate"
      >
        <span aria-hidden="true">
          <kbd style={{ fontFamily: 'inherit', fontWeight: 600 }}>A</kbd>–<kbd style={{ fontFamily: 'inherit', fontWeight: 600 }}>D</kbd>: Select Option &nbsp;|&nbsp; <kbd style={{ fontFamily: 'inherit', fontWeight: 600 }}>Enter</kbd>: Submit / Next &nbsp;|&nbsp; <kbd style={{ fontFamily: 'inherit', fontWeight: 600 }}>←</kbd> <kbd style={{ fontFamily: 'inherit', fontWeight: 600 }}>→</kbd>: Navigate
        </span>
      </div>
    </div>
  );
};
