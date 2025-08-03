
import React, { useState, useEffect } from 'react';
import { ApiSettings, ApiKeyConfig } from '../types';
import ToggleSwitch from './ToggleSwitch';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ApiSettings;
  onSave: (settings: ApiSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<ApiSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleToggle = (id: ApiKeyConfig['id'], enabled: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      [id]: { ...prev[id], enabled }
    }));
  };

  const handleKeyChange = (id: ApiKeyConfig['id'], key: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [id]: { ...prev[id], key }
    }));
  };

  const handleSaveAndClose = () => {
    onSave(localSettings);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div 
        className="bg-light-secondary dark:bg-dark-secondary w-full max-w-md rounded-2xl shadow-2xl border border-light-accent/30 dark:border-dark-accent/30 p-6 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settings-modal-title" className="text-2xl font-bold text-light-text-primary dark:text-dark-text">API Setting</h2>

        <div className="space-y-4">
          {(Object.values(localSettings) as ApiKeyConfig[]).map(({ id, label, key, enabled }) => (
            <div key={id} className="p-4 rounded-lg bg-light-surface/60 dark:bg-dark-primary/60">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor={`key-input-${id}`} className="font-semibold text-light-text-primary dark:text-dark-text">{label}</label>
                <ToggleSwitch 
                  id={`toggle-${id}`}
                  enabled={enabled} 
                  onChange={(val) => handleToggle(id, val)} 
                  disabled={id === 'default' && !process.env.API_KEY}
                />
              </div>
              <input
                id={`key-input-${id}`}
                type="password"
                placeholder={id === 'default' ? 'Using pre-configured key' : 'Enter your API key'}
                value={key}
                onChange={(e) => handleKeyChange(id, e.target.value)}
                disabled={id === 'default'}
                className="w-full p-2 bg-light-surface dark:bg-dark-surface rounded-md border-2 border-transparent focus:border-brand-blue/50 focus:ring-brand-blue/50 transition-all text-light-text-primary dark:text-dark-text placeholder:text-light-text-secondary dark:placeholder:text-dark-accent disabled:bg-light-accent/40 dark:disabled:bg-dark-surface/50 disabled:cursor-not-allowed"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveAndClose}
          className="w-full bg-brand-blue hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
