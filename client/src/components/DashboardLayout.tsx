import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <>{children}</>;
  }

  const navItems =
    user.role === 'healthcare_professional'
      ? [
          { label: 'Tableau de bord', href: '/dashboard' },
          { label: 'Nouvelles demandes', href: '/new-request' },
          { label: 'Mes demandes', href: '/my-requests' },
          { label: 'Notifications', href: '/notifications' },
        ]
      : user.role === 'cardiologist'
        ? [
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'File d\'attente', href: '/queue' },
            { label: 'Disponibilité', href: '/availability' },
            { label: 'Historique', href: '/history' },
          ]
        : [
            { label: 'Tableau de bord', href: '/admin' },
            { label: 'Utilisateurs', href: '/admin/users' },
            { label: 'Statistiques', href: '/admin/statistics' },
            { label: 'Audit', href: '/admin/audit' },
          ];

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/manus-storage/logo_c406f01f.png"
              alt="Logo"
              className="w-8 h-8"
            />
            {sidebarOpen && (
              <span className="font-bold text-sm text-sidebar-foreground hidden sm:inline">
                Télécardiologie
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="w-full text-left px-4 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              {sidebarOpen ? item.label : item.label.charAt(0)}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          {sidebarOpen && (
            <div className="text-xs">
              <p className="font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <p className="text-sidebar-foreground/60 truncate">
                {user.role === 'healthcare_professional'
                  ? 'Professionnel de santé'
                  : user.role === 'cardiologist'
                    ? 'Cardiologue'
                    : 'Administrateur'}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="ml-2">Déconnexion</span>}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
