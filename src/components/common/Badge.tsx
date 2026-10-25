import React from 'react';

export interface BadgeProps {
  variant?: 'blue' | 'emerald' | 'rose' | 'amber';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'blue', children, className = '' }) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {children}
    </span>
  );
};
