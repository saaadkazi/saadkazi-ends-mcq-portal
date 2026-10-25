import React from 'react';
import { useQuizEngine } from './hooks/useQuizEngine';
import { WelcomeView } from './pages/WelcomeView';
import { QuizView } from './pages/QuizView';
import { ResultView } from './pages/ResultView';
import { ReviewView } from './pages/ReviewView';

export default function App(): React.ReactElement {
  const engine = useQuizEngine();

  return (
    <main className="portal-container" id="main-content">
      {engine.viewMode === 'welcome' && (
        <WelcomeView
          totalQuestions={engine.questions.length}
          onStartQuiz={engine.startQuiz}
        />
      )}

      {engine.viewMode === 'quiz' && <QuizView engine={engine} />}

      {engine.viewMode === 'result' && <ResultView engine={engine} />}

      {engine.viewMode === 'review' && <ReviewView engine={engine} />}
    </main>
  );
}
