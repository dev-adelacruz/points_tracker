export type UserRole = "admin" | "emcee" | "host";

interface UserState {
  isSignedIn: boolean;
  token: string | null;
  user: {
    id: number | null;
    email: string | null;
    role: UserRole | null;
  } | null;
  isLoading: boolean;
  error: string | null;
}
