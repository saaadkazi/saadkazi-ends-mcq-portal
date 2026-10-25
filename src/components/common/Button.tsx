import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const classes = [
    'btn',
    `btn-${variant}`,
    fullWidth ? 'btn-full' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
};
