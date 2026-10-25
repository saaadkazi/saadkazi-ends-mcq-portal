import React from 'react';
import type { DisplayOption } from '../../types/quiz';

export interface OptionItemProps {
  option: DisplayOption;
  isSelected: boolean;
  isSubmitted: boolean;
  isCorrectAnswer: boolean;
  isUserSelection: boolean;
  onSelect: () => void;
  disabled: boolean;
}

export const OptionItem: React.FC<OptionItemProps> = ({
  option,
  isSelected,
  isSubmitted,
  isCorrectAnswer,
  isUserSelection,
  onSelect,
  disabled
}) => {
  let itemClasses = 'option-item';
  let indicatorContent: React.ReactNode = option.displayLabel;

  if (isSubmitted) {
    if (isCorrectAnswer) {
      itemClasses += ' option-item--correct';
      indicatorContent = '✓';
    } else if (isUserSelection) {
      itemClasses += ' option-item--incorrect';
      indicatorContent = '✕';
    }
  } else if (isSelected) {
    itemClasses += ' option-item--selected';
  }

  return (
    <button
      type="button"
      className={itemClasses}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={`Option ${option.displayLabel}: ${option.text}`}
    >
      <span className="option-indicator" aria-hidden="true">
        {indicatorContent}
      </span>
      <span className="option-text">{option.text}</span>
    </button>
  );
};
