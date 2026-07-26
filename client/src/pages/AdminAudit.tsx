import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Search, Filter } from 'lucide-react';

export default function AdminAudit() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const auditLogs = [
    {
      id: 1,
      timestamp: '2026-07-26 14:32:15',
      user: 'Dr. Martin Leclerc',
      action: 'Demande validée',
      resource: 'REQ-001',
      status: 'Succès',
      details: 'ECG normal - Validation approuvée',
    },
    {
      id: 2,
      timestamp: '2026-07-26 12:45:32',
      user: 'Dr. Sophie Dupont',
      action: 'Demande créée',
      resource: 'REQ-002',
      status: 'Succès',
      details: 'Patient: Marie Durand - Priorité: Urgente',
    },
    {
      id: 3,
      timestamp: '2026-07-26 10:15:48',
      user: 'Admin',
      action: 'Utilisateur créé',
      resource: 'Dr. Claire Rousseau',
      status: 'Succès',
      details: 'Rôle: Cardiologue - Email: claire.rousseau@hospital.fr',
    },
    {
      id: 4,
      timestamp: '2026-07-25 16:20:12',
      user: 'Dr. Bernard',
      action: 'Demande rejetée',
      resource: 'REQ-005',
      status: 'Succès',
      details: 'Motif: Qualité insuffisante du tracé',
    },
    {
      id: 5,
      timestamp: '2026-07-25 14:10:55',
      user: 'Infirmier Moreau',
      action: 'Fichier uploadé',
      resource: 'REQ-004',
      status: 'Succès',
      details: 'Fichier ECG - Taille: 2.4 MB',
    },
    {
      id: 6,
      timestamp: '2026-07-25 09:30:22',
      user: 'Admin',
      action: 'Paramètres modifiés',
      resource: 'Système',
      status: 'Succès',
      details: 'Délai d\'analyse IA: 5 min → 3 min',
    },
    {
      id: 7,
      timestamp: '2026-07-24 15:45:33',
      user: 'Dr. Leclerc',
      action: 'Accès refusé',
      resource: 'Admin Panel',
      status: 'Erreur',
      details: 'Permissions insuffisantes',
    },
    {
      id: 8,
      timestamp: '2026-07-24 10:20:15',
      user: 'Admin',
      action: 'Utilisateur suspendu',
      resource: 'Marc Petit',
      status: 'Succès',
      details: 'Raison: Inactivité prolongée',
    },
  ];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      actionFilter === 'all' ||
      (actionFilter === 'success' && log.status === 'Succès') ||
      (actionFilter === 'error' && log.status === 'Erreur');

    return matchesSearch && matchesFilter;
  });

  const getActionColor = (action: string) => {
    if (action.includes('créé') || action.includes('validé')) return 'text-green-600';
    if (action.includes('rejeté') || action.includes('refusé')) return 'text-red-600';
    if (action.includes('modifié') || action.includes('suspendu')) return 'text-orange-600';
    return 'text-blue-600';
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'Succès' ? 'default' : 'destructive'}>
        {status}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Journal d'audit</h1>
          <p className="text-muted-foreground mt-1">
            Consultez l'historique complet des actions et modifications
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4 border border-border">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher par utilisateur, ressource ou action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActionFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  actionFilter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setActionFilter('success')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  actionFilter === 'success'
                    ? 'bg-green-600 text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Succès
              </button>
              <button
                onClick={() => setActionFilter('error')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  actionFilter === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Erreurs
              </button>
            </div>
          </div>
        </Card>

        {/* Audit Logs Table */}
        <Card className="p-6 border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Timestamp
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Utilisateur
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Action
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Ressource
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Détails
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-muted-foreground text-xs font-mono">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">
                      {log.user}
                    </td>
                    <td className={`py-3 px-4 font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      <Badge variant="outline">{log.resource}</Badge>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Total d'actions</p>
            <p className="text-2xl font-bold text-foreground mt-1">{auditLogs.length}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Actions réussies</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {auditLogs.filter((l) => l.status === 'Succès').length}
            </p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Erreurs</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {auditLogs.filter((l) => l.status === 'Erreur').length}
            </p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
