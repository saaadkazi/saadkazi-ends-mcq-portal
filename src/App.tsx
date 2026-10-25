import React from 'react';
import { useQuizEngine } from './hooks/useQuizEngine';
import { useAnswerSound } from './hooks/useAnswerSound';
import { WelcomeView } from './pages/WelcomeView';
import { QuizView } from './pages/QuizView';
import { ResultView } from './pages/ResultView';
import { ReviewView } from './pages/ReviewView';

export default function App(): React.ReactElement {
  const engine = useQuizEngine();
  const sound = useAnswerSound();

  return (
    <main className="portal-container" id="main-content">
      {engine.viewMode === 'welcome' && (
        <WelcomeView
          totalQuestions={engine.questions.length}
          onStartQuiz={engine.startQuiz}
          isMuted={sound.isMuted}
          onToggleMute={sound.toggleMute}
        />
      )}

      {engine.viewMode === 'quiz' && <QuizView engine={engine} sound={sound} />}

      {engine.viewMode === 'result' && <ResultView engine={engine} />}

      {engine.viewMode === 'review' && <ReviewView engine={engine} />}
    </main>
  );
}
