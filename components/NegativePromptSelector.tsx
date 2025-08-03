import React from 'react';

interface NegativePromptSelectorProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    disabled?: boolean;
    icon?: React.ReactNode;
}

const NegativePromptSelector: React.FC<NegativePromptSelectorProps> = ({ options, selected, onChange, disabled = false, icon }) => {
    
    const handleToggle = (option: string) => {
        if (disabled) return;
        const newSelected = selected.includes(option)
            ? selected.filter(item => item !== option)
            : [...selected, option];
        onChange(newSelected);
    };

    return (
        <fieldset className={`space-y-3 ${disabled ? 'opacity-50' : ''}`}>
            <legend className="text-lg font-semibold text-light-text-primary dark:text-dark-text flex items-center">
                {icon}
                <span className={icon ? "ml-2" : ""}>Negative Prompt</span>
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {options.map((option) => {
                    const inputId = `neg-prompt-${option.replace(/\s+/g, '-')}`;
                    return (
                        <div key={option}>
                            <input
                                type="checkbox"
                                id={inputId}
                                checked={selected.includes(option)}
                                onChange={() => handleToggle(option)}
                                disabled={disabled}
                                className="hidden peer"
                            />
                            <label
                                htmlFor={inputId}
                                className={`
                                    flex items-center p-2 rounded-lg transition-all duration-200 
                                    border-2 border-transparent
                                    text-light-text-secondary dark:text-dark-text 
                                    select-none text-sm
                                    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-light-surface/70 dark:hover:bg-dark-surface/50'}
                                    peer-checked:text-brand-blue peer-checked:dark:text-brand-blue
                                    peer-checked:font-semibold
                                    peer-checked:bg-brand-blue/10 dark:peer-checked:bg-brand-blue/20
                                    peer-checked:border-brand-blue/30
                                `}
                            >
                                <span className="flex-shrink-0 w-5 h-5 rounded-md border-2
                                    bg-light-surface dark:bg-dark-surface
                                    border-light-accent dark:border-dark-accent
                                    transition-all duration-200
                                    peer-checked:bg-brand-blue peer-checked:border-brand-blue
                                    flex items-center justify-center
                                ">
                                    <svg className="w-3 h-3 text-white transition-opacity opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <span className="ml-2 capitalize">
                                    {option}
                                </span>
                            </label>
                        </div>
                    );
                })}
            </div>
        </fieldset>
    );
};

export default NegativePromptSelector;
