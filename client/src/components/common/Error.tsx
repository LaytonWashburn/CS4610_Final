import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearError } from '../../store/error_slice';
import styles from './Error.module.css';
import { RootState } from '../../store/store';

export const Error = () => {
  const dispatch = useDispatch();
  const errorMessage = useSelector((state: RootState) => state.error.errorMessage);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage, dispatch]);

  if (!errorMessage) return null;

  return (
    <div className={styles.toast}>
      {errorMessage}
    </div>
  );
};