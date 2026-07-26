import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Search, Calendar, BarChart3 } from 'lucide-react';

export default function CardiologyHistory() {
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const analyses = [
    {
      id: 'REQ-001',
      patient: 'Jean Dupont',
      date: '2026-07-26',
      time: '14:15',
      duration: '12 min',
      action: 'Validée',
      diagnosis: 'ECG normal',
    },
    {
      id: 'REQ-002',
      patient: 'Marie Durand',
      date: '2026-07-26',
      time: '12:45',
      duration: '8 min',
      action: 'Corrigée',
      diagnosis: 'Sus-décalage ST',
    },
    {
      id: 'REQ-004',
      patient: 'Sophie Martin',
      date: '2026-07-24',
      time: '16:20',
      duration: '15 min',
      action: 'Validée',
      diagnosis: 'Arythmie détectée',
    },
    {
      id: 'REQ-005',
      patient: 'Luc Moreau',
      date: '2026-07-23',
      time: '09:15',
      duration: '10 min',
      action: 'Rejetée',
      diagnosis: 'Qualité insuffisante',
    },
    {
      id: 'REQ-006',
      patient: 'Anne Petit',
      date: '2026-07-22',
      time: '15:45',
      duration: '11 min',
      action: 'Validée',
      diagnosis: 'ECG normal',
    },
    {
      id: 'REQ-007',
      patient: 'Marc Durand',
      date: '2026-07-21',
      time: '10:30',
      duration: '9 min',
      action: 'Validée',
      diagnosis: 'Bloc AV partiel',
    },
  ];

  const stats = {
    total: analyses.length,
    validated: analyses.filter((a) => a.action === 'Validée').length,
    corrected: analyses.filter((a) => a.action === 'Corrigée').length,
    rejected: analyses.filter((a) => a.action === 'Rejetée').length,
    avgTime: '11 min',
  };

  const filteredAnalyses = analyses.filter((analysis) => {
    const matchesSearch =
      analysis.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.patient.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'today' && analysis.date === '2026-07-26') ||
      (dateFilter === 'week' && parseInt(analysis.date.split('-')[2]) >= 20) ||
      (dateFilter === 'month' && analysis.date.startsWith('2026-07'));

    return matchesSearch && matchesDate;
  });

  const getActionBadge = (action: string) => {
    const variants: Record<string, any> = {
      'Validée': 'default',
      'Corrigée': 'secondary',
      'Rejetée': 'destructive',
    };
    return <Badge variant={variants[action] || 'outline'}>{action}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historique d'analyses</h1>
          <p className="text-muted-foreground mt-1">
            Consultez toutes vos analyses ECG passées
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Validées</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.validated}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Corrigées</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.corrected}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Rejetées</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Temps moyen</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.avgTime}</p>
          </Card>
        </div>

        {/* Filters */}
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
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  dateFilter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Toutes les dates
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  dateFilter === 'today'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  dateFilter === 'week'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Cette semaine
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  dateFilter === 'month'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Ce mois
              </button>
            </div>
          </div>
        </Card>

        {/* Analyses Table */}
        <Card className="p-6 border border-border overflow-hidden">
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
                    Date & Heure
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Durée
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Action
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Diagnostic
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAnalyses.map((analysis) => (
                  <tr
                    key={analysis.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      {analysis.id}
                    </td>
                    <td className="py-3 px-4 text-foreground">{analysis.patient}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {analysis.date} {analysis.time}
                    </td>
                    <td className="py-3 px-4 text-foreground">{analysis.duration}</td>
                    <td className="py-3 px-4">{getActionBadge(analysis.action)}</td>
                    <td className="py-3 px-4 text-foreground text-sm">
                      {analysis.diagnosis}
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
