import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminStatistics() {
  const monthlyData = [
    { month: 'Jan', requests: 45, validated: 38, rejected: 7 },
    { month: 'Fév', requests: 52, validated: 44, rejected: 8 },
    { month: 'Mar', requests: 48, validated: 41, rejected: 7 },
    { month: 'Avr', requests: 61, validated: 52, rejected: 9 },
    { month: 'Mai', requests: 55, validated: 47, rejected: 8 },
    { month: 'Jun', requests: 67, validated: 58, rejected: 9 },
    { month: 'Jul', requests: 72, validated: 62, rejected: 10 },
  ];

  const priorityData = [
    { name: 'Normale', value: 245, color: '#3b82f6' },
    { name: 'Urgente', value: 98, color: '#ef4444' },
  ];

  const roleData = [
    { name: 'Cardiologues', value: 5, color: '#8b5cf6' },
    { name: 'Professionnels', value: 8, color: '#06b6d4' },
  ];

  const stats = [
    { label: 'Total demandes', value: '343', change: '+12%', color: 'text-blue-600' },
    { label: 'Taux de validation', value: '90.4%', change: '+2%', color: 'text-green-600' },
    { label: 'Temps moyen', value: '11 min', change: '-1 min', color: 'text-purple-600' },
    { label: 'Utilisateurs actifs', value: '13', change: '+1', color: 'text-orange-600' },
  ];

  const recentActivity = [
    { time: '14:32', action: 'Demande validée', user: 'Dr. Martin Leclerc', request: 'REQ-001' },
    { time: '12:45', action: 'Demande corrigée', user: 'Dr. Sophie Dupont', request: 'REQ-002' },
    { time: '10:15', action: 'Nouvel utilisateur', user: 'Admin', request: 'Dr. Claire R.' },
    { time: '09:30', action: 'Demande rejetée', user: 'Dr. Bernard', request: 'REQ-005' },
    { time: '08:45', action: 'Demande créée', user: 'Infirmier Moreau', request: 'REQ-006' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Statistiques</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble des performances et activités de la plateforme
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4 border border-border">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-green-600 mt-2">{stat.change}</p>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Trend */}
          <Card className="p-6 border border-border lg:col-span-2">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Tendance mensuelle
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#3b82f6"
                  name="Demandes"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="validated"
                  stroke="#10b981"
                  name="Validées"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Priority Distribution */}
          <Card className="p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Par priorité
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Status Distribution */}
        <Card className="p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Distribution par statut
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="validated" fill="#10b981" name="Validées" />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejetées" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Activité récente
            </h2>
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                  <div className="text-xs text-muted-foreground font-medium pt-1 min-w-fit">
                    {activity.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.user} • {activity.request}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Cardiologists */}
          <Card className="p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Cardiologues les plus actifs
            </h2>
            <div className="space-y-3">
              {[
                { name: 'Dr. Martin Leclerc', analyses: 45, rate: '98%' },
                { name: 'Dr. Claire Rousseau', analyses: 38, rate: '96%' },
                { name: 'Dr. Pierre Bernard', analyses: 32, rate: '94%' },
                { name: 'Dr. Sophie Dupont', analyses: 28, rate: '92%' },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.analyses} analyses
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    {doc.rate}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
