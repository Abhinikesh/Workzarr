import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Confirmation dialog for destructive actions
 */
const ConfirmDialog = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title = 'Are you sure?', 
  description = 'This action cannot be undone. Please confirm.',
  confirmLabel = 'Confirm Action',
  variant = 'danger',
  requireConfirmationText = false
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
    setConfirmText('');
  };

  const isConfirmed = !requireConfirmationText || confirmText.toUpperCase() === 'DELETE';

  const footer = (
    <>
      <button 
        onClick={onCancel}
        disabled={isLoading}
        className="px-6 py-2.5 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-all"
      >
        Cancel
      </button>
      <button 
        disabled={!isConfirmed || isLoading}
        onClick={handleConfirm}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          variant === 'danger' ? 'bg-red-600 shadow-red-600/20 hover:bg-red-700' : 'bg-amber-500 shadow-amber-500/20 hover:bg-amber-600'
        }`}
      >
        {isLoading && <Loader2 size={16} className="animate-spin" />}
        {confirmLabel}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={footer}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
          variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
        }`}>
          <AlertTriangle size={32} />
        </div>
        <p className="text-slate-600 dark:text-slate-400 font-medium mb-6">
          {description}
        </p>

        {requireConfirmationText && (
          <div className="w-full text-left">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
              Type "DELETE" to confirm
            </label>
            <input 
              type="text" 
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-red-500 transition-all font-bold"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  confirmLabel: PropTypes.string,
  variant: PropTypes.oneOf(['danger', 'warning']),
  requireConfirmationText: PropTypes.bool
};

export default ConfirmDialog;
