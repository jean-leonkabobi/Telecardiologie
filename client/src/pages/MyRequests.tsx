import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

export default function MyRequests() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const allRequests = [
    {
      id: 'REQ-001',
      patient: 'Jean Dupont',
      date: '2026-07-26',
      priority: 'Normale',
      status: 'Validée',
      cardiologist: 'Dr. Martin',
      daysAgo: 0,
    },
    {
      id: 'REQ-002',
      patient: 'Marie Durand',
      date: '2026-07-25',
      priority: 'Urgente',
      status: 'En cours de validation',
      cardiologist: 'Dr. Leclerc',
      daysAgo: 1,
    },
    {
      id: 'REQ-003',
      patient: 'Pierre Bernard',
      date: '2026-07-25',
      priority: 'Normale',
      status: 'En attente d\'analyse',
      cardiologist: '-',
      daysAgo: 1,
    },
    {
      id: 'REQ-004',
      patient: 'Sophie Martin',
      date: '2026-07-24',
      priority: 'Urgente',
      status: 'Validée',
      cardiologist: 'Dr. Dupont',
      daysAgo: 2,
    },
    {
      id: 'REQ-005',
      patient: 'Luc Moreau',
      date: '2026-07-23',
      priority: 'Normale',
      status: 'Rejetée',
      cardiologist: 'Dr. Bernard',
      daysAgo: 3,
    },
    {
      id: 'REQ-006',
      patient: 'Anne Petit',
      date: '2026-07-22',
      priority: 'Normale',
      status: 'Validée',
      cardiologist: 'Dr. Martin',
      daysAgo: 4,
    },
  ];

  const filteredRequests = allRequests.filter((req) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'urgent' && req.priority === 'Urgente') ||
      (filter === 'pending' && req.status === 'En attente d\'analyse') ||
      (filter === 'processing' && req.status === 'En cours de validation') ||
      (filter === 'completed' && req.status === 'Validée') ||
      (filter === 'rejected' && req.status === 'Rejetée');

    const matchesSearch =
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.patient.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'urgent') return (b.priority === 'Urgente' ? 1 : 0) - (a.priority === 'Urgente' ? 1 : 0);
    return 0;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'Validée': 'default',
      'En cours de validation': 'secondary',
      'En attente d\'analyse': 'outline',
      'Rejetée': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const stats = [
    { label: 'Total', value: allRequests.length, color: 'text-blue-600' },
    { label: 'Urgentes', value: allRequests.filter((r) => r.priority === 'Urgente').length, color: 'text-red-600' },
    { label: 'En attente', value: allRequests.filter((r) => r.status === 'En attente d\'analyse').length, color: 'text-yellow-600' },
    { label: 'Validées', value: allRequests.filter((r) => r.status === 'Validée').length, color: 'text-green-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mes demandes</h1>
          <p className="text-muted-foreground mt-1">
            Gérez et suivez toutes vos demandes d'analyse ECG
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4 border border-border">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="p-4 border border-border">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher par référence ou patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="recent">Plus récent</option>
                <option value="urgent">Urgentes d'abord</option>
              </select>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Toutes ({allRequests.length})
              </button>
              <button
                onClick={() => setFilter('urgent')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'urgent'
                    ? 'bg-red-600 text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Urgentes ({allRequests.filter((r) => r.priority === 'Urgente').length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                En attente ({allRequests.filter((r) => r.status === 'En attente d\'analyse').length})
              </button>
              <button
                onClick={() => setFilter('processing')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'processing'
                    ? 'bg-orange-600 text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                En cours ({allRequests.filter((r) => r.status === 'En cours de validation').length})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Validées ({allRequests.filter((r) => r.status === 'Validée').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === 'rejected'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Rejetées ({allRequests.filter((r) => r.status === 'Rejetée').length})
              </button>
            </div>
          </div>
        </Card>

        {/* Requests Table */}
        <Card className="p-6 border border-border overflow-hidden">
          {sortedRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucune demande trouvée</p>
            </div>
          ) : (
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
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Priorité
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Statut
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Cardiologue
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-foreground">{req.id}</td>
                      <td className="py-3 px-4 text-foreground">{req.patient}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {req.date}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            req.priority === 'Urgente' ? 'destructive' : 'secondary'
                          }
                        >
                          {req.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                      <td className="py-3 px-4 text-foreground text-sm">
                        {req.cardiologist}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/request/${req.id}`)}
                        >
                          Voir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
