import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Copy, Check, CopyIcon } from 'lucide-react';

/**
 * Click-to-copy button with confirmation state
 */
const CopyButton = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <div className="flex items-center gap-2 group">
      {label && <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</span>}
      <button 
        onClick={handleCopy}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
          copied 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600'
        }`}
      >
        {copied ? <Check size={14} className="animate-in zoom-in duration-300" /> : <Copy size={14} className="group-hover:scale-110 transition-transform" />}
        {copied ? 'Copied!' : text.length > 20 ? `${text.slice(0, 10)}...${text.slice(-4)}` : text}
      </button>
    </div>
  );
};

CopyButton.propTypes = {
  text: PropTypes.string.isRequired,
  label: PropTypes.string
};

export default CopyButton;
