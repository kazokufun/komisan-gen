
import React from 'react';

interface ToggleSwitchProps {
    id: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, enabled, onChange, disabled = false }) => {
    return (
        <button
            id={id}
            onClick={() => !disabled && onChange(!enabled)}
            className={`${
                enabled ? 'bg-brand-blue' : 'bg-light-accent dark:bg-dark-surface'
            } relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 dark:focus:ring-offset-dark-secondary ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            role="switch"
            aria-checked={enabled}
            disabled={disabled}
        >
            <span
                aria-hidden="true"
                className={`${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    );
};

export default ToggleSwitch;
