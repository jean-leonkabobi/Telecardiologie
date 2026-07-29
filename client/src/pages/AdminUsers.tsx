import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';

import { DashboardLayout } from '@/components/DashboardLayout';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/common/StatCard';
import { StatusChip } from '@/components/common/StatusChip';
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from '@/api/hooks';
import type { ManagedUser } from '@/api/types';
import { ApiError } from '@/lib/apiClient';
import { confirm, notify } from '@/lib/alerts';

const ROLE_FILTERS = ['all', 'cardiologist', 'healthcare_professional', 'admin'] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];

const ROLE_FILTER_LABELS: Record<RoleFilter, string> = {
  all: 'Tous',
  cardiologist: 'Cardiologues',
  healthcare_professional: 'Professionnels',
  admin: 'Administrateurs',
};

const ROLE_OPTIONS = [
  { value: 'healthcare_professional', label: 'Professionnel de santé' },
  { value: 'cardiologist', label: 'Cardiologue' },
  { value: 'admin', label: 'Administrateur' },
];

/** `PENDING_ACTIVATION` est exclu : il se quitte, il ne se choisit pas. */
type EditableStatus = Exclude<ManagedUser['status'], 'PENDING_ACTIVATION'>;

const STATUS_OPTIONS: { value: EditableStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'SUSPENDED', label: 'Suspendu' },
];

export default function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);

  const query = useUsers();
  const deleteUser = useDeleteUser();

  const users = useMemo(() => query.data ?? [], [query.data]);
  const rows = useMemo(
    () => (roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter)),
    [users, roleFilter],
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'ACTIVE').length,
    cardiologists: users.filter((u) => u.role === 'cardiologist').length,
    professionals: users.filter((u) => u.role === 'healthcare_professional').length,
  };

  /** La suppression est irréversible : elle passe par une confirmation explicite. */
  const handleDelete = async (user: ManagedUser): Promise<void> => {
    const confirmed = await confirm({
      title: 'Supprimer ce compte ?',
      text: `${user.name} (${user.email}) perdra immédiatement l'accès à la plateforme. Cette action est irréversible.`,
      confirmLabel: 'Supprimer le compte',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteUser.mutateAsync(user.id);
      notify.success('Compte supprimé', `${user.name} n'a plus accès à la plateforme.`);
    } catch (error) {
      notify.error(
        'Suppression impossible',
        error instanceof ApiError ? error.message : 'Veuillez réessayer.',
      );
    }
  };

  const columns: GridColDef<ManagedUser>[] = [
    { field: 'name', headerName: 'Nom', flex: 1.2, minWidth: 180 },
    { field: 'email', headerName: 'Email', flex: 1.4, minWidth: 220 },
    {
      field: 'roleLabel',
      headerName: 'Rôle',
      width: 180,
      renderCell: ({ value }) => <Chip label={value as string} variant="outlined" />,
    },
    {
      field: 'statusLabel',
      headerName: 'Statut',
      width: 160,
      renderCell: ({ row }) => <StatusChip status={row.statusLabel} statusKey={row.status} />,
    },
    {
      field: 'createdAt',
      headerName: 'Inscription',
      width: 120,
      valueGetter: (value: string) => new Date(value),
      valueFormatter: (value: Date) => value.toLocaleDateString('fr-FR'),
    },
    {
      field: 'lastLoginAt',
      headerName: 'Dernière connexion',
      width: 180,
      valueGetter: (value: string | null) => (value === null ? null : new Date(value)),
      valueFormatter: (value: Date | null) =>
        value === null ? 'Jamais' : value.toLocaleString('fr-FR'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Modifier">
            <IconButton size="small" onClick={() => setEditing(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton size="small" color="error" onClick={() => void handleDelete(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Stack spacing={3}>
        <PageHeader
          title="Gestion des utilisateurs"
          subtitle="Gérez les comptes et les rôles des utilisateurs"
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
              Nouvel utilisateur
            </Button>
          }
        />

        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        >
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard label="Total" value={stats.total} color="primary" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard label="Actifs" value={stats.active} color="success" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard label="Cardiologues" value={stats.cardiologists} color="info" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard label="Professionnels" value={stats.professionals} color="secondary" />
              </Grid>
            </Grid>

            <SectionCard
              title="Utilisateurs"
              action={
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {ROLE_FILTERS.map((key) => (
                    <Chip
                      key={key}
                      label={ROLE_FILTER_LABELS[key]}
                      color={roleFilter === key ? 'primary' : 'default'}
                      variant={roleFilter === key ? 'filled' : 'outlined'}
                      onClick={() => setRoleFilter(key)}
                    />
                  ))}
                </Stack>
              }
              disableContentPadding
            >
              <DataTable<ManagedUser> rows={rows} columns={columns} height={520} />
            </SectionCard>
          </Stack>
        </QueryBoundary>
      </Stack>

      <CreateUserDialog open={creating} onClose={() => setCreating(false)} />
      {/* La clé remonte le formulaire à chaque changement de compte : l'état
          initial se déduit alors des props, sans effet de synchronisation. */}
      <EditUserDialog key={editing?.id ?? 'none'} user={editing} onClose={() => setEditing(null)} />
    </DashboardLayout>
  );
}

function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createUser = useCreateUser();
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'healthcare_professional',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = await createUser.mutateAsync(form);
      notify.success(
        'Compte créé',
        `${user.name} recevra un email pour définir son mot de passe.`,
      );
      setForm({ email: '', firstName: '', lastName: '', role: 'healthcare_professional' });
      onClose();
    } catch (error) {
      notify.error(
        'Création impossible',
        error instanceof ApiError ? error.message : 'Veuillez réessayer.',
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>Nouvel utilisateur</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Le compte est créé sans mot de passe : l'utilisateur reçoit un lien d'activation par
              email.
            </Typography>
            <TextField
              label="Prénom"
              required
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            />
            <TextField
              label="Nom"
              required
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            />
            <TextField
              label="Adresse email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <TextField
              label="Rôle"
              select
              required
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              {ROLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" loading={createUser.isPending}>
            Créer le compte
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function EditUserDialog({ user, onClose }: { user: ManagedUser | null; onClose: () => void }) {
  const updateUser = useUpdateUser();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    role: user?.role ?? 'healthcare_professional',
    // Un compte encore en attente d'activation ne peut pas être « remis » dans
    // cet état depuis l'interface : on propose la valeur qui a du sens.
    status: user?.status === 'PENDING_ACTIVATION' ? 'ACTIVE' : (user?.status ?? 'ACTIVE'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateUser.mutateAsync({
        id: user.id,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        status: form.status as ManagedUser['status'],
      });
      notify.success('Compte modifié', `Les informations de ${user.name} sont à jour.`);
      onClose();
    } catch (error) {
      notify.error(
        'Modification impossible',
        error instanceof ApiError ? error.message : 'Veuillez réessayer.',
      );
    }
  };

  return (
    <Dialog open={user !== null} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>Modifier {user?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Prénom"
              required
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            />
            <TextField
              label="Nom"
              required
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            />
            <TextField
              label="Rôle"
              select
              required
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              {ROLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Statut"
              select
              required
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as EditableStatus }))
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" loading={updateUser.isPending}>
            Enregistrer
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
