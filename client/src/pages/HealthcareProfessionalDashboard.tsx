import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import {
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  FileText,
} from 'lucide-react';

export default function HealthcareProfessionalDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const stats = [
    {
      label: 'Demandes totales',
      value: '24',
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      label: 'En attente',
      value: '3',
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      label: 'En cours de validation',
      value: '5',
      icon: AlertCircle,
      color: 'text-orange-600',
    },
    {
      label: 'Terminées',
      value: '16',
      icon: CheckCircle2,
      color: 'text-green-600',
    },
  ];

  const recentRequests = [
    {
      id: 'REQ-001',
      patient: 'Jean Dupont',
      date: '2026-07-26',
      priority: 'Normale',
      status: 'Validée',
      cardiologist: 'Dr. Martin',
    },
    {
      id: 'REQ-002',
      patient: 'Marie Durand',
      date: '2026-07-25',
      priority: 'Urgente',
      status: 'En cours de validation',
      cardiologist: 'Dr. Leclerc',
    },
    {
      id: 'REQ-003',
      patient: 'Pierre Bernard',
      date: '2026-07-25',
      priority: 'Normale',
      status: 'En attente d\'analyse',
      cardiologist: '-',
    },
  ];

  const notifications = [
    {
      id: 1,
      type: 'validated',
      message: 'Résultat validé pour REQ-001',
      time: 'Il y a 2 heures',
    },
    {
      id: 2,
      type: 'processing',
      message: 'Analyse IA terminée pour REQ-002',
      time: 'Il y a 4 heures',
    },
    {
      id: 3,
      type: 'submitted',
      message: 'Votre demande REQ-003 a été reçue',
      time: 'Hier',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      'Validée': { variant: 'default', icon: '✓' },
      'En cours de validation': { variant: 'secondary', icon: '⟳' },
      'En attente d\'analyse': { variant: 'outline', icon: '⏱' },
    };
    const config = variants[status] || { variant: 'outline', icon: '?' };
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <span>{config.icon}</span>
        <span className="text-xs">{status}</span>
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground mt-1">
              Bienvenue, {user?.name}
            </p>
          </div>
          <Button
            onClick={() => navigate('/new-request')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle demande ECG
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="p-6 border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color} opacity-20`} />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Demandes récentes
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/my-requests')}
                  className="text-primary hover:bg-primary/10"
                >
                  Voir tout
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Référence
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Patient
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Priorité
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/request/${req.id}`)}
                      >
                        <td className="py-3 px-4 font-medium text-foreground">
                          {req.id}
                        </td>
                        <td className="py-3 px-4 text-foreground">{req.patient}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              req.priority === 'Urgente'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {req.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Notifications
                </h2>
              </div>

              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-border transition-colors cursor-pointer"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notif.time}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
