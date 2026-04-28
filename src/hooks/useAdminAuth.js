import { useSelector, useDispatch } from 'react-redux';
import { logoutAdmin } from '../store/slices/authSlice';

/**
 * Access authenticated administrator state
 */
export function useAdminAuth() {
  const dispatch = useDispatch();
  const { admin, isAuthenticated, isLoading } = useSelector((state) => state.auth);

  const logout = () => {
    dispatch(logoutAdmin());
  };

  return { 
    admin, 
    isAuthenticated, 
    isLoading,
    logout,
    isAdmin: admin?.role === 'ADMIN'
  };
}

export default useAdminAuth;
