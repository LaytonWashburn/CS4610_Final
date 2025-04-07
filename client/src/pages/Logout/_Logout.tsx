import { useEffect } from "react";
import { requireLogin } from "../../lib/hooks/require_login"
import { useDispatch } from "react-redux";
import { setAuthToken } from "../../store/application_slice";

export const Logout = () => {
  requireLogin();
  const dispatch = useDispatch();

  function logout() {
    dispatch(setAuthToken(null));
  }

  useEffect(() => {
    logout();
  }, []);

  return null;
}