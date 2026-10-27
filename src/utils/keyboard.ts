import { useEffect, useRef } from 'react';
import type { DisplayOption, OptionId } from '../types/quiz';

export interface QuizKeyboardContext {
  options: readonly DisplayOption[];
  isSubmitted: boolean;
  selectedOptionId: OptionId | null;
  onSelectOption: (id: OptionId) => void;
  onSubmit: () => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirstQuestion: boolean;
}

export interface KeyboardEventLike {
  key: string;
  repeat?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  target?: unknown;
  preventDefault?: () => void;
}

/**
 * Checks whether the event target is an editable element or a native interactive control
 * where default keyboard behavior must be preserved.
 */
export function isEditableOrNativeControl(target: unknown, key: string): boolean {
  if (!target || typeof target !== 'object') {
    return false;
  }

  const elem = target as Partial<HTMLElement>;
  const tagName = elem.tagName?.toUpperCase?.();

  // 1. Text inputs, textareas, selects, or elements with contenteditable
  if (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    elem.isContentEditable
  ) {
    return true;
  }

  // 2. Buttons with their own dedicated keyboard actions (e.g. Previous, Exit, Mute)
  // When Enter is pressed on these buttons, native click activation takes precedence
  if (key === 'Enter' && tagName === 'BUTTON') {
    const id = elem.id;
    const isHeaderAction = elem.classList?.contains?.('header-action-btn');
    if (id === 'quiz-prev-btn' || isHeaderAction) {
      return true;
    }
  }

  return false;
}

/**
 * Pure dispatcher for keyboard MCQ actions.
 * Returns true if a shortcut was recognized and handled, false otherwise.
 * Calls event.preventDefault() ONLY when an action is actually handled.
 */
export function handleQuizKeyboardAction(
  event: KeyboardEventLike,
  context: QuizKeyboardContext
): boolean {
  // 1. Ignore repeated keydown events when holding a key down
  if (event.repeat) {
    return false;
  }

  // 2. Ignore modifier key combinations (Ctrl, Alt, Meta)
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return false;
  }

  // 3. Ignore if focus is inside an input, textarea, or dedicated native control
  if (isEditableOrNativeControl(event.target, event.key)) {
    return false;
  }

  const keyUpper = event.key.toUpperCase();

  // 4. Option selection: A, B, C, D (case-insensitive)
  if (keyUpper === 'A' || keyUpper === 'B' || keyUpper === 'C' || keyUpper === 'D') {
    // If already submitted, option selection is locked
    if (context.isSubmitted) {
      return false;
    }

    // Match by displayed visual label, NOT permanent ID
    const matchedOption = context.options.find(
      (opt) => opt.displayLabel.toUpperCase() === keyUpper
    );

    if (matchedOption) {
      event.preventDefault?.();
      context.onSelectOption(matchedOption.id);
      return true;
    }

    return false;
  }

  // 5. Enter: Submit or Advance
  if (event.key === 'Enter') {
    if (!context.isSubmitted) {
      // If unsubmitted and an option is selected, submit answer
      if (context.selectedOptionId !== null) {
        event.preventDefault?.();
        context.onSubmit();
        return true;
      }
      // If no option selected, Enter does nothing
      return false;
    } else {
      // If already submitted, advance to next question or results
      event.preventDefault?.();
      context.onNext();
      return true;
    }
  }

  // 6. ArrowLeft: Navigate to previous question
  if (event.key === 'ArrowLeft') {
    if (!context.isFirstQuestion) {
      event.preventDefault?.();
      context.onPrevious();
      return true;
    }
    return false;
  }

  // 7. ArrowRight: Navigate to next question (only if submitted)
  if (event.key === 'ArrowRight') {
    if (context.isSubmitted) {
      event.preventDefault?.();
      context.onNext();
      return true;
    }
    return false;
  }

  return false;
}

/**
 * React hook that registers the window keydown listener while QuizView is mounted.
 * Uses a ref to ensure event handlers always access the latest state and callbacks
 * without re-binding on every render.
 */
export function useQuizKeyboard(context: QuizKeyboardContext): void {
  const contextRef = useRef<QuizKeyboardContext>(context);
  contextRef.current = context;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      handleQuizKeyboardAction(event, contextRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
