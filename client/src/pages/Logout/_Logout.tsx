import { useEffect } from "react";
import { requireLogin } from "../../lib/hooks/require_login"
import { useDispatch } from "react-redux";
import { setAuthToken } from "../../store/application_slice";
import { socket } from "../../socket";
import { jwtDecode } from "jwt-decode";

export const Logout = () => {
  requireLogin();
  const dispatch = useDispatch();

  function logout() {
    const authToken = localStorage.getItem("authToken");  // Get the stored JWT token

    if (authToken) {
      // Decode the token to get the current user's ID
      const decoded = jwtDecode(authToken);
      const userId = (decoded as any).userId;  // Extract the user ID from the decoded token

      // If socket exists, emit tutor-offline with the current user's ID
      if (socket && userId) {
        socket.emit("tutor-offline", { userId });
        socket.disconnect();  // Disconnect the socket
      }
    }
    dispatch(setAuthToken(null));
  }

  useEffect(() => {
    logout();
  }, []);

  return null;
}