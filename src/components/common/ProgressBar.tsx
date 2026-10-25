import React from 'react';

export interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label }) => {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="progress-container" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
      <div className="progress-header">
        <span>{label ?? `Question ${current} of ${total}`}</span>
        <span>{percentage}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};
