import { useState } from 'react';
import styles from './InlineEditInput.module.scss';

export interface InlineEditInputProps {
  value?: string;
  placeholder: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  onClick?: (e: React.MouseEvent) => void;
  autoFocus?: boolean;
  indent?: boolean;
}

export function InlineEditInput({
  value = '',
  placeholder,
  onSubmit,
  onCancel,
  onClick,
  autoFocus = false,
  indent = false,
}: InlineEditInputProps): React.ReactElement {
  const [inputValue, setInputValue] = useState(value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit(inputValue);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      type="text"
      className={[styles.inlineInput, indent && styles.indented].filter(Boolean).join(' ')}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSubmit(inputValue)}
      onClick={onClick}
      placeholder={placeholder}
      autoFocus={autoFocus}
      spellCheck={false}
      autoComplete="off"
    />
  );
}
