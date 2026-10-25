import React from 'react';
import type { ReviewFilter as FilterType } from '../../types/quiz';

export interface ReviewFilterProps {
  activeFilter: FilterType;
  totalCount: number;
  incorrectCount: number;
  onFilterChange: (filter: FilterType) => void;
}

export const ReviewFilter: React.FC<ReviewFilterProps> = ({
  activeFilter,
  totalCount,
  incorrectCount,
  onFilterChange
}) => {
  return (
    <div className="filter-bar" role="tablist" aria-label="Review filter">
      <button
        type="button"
        role="tab"
        aria-selected={activeFilter === 'all'}
        className={`filter-btn ${activeFilter === 'all' ? 'filter-btn--active' : ''}`}
        onClick={() => onFilterChange('all')}
      >
        All Questions ({totalCount})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeFilter === 'incorrect'}
        className={`filter-btn ${activeFilter === 'incorrect' ? 'filter-btn--active' : ''}`}
        onClick={() => onFilterChange('incorrect')}
      >
        Incorrect Only ({incorrectCount})
      </button>
    </div>
  );
};
