import { createSlice } from '@reduxjs/toolkit';

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    alerts: [],
    unreadCount: 0,
  },
  reducers: {
    addAlert: (state, action) => {
      state.alerts.unshift(action.payload);
      state.unreadCount += 1;
    },
    markAllRead: (state) => {
      state.unreadCount = 0;
    },
    setAlerts: (state, action) => {
      state.alerts = action.payload;
    }
  },
});

export const { addAlert, markAllRead, setAlerts } = notificationsSlice.actions;
export default notificationsSlice.reducer;
