import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeartOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import type { GridColDef } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { useLocation } from 'wouter';

import { DashboardLayout } from '@/components/DashboardLayout';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard, type StatColor } from '@/components/common/StatCard';
import { StatusChip } from '@/components/common/StatusChip';
import { useStatistics, useUsers } from '@/api/hooks';
import { formatDuration, type ManagedUser } from '@/api/types';
import { useAuth } from '@/contexts/AuthContext';

/** Statuts qui comptent comme « demande encore en circulation ». */
const IN_FLIGHT = ['PENDING_ANALYSIS', 'ANALYZING', 'ANALYSIS_FAILED', 'PENDING_REVIEW', 'UNDER_REVIEW'];

const RECENT_USER_LIMIT = 6;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const statistics = useStatistics();
  const users = useUsers();

  const totals = statistics.data?.totals;

  const pending = useMemo(
    () =>
      (statistics.data?.byStatus ?? [])
        .filter((s) => IN_FLIGHT.includes(s.status))
        .reduce((sum, s) => sum + s.count, 0),
    [statistics.data],
  );

  const stats: { label: string; value: string | number; icon: React.ReactNode; color: StatColor }[] =
    [
      {
        label: 'Utilisateurs totaux',
        value: totals?.activeUsers ?? 0,
        icon: <PeopleIcon />,
        color: 'primary',
      },
      {
        label: 'Professionnels de santé',
        value: totals?.professionals ?? 0,
        icon: <MonitorHeartIcon />,
        color: 'success',
      },
      {
        label: 'Cardiologues',
        value: totals?.cardiologists ?? 0,
        icon: <TrendingUpIcon />,
        color: 'info',
      },
      {
        label: 'Demandes en attente',
        value: pending,
        icon: <AccessTimeIcon />,
        color: 'warning',
      },
      {
        label: 'Analyses conclues',
        value: totals?.concluded ?? 0,
        icon: <CheckCircleIcon />,
        color: 'success',
      },
      {
        label: 'Temps moyen de validation',
        value: formatDuration(totals?.averageReviewDurationMs ?? null),
        icon: <BarChartIcon />,
        color: 'secondary',
      },
    ];

  // Les derniers comptes connectés disent bien plus que les derniers créés :
  // c'est l'activité réelle de la plateforme.
  const recentUsers = useMemo(() => {
    return [...(users.data ?? [])]
      .sort((a, b) => {
        const left = a.lastLoginAt === null ? 0 : new Date(a.lastLoginAt).getTime();
        const right = b.lastLoginAt === null ? 0 : new Date(b.lastLoginAt).getTime();
        return right - left;
      })
      .slice(0, RECENT_USER_LIMIT);
  }, [users.data]);

  const columns: GridColDef<ManagedUser>[] = [
    { field: 'name', headerName: 'Nom', flex: 1.2, minWidth: 180 },
    { field: 'email', headerName: 'Email', flex: 1.4, minWidth: 220 },
    { field: 'roleLabel', headerName: 'Rôle', flex: 1, minWidth: 170 },
    {
      field: 'status',
      headerName: 'Statut',
      width: 120,
      renderCell: ({ value }) => <StatusChip status={value as string} />,
    },
    {
      field: 'lastLoginAt',
      headerName: 'Dernière connexion',
      width: 180,
      valueGetter: (value: string | null) => (value === null ? null : new Date(value)),
      valueFormatter: (value: Date | null) =>
        value === null ? 'Jamais' : value.toLocaleString('fr-FR'),
    },
  ];

  return (
    <DashboardLayout>
      <Stack spacing={3}>
        <PageHeader
          title="Tableau de bord administrateur"
          subtitle={`Bienvenue, ${user?.name ?? ''}`}
          action={
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => navigate('/admin/statistics')}>
                Statistiques
              </Button>
              <Button variant="contained" onClick={() => navigate('/admin/users')}>
                Utilisateurs
              </Button>
            </Stack>
          }
        />

        <QueryBoundary
          isLoading={statistics.isLoading}
          error={statistics.error}
          onRetry={() => void statistics.refetch()}
        >
          <Stack spacing={3}>
            <Grid container spacing={2}>
              {stats.map((stat) => (
                <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <StatCard
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                  />
                </Grid>
              ))}
            </Grid>

            <SectionCard
              title="Utilisateurs récemment actifs"
              action={
                <Button size="small" onClick={() => navigate('/admin/users')}>
                  Voir tout
                </Button>
              }
              disableContentPadding
            >
              <DataTable<ManagedUser>
                rows={recentUsers}
                columns={columns}
                height={360}
                hideFooter
                showToolbar={false}
                loading={users.isLoading}
              />
            </SectionCard>
          </Stack>
        </QueryBoundary>
      </Stack>
    </DashboardLayout>
  );
}
