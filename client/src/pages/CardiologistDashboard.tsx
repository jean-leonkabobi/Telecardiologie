import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Activity,
} from 'lucide-react';

export default function CardiologistDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const stats = [
    {
      label: 'Urgentes',
      value: '2',
      icon: AlertCircle,
      color: 'text-red-600',
    },
    {
      label: 'En attente',
      value: '8',
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      label: 'En cours',
      value: '3',
      icon: Activity,
      color: 'text-blue-600',
    },
    {
      label: 'Validées aujourd\'hui',
      value: '12',
      icon: CheckCircle2,
      color: 'text-green-600',
    },
  ];

  const queue = [
    {
      id: 'REQ-002',
      patient: 'Marie Durand',
      age: '58 ans',
      symptoms: 'Douleur thoracique',
      priority: 'Urgente',
      time: '14:32',
      professional: 'Dr. Leclerc',
    },
    {
      id: 'REQ-004',
      patient: 'Sophie Martin',
      age: '45 ans',
      symptoms: 'Palpitations',
      priority: 'Urgente',
      time: '14:15',
      professional: 'Dr. Dupont',
    },
    {
      id: 'REQ-005',
      patient: 'Luc Moreau',
      age: '62 ans',
      symptoms: 'Essoufflement',
      priority: 'Normale',
      time: '13:45',
      professional: 'Dr. Bernard',
    },
    {
      id: 'REQ-006',
      patient: 'Anne Petit',
      age: '51 ans',
      symptoms: 'Fatigue',
      priority: 'Normale',
      time: '13:20',
      professional: 'Dr. Leclerc',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground mt-1">
              Bienvenue, Dr. {user?.name}
            </p>
          </div>
          <Button
            onClick={() => navigate('/availability')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Gérer disponibilité
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

        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              File d\'attente
            </h2>
            <span className="text-sm text-muted-foreground">
              Triée par urgence et chronologie
            </span>
          </div>

          <div className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/analyze/${item.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">
                        {item.id}
                      </span>
                      <Badge
                        variant={
                          item.priority === 'Urgente'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {item.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground font-medium">
                      {item.patient}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.age} • {item.symptoms}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {item.time}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.professional}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Examiner
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
