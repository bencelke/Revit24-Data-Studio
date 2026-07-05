export const USER_ROLES = ["admin", "collector", "reviewer"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface AppUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: AppUser;
  token: string;
}

export interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
