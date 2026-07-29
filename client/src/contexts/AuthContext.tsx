import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setAccessToken, setSessionExpiredHandler } from '@/lib/apiClient';
import { notify } from '@/lib/alerts';

export type UserRole = 'healthcare_professional' | 'cardiologist' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  status: 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLoginAt: string | null;
  createdAt: string;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  expiresAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** Vrai pendant la restauration de session au chargement de la page. */
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * État d'authentification, adossé à l'API.
 *
 * Le rôle n'est plus choisi par l'utilisateur au moment de la connexion : il
 * est porté par le compte et renvoyé par le serveur. C'est indispensable, sinon
 * n'importe qui pourrait se déclarer administrateur.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Au chargement, on tente de reprendre la session : le cookie de
  // rafraîchissement survit au rechargement, l'access token (en mémoire) non.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await api.post<LoginResponse>('/auth/refresh', undefined, {
          skipRefresh: true,
        });
        if (cancelled) return;
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        // Aucune session valide : l'utilisateur devra se connecter.
        if (!cancelled) setAccessToken(null);
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Une session expirée en cours d'usage doit ramener à l'écran de connexion.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      notify.warning('Session expirée', 'Veuillez vous reconnecter.');
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const data = await api.post<LoginResponse>('/auth/login', { email, password }, {
      skipRefresh: true,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Même si l'appel échoue, la session locale doit être abandonnée.
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({ user, isAuthenticated: user !== null, isInitializing, login, logout }),
    [user, isInitializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>");
  }
  return context;
}
