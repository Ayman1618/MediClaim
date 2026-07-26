/**
 * Auth context — provides the authenticated user and auth actions
 * to all components in the tree without prop drilling.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { authService } from '@/services/authService';
import type { User, LoginCredentials } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    if (authService.isAuthenticated()) {
      authService
        .getMe()
        .then(setUser)
        .catch(() => {
          // Token may be expired — clear it
          authService.logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    const response = await authService.login(credentials);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context. Throws if used outside AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
