export type AuthMode = "login" | "register" | "recover" | "verify" | "update";
export type AuthState = {
  status: "idle" | "error" | "sent" | "updated";
  message?: string;
  errors?: { email?: string; password?: string };
  email?: string;
};

export const initialAuthState: AuthState = { status: "idle" };
