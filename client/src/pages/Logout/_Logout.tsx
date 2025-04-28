import { useEffect, useState } from "react";
import { requireLogin } from "../../lib/hooks/require_login"
import { useDispatch } from "react-redux";
import { setAuthToken } from "../../store/application_slice";
import { useSocket } from "../../hooks/useSocket";
import { jwtDecode } from "jwt-decode";

export const Logout = () => {
  requireLogin();
  const dispatch = useDispatch();
  const [isSocketReady, setIsSocketReady] = useState(false);
  const { socket, emit, connected } = useSocket();

  useEffect(() => {
    console.log('Socket connection status:', connected);
    if (connected) {
      console.log('Socket is connected, setting ready');
      setIsSocketReady(true);
    }
  }, [connected]);

  function logout() {
    console.log('Starting logout process');
    const authToken = localStorage.getItem("authToken");  // Get the stored JWT token

    if (authToken) {
      // Decode the token to get the current user's ID
      const decoded = jwtDecode(authToken);
      const userId = (decoded as any).userId;  // Extract the user ID from the decoded token
      const isTutor = (decoded as any).isTutor;

      console.log('User info:', { userId, isTutor, isSocketReady });

      // If user is a tutor and socket is ready, emit tutor-offline
      if (userId && isTutor && isSocketReady) {
        console.log("Setting tutor offline");
        emit("tutor-status", {
          userId,
          action: 'offline'
        });
      } else {
        console.log('Cannot set tutor offline:', { 
          hasUserId: !!userId, 
          isTutor, 
          isSocketReady 
        });
      }
    }
    dispatch(setAuthToken(null));
  }

  useEffect(() => {
    console.log('Checking if socket is ready:', isSocketReady);
    if (isSocketReady) {
      logout();
    }
  }, [isSocketReady]);

  return null;
}