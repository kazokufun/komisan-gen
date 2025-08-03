import React from 'react';
import { RadioOption } from '../types';

interface DropdownProps {
  legend: string;
  options: RadioOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ legend, options, selectedValue, onChange, icon, disabled = false }) => {
  const selectId = `dropdown-${legend.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <label htmlFor={selectId} className="text-lg font-semibold text-light-text-primary dark:text-dark-text mb-2 flex items-center">
        {icon}
        <span className="ml-2">{legend}</span>
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={selectedValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full p-3 bg-light-surface/80 dark:bg-dark-surface rounded-lg border-2 border-transparent focus:border-brand-blue/50 focus:ring-brand-blue/50 transition-all appearance-none cursor-pointer text-light-text-primary dark:text-dark-text disabled:cursor-not-allowed"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id} className="bg-light-secondary dark:bg-dark-secondary text-light-text-primary dark:text-dark-text text-base">
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-light-text-secondary dark:text-dark-accent">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Dropdown;