import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../lib/axios';

/**
 * Admin login
 * POST /api/v1/auth/admin/login
 * Response shape: { success, message, data: { accessToken, user } }
 */
export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/auth/admin/login', credentials);
      // Persist token to localStorage for page-refresh survival
      localStorage.setItem('adminToken', response.data.data.accessToken);
      if (response.data.data.refreshToken) {
        localStorage.setItem('adminRefreshToken', response.data.data.refreshToken);
      }
      return response.data;
    } catch (error) {
      // Show specific message from backend, or friendly fallback
      const message =
        error.response?.data?.message ||
        (error.response?.status === 401 ? 'Invalid email or password' : 'Login failed. Please try again.');
      return rejectWithValue(message);
    }
  }
);

/**
 * Admin logout
 * POST /api/v1/auth/logout
 */
export const logoutAdmin = createAsyncThunk(
  'auth/logoutAdmin',
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (_err) {
      // Swallow errors — we always clear local state
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
    }
    return true;
  }
);

// Rehydrate from localStorage on app load (survives page refresh)
const persistedToken = localStorage.getItem('adminToken');
const persistedRefreshToken = localStorage.getItem('adminRefreshToken');

const initialState = {
  admin: null,
  accessToken: persistedToken || null,
  refreshToken: persistedRefreshToken || null,
  isAuthenticated: !!persistedToken,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.admin = action.payload.admin;
      state.accessToken = action.payload.accessToken || action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      const tokenToSave = action.payload.accessToken || action.payload.token;
      if (tokenToSave) {
        localStorage.setItem('adminToken', tokenToSave);
      }
      if (action.payload.refreshToken) {
        localStorage.setItem('adminRefreshToken', action.payload.refreshToken);
      }
    },
    logout: (state) => {
      state.admin = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
    },
    clearError: (state) => {
      state.error = null;
    },
    updateAdmin: (state, action) => {
      state.admin = { ...state.admin, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // ── loginAdmin ────────────────────────────────────────────────────────
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        // Backend returns: { data: { accessToken, refreshToken, user } }
        state.admin = action.payload.data.user;
        state.accessToken = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken || null;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // ── logoutAdmin ───────────────────────────────────────────────────────
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.admin = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { setCredentials, logout, clearError, updateAdmin } = authSlice.actions;
export default authSlice.reducer;
