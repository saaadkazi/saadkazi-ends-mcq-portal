import React from 'react';
import type { DisplayOption, OptionId } from '../../types/quiz';
import { OptionItem } from './OptionItem';

export interface OptionListProps {
  options: DisplayOption[];
  selectedOptionId: OptionId | null;
  isSubmitted: boolean;
  correctOptionId: OptionId;
  userSelectionId: OptionId | null;
  onSelectOption: (id: OptionId) => void;
  disabled: boolean;
}

export const OptionList: React.FC<OptionListProps> = ({
  options,
  selectedOptionId,
  isSubmitted,
  correctOptionId,
  userSelectionId,
  onSelectOption,
  disabled
}) => {
  return (
    <div className="option-list" role="radiogroup" aria-label="Multiple choice options">
      {options.map((opt) => {
        const isSelected = selectedOptionId === opt.id;
        const isCorrectAnswer = opt.id === correctOptionId;
        const isUserSelection = userSelectionId === opt.id;

        return (
          <OptionItem
            key={opt.id}
            option={opt}
            isSelected={isSelected}
            isSubmitted={isSubmitted}
            isCorrectAnswer={isCorrectAnswer}
            isUserSelection={isUserSelection}
            onSelect={() => onSelectOption(opt.id)}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
};
