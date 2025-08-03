
import React from 'react';

interface DurationSelectorProps {
    options: number[];
    selectedValue: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    icon?: React.ReactNode;
}

const DurationSelector: React.FC<DurationSelectorProps> = ({ options, selectedValue, onChange, disabled = false, icon }) => {
    
    const handleSelect = (option: number) => {
        if (disabled) return;
        onChange(option);
    };

    return (
        <fieldset className={`space-y-3 ${disabled ? 'opacity-50' : ''}`}>
            <legend className="text-lg font-semibold text-light-text-primary dark:text-dark-text flex items-center">
                {icon}
                <span className={icon ? "ml-2" : ""}>Duration Seconds</span>
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {options.map((option) => {
                    const isSelected = selectedValue === option;
                    const inputId = `duration-sec-${option}`;
                    return (
                        <div key={option}>
                            <input
                                type="radio"
                                id={inputId}
                                name="duration-selector"
                                value={option}
                                checked={isSelected}
                                onChange={() => handleSelect(option)}
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
                                    <svg className={`w-3 h-3 text-white transition-opacity opacity-0 ${isSelected ? 'opacity-100' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <span className="ml-2 capitalize">
                                    {option} Seconds
                                </span>
                            </label>
                        </div>
                    );
                })}
            </div>
        </fieldset>
    );
};

export default DurationSelector;
