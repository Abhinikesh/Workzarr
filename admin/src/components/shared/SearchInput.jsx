import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Search, X, Loader2 } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';

/**
 * Debounced search input with loading indicator
 */
const SearchInput = ({ placeholder = 'Search...', onSearch, debounce = 300 }) => {
  const [value, setValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const debouncedValue = useDebounce(value, debounce);

  useEffect(() => {
    onSearch(debouncedValue);
    setIsTyping(false);
  }, [debouncedValue, onSearch]);

  const handleChange = (e) => {
    setValue(e.target.value);
    setIsTyping(true);
  };

  return (
    <div className="relative group min-w-[240px]">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium"
      />
      {value && (
        <button 
          onClick={() => setValue('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

SearchInput.propTypes = {
  placeholder: PropTypes.string,
  onSearch: PropTypes.func.isRequired,
  debounce: PropTypes.number
};

export default SearchInput;
