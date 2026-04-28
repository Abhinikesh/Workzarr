import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTheme } from '../store/slices/uiSlice';

/**
 * Manage system appearance (dark/light)
 */
export function useTheme() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);

  const toggleTheme = () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return { theme, toggleTheme };
}

export default useTheme;
