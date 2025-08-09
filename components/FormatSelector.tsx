import React from 'react';
import type { PromptFormat } from '../types';
import JsonIcon from './icons/JsonIcon'; 
import DescriptionIcon from './icons/DescriptionIcon';

interface FormatSelectorProps {
    selectedValue: PromptFormat;
    onChange: (value: PromptFormat) => void;
    disabled?: boolean;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ selectedValue, onChange, disabled }) => {
    return (
        <div>
            <label className="text-lg font-semibold text-light-text-primary dark:text-dark-text mb-2 block">
                Output Format
            </label>
            <div className={`bg-light-surface/60 dark:bg-dark-primary/60 rounded-lg p-1 flex ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {(['JSON', 'Description'] as PromptFormat[]).map(format => (
                    <button
                        key={format}
                        type="button"
                        onClick={() => !disabled && onChange(format)}
                        disabled={disabled}
                        className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${selectedValue === format ? 'bg-light-secondary dark:bg-dark-surface shadow-md text-brand-blue dark:text-brand-blue' : 'text-light-text-secondary dark:text-dark-accent hover:bg-light-secondary/50 dark:hover:bg-dark-surface/50'}`}
                        aria-pressed={selectedValue === format}
                    >
                        {format === 'JSON' ? <JsonIcon /> : <DescriptionIcon />}
                        {format}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FormatSelector;
