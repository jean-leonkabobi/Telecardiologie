import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import HealthcareProfessionalDashboard from "./pages/HealthcareProfessionalDashboard";
import CardiologistDashboard from "./pages/CardiologistDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NewECGRequest from "./pages/NewECGRequest";
import ECGAnalysis from "./pages/ECGAnalysis";
import RequestDetail from "./pages/RequestDetail";
import MyRequests from "./pages/MyRequests";
import NotificationsPage from "./pages/NotificationsPage";
import Availability from "./pages/Availability";
import CardiologyHistory from "./pages/Cardiology History";
import CardiolQueue from "./pages/CardiolQueue";
import AdminUsers from "./pages/AdminUsers";
import AdminStatistics from "./pages/AdminStatistics";
import AdminAudit from "./pages/AdminAudit";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return <>{children}</>;
}

function Router() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
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

      <Route path="/notifications">
        <ProtectedRoute>
          {user?.role === "healthcare_professional" ? (
            <NotificationsPage />
          ) : (
            <NotFound />
          )}
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
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
