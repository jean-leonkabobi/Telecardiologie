import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Dr. Martin Leclerc',
      email: 'martin.leclerc@hospital.fr',
      role: 'Cardiologue',
      status: 'Actif',
      joinDate: '2026-01-15',
      lastLogin: '2026-07-26 14:32',
    },
    {
      id: 2,
      name: 'Dr. Sophie Dupont',
      email: 'sophie.dupont@hospital.fr',
      role: 'Professionnel de santé',
      status: 'Actif',
      joinDate: '2026-02-10',
      lastLogin: '2026-07-26 13:15',
    },
    {
      id: 3,
      name: 'Dr. Pierre Bernard',
      email: 'pierre.bernard@hospital.fr',
      role: 'Cardiologue',
      status: 'Inactif',
      joinDate: '2026-01-20',
      lastLogin: '2026-07-25 09:45',
    },
    {
      id: 4,
      name: 'Infirmier Jean Moreau',
      email: 'jean.moreau@hospital.fr',
      role: 'Professionnel de santé',
      status: 'Actif',
      joinDate: '2026-03-05',
      lastLogin: '2026-07-26 14:20',
    },
    {
      id: 5,
      name: 'Dr. Claire Rousseau',
      email: 'claire.rousseau@hospital.fr',
      role: 'Cardiologue',
      status: 'Actif',
      joinDate: '2026-04-12',
      lastLogin: '2026-07-26 10:00',
    },
    {
      id: 6,
      name: 'Ambulancier Marc Petit',
      email: 'marc.petit@hospital.fr',
      role: 'Professionnel de santé',
      status: 'Suspendu',
      joinDate: '2026-05-01',
      lastLogin: '2026-07-20 08:30',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'Actif').length,
    cardiologists: users.filter((u) => u.role === 'Cardiologue').length,
    professionals: users.filter((u) => u.role === 'Professionnel de santé').length,
  };

  const handleDelete = (id: number) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'Actif': 'default',
      'Inactif': 'outline',
      'Suspendu': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des utilisateurs</h1>
            <p className="text-muted-foreground mt-1">
              Gérez les comptes et les rôles des utilisateurs
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus className="w-4 h-4" />
            Nouvel utilisateur
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Actifs</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Cardiologues</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.cardiologists}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Professionnels</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.professionals}</p>
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
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  roleFilter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setRoleFilter('Cardiologue')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  roleFilter === 'Cardiologue'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Cardiologues
              </button>
              <button
                onClick={() => setRoleFilter('Professionnel de santé')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  roleFilter === 'Professionnel de santé'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Professionnels
              </button>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="p-6 border border-border overflow-hidden">
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
                    Inscription
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Dernière connexion
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      {user.name}
                    </td>
                    <td className="py-3 px-4 text-foreground text-xs">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{user.role}</Badge>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {user.joinDate}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {user.lastLogin}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
