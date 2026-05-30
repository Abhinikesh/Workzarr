import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null, // User account data
  provider: null, // Complete provider professional profile data
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, provider, accessToken, refreshToken } = action.payload;
      state.user = user || state.user;
      state.provider = provider || state.provider;
      state.accessToken = accessToken || state.accessToken;
      state.refreshToken = refreshToken || state.refreshToken;
      state.isAuthenticated = true;

      if (accessToken) {
        localStorage.setItem('providerToken', accessToken);
      }
    },
    updateProviderProfile: (state, action) => {
      state.provider = { ...state.provider, ...action.payload };
    },
    logout: (state) => {
      state.user = null;
      state.provider = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('providerToken');
    },
  },
});

export const { setCredentials, updateProviderProfile, logout } = authSlice.actions;
export default authSlice.reducer;
