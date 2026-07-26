import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Utilisateurs totaux',
      value: '156',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Professionnels actifs',
      value: '42',
      icon: Activity,
      color: 'text-green-600',
    },
    {
      label: 'Cardiologues actifs',
      value: '18',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      label: 'Demandes en attente',
      value: '23',
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      label: 'Analyses terminées',
      value: '1,247',
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    {
      label: 'Temps moyen',
      value: '2h 15m',
      icon: BarChart3,
      color: 'text-indigo-600',
    },
  ];

  const users = [
    {
      id: 1,
      name: 'Dr. Martin Leclerc',
      email: 'martin.leclerc@hospital.fr',
      role: 'Cardiologue',
      status: 'Actif',
      lastLogin: '2026-07-26 14:32',
    },
    {
      id: 2,
      name: 'Dr. Sophie Dupont',
      email: 'sophie.dupont@hospital.fr',
      role: 'Professionnel de santé',
      status: 'Actif',
      lastLogin: '2026-07-26 13:15',
    },
    {
      id: 3,
      name: 'Dr. Pierre Bernard',
      email: 'pierre.bernard@hospital.fr',
      role: 'Cardiologue',
      status: 'Inactif',
      lastLogin: '2026-07-25 09:45',
    },
    {
      id: 4,
      name: 'Infirmier Jean Moreau',
      email: 'jean.moreau@hospital.fr',
      role: 'Professionnel de santé',
      status: 'Actif',
      lastLogin: '2026-07-26 14:20',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord administrateur</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue, {user?.name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <Card className="p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Utilisateurs récents
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Nom
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Rôle
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Dernière connexion
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      {u.name}
                    </td>
                    <td className="py-3 px-4 text-foreground">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{u.role}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={u.status === 'Actif' ? 'default' : 'outline'}
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {u.lastLogin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
