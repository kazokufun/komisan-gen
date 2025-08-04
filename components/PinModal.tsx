
import React, { useState } from 'react';

interface PinModalProps {
  onVerify: (pin: string) => boolean;
}

const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-4h2v-2h2v-2l1.257-1.257A6 6 0 0117 7z" />
    </svg>
);


const PinModal: React.FC<PinModalProps> = ({ onVerify }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and limit to 6 digits
    if (/^\d*$/.test(value) && value.length <= 6) {
      setPin(value);
      setError(''); // Clear error on new input
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onVerify(pin)) {
      // Success, modal will be unmounted by parent
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
      // Trigger shake animation
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
    >
        <style>{`
            .shake {
                animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                transform: translate3d(0, 0, 0);
            }
            @keyframes shake {
                10%, 90% { transform: translate3d(-1px, 0, 0); }
                20%, 80% { transform: translate3d(2px, 0, 0); }
                30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                40%, 60% { transform: translate3d(4px, 0, 0); }
            }
        `}</style>
      <div 
        className={`bg-light-secondary dark:bg-dark-secondary w-full max-w-sm rounded-2xl shadow-2xl border border-light-accent/30 dark:border-dark-accent/30 p-8 flex flex-col gap-6 items-center ${shake ? 'shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <KeyIcon />
        <h2 id="pin-modal-title" className="text-2xl font-bold text-light-text-primary dark:text-dark-text">Enter PIN to Continue</h2>
        <p className="text-center text-light-text-secondary dark:text-dark-accent -mt-4">Please enter the access PIN to use the application.</p>
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
            <input
                type="password"
                placeholder="******"
                value={pin}
                onChange={handlePinChange}
                autoFocus
                className="w-full max-w-xs p-4 text-center text-2xl tracking-[1rem] bg-light-surface dark:bg-dark-surface rounded-md border-2 border-light-accent dark:border-dark-surface focus:border-brand-blue/50 focus:ring-brand-blue/50 transition-all text-light-text-primary dark:text-dark-text placeholder:text-light-text-secondary dark:placeholder:text-dark-accent"
            />
             {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <button
              type="submit"
              className="w-full max-w-xs mt-4 bg-brand-blue hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
              disabled={pin.length < 6}
            >
              Unlock
            </button>
        </form>
      </div>
    </div>
  );
};

export default PinModal;
