
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

export const useAuthToken = () => useSelector((state: RootState) => state.application.authToken);