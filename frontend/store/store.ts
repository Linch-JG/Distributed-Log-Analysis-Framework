import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { logAPI } from '../services/LogService';

const rootReducer = combineReducers({
    [logAPI.reducerPath]: logAPI.reducer,
});

export const setupStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(logAPI.middleware),
  });
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];