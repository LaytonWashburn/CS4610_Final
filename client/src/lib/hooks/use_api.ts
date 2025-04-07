import { useContext } from 'react';
import { ApiContext } from '../api_context';
import { Api } from '../api';

export const useApi = () => {
  const api = useContext(ApiContext);
  return api as Api;
};
