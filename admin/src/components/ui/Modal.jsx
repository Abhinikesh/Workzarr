import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

/**
 * Reusable professional Modal component
 * @param {Object} props
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  size = 'md', 
  children, 
  footer, 
  closeOnOverlayClick = true 
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-[95vw] h-[95vh]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => closeOnOverlayClick && onClose()}
      />
      
      {/* Modal Container */}
      <div 
        ref={modalRef}
        className={`relative bg-white dark:bg-slate-800 w-full ${sizes[size]} rounded-[32px] shadow-2xl shadow-slate-900/50 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 id="modal-title" className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs font-medium text-slate-500 mt-1">{description}</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  closeOnOverlayClick: PropTypes.bool
};

export default Modal;
