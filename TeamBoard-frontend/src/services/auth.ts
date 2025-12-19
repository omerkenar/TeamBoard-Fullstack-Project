import { apiRequest, clearTokens, setTokens } from "./api-client";
import type { LoginPayload, RegisterPayload, TokenPair } from "@/types/api";

export const login = async (payload: LoginPayload) => {
  const tokens = await apiRequest<TokenPair>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });
  console.log("Received tokens:", tokens);
  setTokens(tokens);
  return tokens;
};

export const logout = () => {
  clearTokens();
};

export const register = async (payload: RegisterPayload) => {
  return apiRequest("/api/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });
};

export const me = async () => {
  return apiRequest("/api/auth/me/");
};
