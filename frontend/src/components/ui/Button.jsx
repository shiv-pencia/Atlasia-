import React from 'react';

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  style = {},
  ...props
}) => {
  const className = `btn btn-${variant}`;

  return (
    <button
      type={type}
      onClick={onClick}
      className={className}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
