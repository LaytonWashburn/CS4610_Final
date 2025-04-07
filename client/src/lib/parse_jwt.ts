import { jwtDecode } from "jwt-decode";

export const parseJwt = (token: string | null) => {
  if (!token) return {};
  return jwtDecode(token);
};