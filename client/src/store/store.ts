import { configureStore } from '@reduxjs/toolkit'
import { applicationReducer } from './application_slice'
import { errorReducer } from './error_slice'

const store = configureStore({
  reducer: {
    application: applicationReducer,
    error: errorReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>
export default store;