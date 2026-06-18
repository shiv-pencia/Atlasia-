import React from 'react';

export const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  style = {},
  ...props
}) => {
  return (
    <div className="form-group" style={style}>
      {label && <label className="form-label">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="form-input"
        style={{
          borderColor: error ? 'hsl(var(--color-danger))' : 'var(--border-color)'
        }}
        {...props}
      />
      {error && (
        <span style={{
          color: 'hsl(var(--color-danger))',
          fontSize: '0.75rem',
          marginTop: '0.25rem'
        }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
