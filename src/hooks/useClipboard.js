import { useState, useCallback } from 'react';

/**
 * Handle clipboard operations with feedback
 */
export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text) => {
    if (!navigator.clipboard) return false;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (err) {
      console.error('Failed to copy: ', err);
      return false;
    }
  }, []);

  return { copy, copied };
}

export default useClipboard;
