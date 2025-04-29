import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { logAPI } from '../services/LogService';
import settingsReducer from './settingsSlice';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const settingsPersistConfig = {
  key: 'settings',
  storage,
  whitelist: ['refreshInterval', 'darkMode', 'logRetentionDays', 'defaultView'],
};

const persistedSettingsReducer = persistReducer(settingsPersistConfig, settingsReducer);

const rootReducer = combineReducers({
    [logAPI.reducerPath]: logAPI.reducer,
    settings: persistedSettingsReducer
});

export const setupStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(logAPI.middleware),
  });
};

export const store = setupStore();
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];