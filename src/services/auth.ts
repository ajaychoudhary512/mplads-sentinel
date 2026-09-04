export interface AuthUser {
  userId: string;
  role: string;
  token: string;
  name?: string;
  loginTime: string;
}

const AUTH_KEY = "mplad_auth_session";

export const authService = {
  getUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.userId) {
        return parsed as AuthUser;
      }
      return null;
    } catch {
      return null;
    }
  },

  setUser(user: AuthUser): void {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Failed to save auth session:", e);
    }
  },

  clearUser(): void {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (e) {
      console.error("Failed to clear auth session:", e);
    }
  },

  isAuthenticated(): boolean {
    return this.getUser() !== null;
  }
};
