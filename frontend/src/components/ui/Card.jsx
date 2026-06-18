import React from 'react';

export const Card = ({
  children,
  onClick,
  interactive = false,
  style = {},
  className = '',
  ...props
}) => {
  const cardClassName = `glass-panel ${interactive ? 'glass-panel-interactive' : ''} ${className}`;

  return (
    <div
      onClick={onClick}
      className={cardClassName}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: '1.5rem',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
