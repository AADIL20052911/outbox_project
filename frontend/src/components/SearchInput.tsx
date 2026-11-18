import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search recipient, subject, sender...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center w-full max-w-sm ${className}`}>
      <Search className="absolute left-3 w-4 h-4 text-text-secondary pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-sm bg-surface text-text-primary border border-border rounded-ten outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-smooth placeholder:text-text-tertiary hover:border-text-tertiary"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-surface-muted transition-smooth"
          title="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
