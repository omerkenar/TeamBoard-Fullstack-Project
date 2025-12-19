import { defineStore } from "pinia";
import {
  login as loginApi,
  logout as logoutApi,
  me as meApi,
  register as registerApi,
} from "@/services/auth";
import { clearTokens, getStoredTokens, setTokens } from "@/services/api-client";
import type {
  LoginPayload,
  RegisterPayload,
  TokenPair,
  User,
} from "@/types/api";

type AuthState = {
  access: string;
  refresh: string;
  user: User | null;
  username: string;
  loading: boolean;
  error: string | null;
};

const USERNAME_KEY = "teamboard_username";

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => {
    const tokens = getStoredTokens();
    const storedUsername = localStorage.getItem(USERNAME_KEY) ?? "";
    return {
      access: tokens.access,
      refresh: tokens.refresh,
      user: null,
      username: storedUsername,
      loading: false,
      error: null,
    };
  },
  getters: {
    isAuthenticated(state): boolean {
      return Boolean(state.access);
    },
    displayName(state): string {
      return (
        `${state.user?.first_name ?? ""} ${
          state.user?.last_name ?? ""
        }`.trim() ||
        state.username ||
        "Kullanıcı"
      );
    },
  },
  actions: {
    setSession(tokens: TokenPair) {
      this.access = tokens.access;
      this.refresh = tokens.refresh;
      setTokens(tokens);
    },
    setUsername(username: string) {
      this.username = username;
      localStorage.setItem(USERNAME_KEY, username);
    },
    async loadMe() {
      if (!this.isAuthenticated) return false;
      try {
        const me = (await meApi()) as unknown as User | null;
        if (me && typeof me === "object" && "username" in me) {
          this.user = me;
          this.setUsername(me.username);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    async login(payload: LoginPayload) {
      this.loading = true;
      this.error = null;
      try {
        const tokens = await loginApi(payload);
        this.setSession(tokens);
        this.setUsername(payload.username);
        await this.loadMe();
        return true;
      } catch (error: any) {
        this.error = error.message || "Giriş başarısız";
        return false;
      } finally {
        this.loading = false;
      }
    },
    async register(payload: RegisterPayload) {
      this.loading = true;
      this.error = null;
      try {
        await registerApi(payload);
        const tokens = await loginApi({
          username: payload.username,
          password: payload.password,
        });
        this.setSession(tokens);
        this.setUsername(payload.username);
        await this.loadMe();
        return true;
      } catch (error: any) {
        this.error = error.message || "Kayıt başarısız";
        return false;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      logoutApi();
      clearTokens();
      this.access = "";
      this.refresh = "";
      this.user = null;
      this.username = "";
      localStorage.removeItem(USERNAME_KEY);
      this.error = null;
    },
  },
});
