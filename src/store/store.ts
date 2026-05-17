import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import authReducer, { logout } from '../features/auth/authSlice';

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: logout,
  effect: async (_action, api) => {
    api.dispatch(apiSlice.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
