import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SettingsState {
  refreshInterval: number;
  darkMode: boolean;
  defaultView: string;
}

const initialState: SettingsState = {
  refreshInterval: 30,
  darkMode: false,
  defaultView: 'dashboard'
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return { ...state, ...action.payload };
    },
    resetSettings: (state) => {
      return { ...initialState, darkMode: state.darkMode };
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    }
  }
});

export const { updateSettings, resetSettings, toggleDarkMode } = settingsSlice.actions;

export default settingsSlice.reducer; 