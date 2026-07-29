import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/fr';

import { useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme';


import NotFound from '@/pages/NotFound';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import HealthcareProfessionalDashboard from './pages/HealthcareProfessionalDashboard';
import CardiologistDashboard from './pages/CardiologistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewECGRequest from './pages/NewECGRequest';
import ECGAnalysis from './pages/ECGAnalysis';
import RequestDetail from './pages/RequestDetail';
import MyRequests from './pages/MyRequests';
import NotificationsPage from './pages/NotificationsPage';
import Availability from './pages/Availability';
import CardiologyHistory from './pages/CardiologyHistory';
import CardiolQueue from './pages/CardiolQueue';
import AdminUsers from './pages/AdminUsers';
import AdminRequests from './pages/AdminRequests';
import AdminStatistics from './pages/AdminStatistics';
import AdminAudit from './pages/AdminAudit';

/**
 * Cache des données serveur.
 *
 * `retry: 1` plutôt que la valeur par défaut (3) : réessayer trois fois une
 * requête refusée pour cause de droits ne fait qu'allonger l'attente avant
 * d'afficher l'erreur.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/** Écran d'attente pendant la reprise de session au chargement de la page. */
function FullPageLoader() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress aria-label="Chargement" />
    </Box>
  );
}

/**
 * Garde d'accès.
 *
 * La redirection se fait dans un effet, jamais pendant le rendu : déclencher
 * une navigation en phase de rendu est un effet de bord que React ne garantit
 * pas (c'était le défaut de la version précédente).
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  if (isInitializing) return <FullPageLoader />;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}

function Router() {
  const { user, isAuthenticated, isInitializing } = useAuth();

  // Sans cette attente, un rechargement sur une page protégée renverrait
  // brièvement vers /login alors que la session est encore valide.
  if (isInitializing) return <FullPageLoader />;

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      {/* Lien reçu par email pour activer un compte : même parcours. */}
      <Route path="/reset-password" component={ForgotPassword} />

      <Route path="/dashboard">
        <ProtectedRoute>
          {user?.role === "healthcare_professional" ? (
            <HealthcareProfessionalDashboard />
          ) : user?.role === "cardiologist" ? (
            <CardiologistDashboard />
          ) : (
            <AdminDashboard />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute>
          {user?.role === "admin" ? (
            <AdminDashboard />
          ) : (
            <NotFound />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/new-request">
        <ProtectedRoute>
          {user?.role === "healthcare_professional" ? (
            <NewECGRequest />
          ) : (
            <NotFound />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/analyze/:id">
        <ProtectedRoute>
          {user?.role === "cardiologist" ? (
            <ECGAnalysis />
          ) : (
            <NotFound />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/request/:id">
        <ProtectedRoute>
          {user?.role === "healthcare_professional" ? (
            <RequestDetail />
          ) : (
            <NotFound />
          )}
        </ProtectedRoute>
      </Route>

      {/* Healthcare Professional Routes */}
      <Route path="/my-requests">
        <ProtectedRoute>
          {user?.role === "healthcare_professional" ? (
            <MyRequests />
          ) : (
            <NotFound />
          )}
        </ProtectedRoute>
      </Route>

      {/* Tous les rôles reçoivent des notifications : le cardiologue est
          prévenu des urgences, l'administrateur consulte les siennes. */}
      <Route path="/notifications">
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      </Route>

      {/* Cardiologist Routes */}
      <Route path="/queue">
        <ProtectedRoute>
          {user?.role === "cardiologist" ? (
            <CardiolQueue />
          ) : (
            <NotFound />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/availability">
        <ProtectedRoute>
          {user?.role === "cardiologist" ? (
            <Availability />
          ) : (
            <NotFound />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/history">
        <ProtectedRoute>
          {user?.role === "cardiologist" ? (
            <CardiologyHistory />
          ) : (
            <NotFound />
          )}
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/users">
        <ProtectedRoute>
          {user?.role === "admin" ? (
            <AdminUsers />
          ) : (
            <NotFound />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/admin/requests">
        <ProtectedRoute>
          {user?.role === "admin" ? (
            <AdminRequests />
          ) : (
            <NotFound />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/admin/statistics">
        <ProtectedRoute>
          {user?.role === "admin" ? (
            <AdminStatistics />
          ) : (
            <NotFound />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/admin/audit">
        <ProtectedRoute>
          {user?.role === "admin" ? (
            <AdminAudit />
          ) : (
            <NotFound />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/">
        {isAuthenticated ? (
          <ProtectedRoute>
            {user?.role === "healthcare_professional" ? (
              <HealthcareProfessionalDashboard />
            ) : user?.role === "cardiologist" ? (
              <CardiologistDashboard />
            ) : (
              <AdminDashboard />
            )}
          </ProtectedRoute>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      {/* Le script anti-flash vit dans client/index.html : <InitColorSchemeScript />
          ne rend rien hors rendu serveur, donc il serait sans effet ici. */}
      <ThemeProvider theme={theme} defaultMode="light">
        <CssBaseline enableColorScheme />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </QueryClientProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
