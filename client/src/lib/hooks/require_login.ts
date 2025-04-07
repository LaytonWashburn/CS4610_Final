import { useEffect } from "react";
import { useSelector } from "react-redux"
import { useNavigate } from "react-router";
import { RootState } from "../../store/store";

export const requireLogin = () => {
  const authToken = useSelector((store: RootState) => store.application.authToken);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authToken) {
      navigate("/", {
        replace: true
      })
    }
  }, [authToken])
}