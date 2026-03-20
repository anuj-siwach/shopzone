// client/src/store/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const savedUser = (() => {
  try { return JSON.parse(localStorage.getItem('sz_user')); }
  catch { return null; }
})();

export const loginUser = createAsyncThunk('user/login', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/auth/login', creds);
    localStorage.setItem('sz_token', data.token);
    localStorage.setItem('sz_user', JSON.stringify(data.user));
    return data.user;
  } catch (e) { return rejectWithValue(e.response?.data?.msg || 'Login failed'); }
});

export const fetchMe = createAsyncThunk('user/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/auth/me');
    localStorage.setItem('sz_user', JSON.stringify(data));
    return data;
  } catch (e) { return rejectWithValue(e.response?.data?.msg); }
});

const userSlice = createSlice({
  name: 'user',
  initialState: { user: savedUser, loading: false, error: null },
  reducers: {
    logout(state) {
      state.user = null;
      localStorage.removeItem('sz_token');
      localStorage.removeItem('sz_user');
    },
    setUser(state, { payload }) { state.user = payload; },
    clearError(state) { state.error = null; },
  },
  extraReducers: b => {
    b.addCase(loginUser.pending,   s => { s.loading = true; s.error = null; })
     .addCase(loginUser.fulfilled, (s, { payload }) => { s.loading = false; s.user = payload; })
     .addCase(loginUser.rejected,  (s, { payload }) => { s.loading = false; s.error = payload; })
     .addCase(fetchMe.fulfilled,   (s, { payload }) => { s.user = payload; });
  },
});

export const { logout, setUser, clearError } = userSlice.actions;
export const selectUser    = s => s.user.user;
export const selectIsAdmin = s => s.user.user?.role === 'admin';
export default userSlice.reducer;
