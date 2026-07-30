import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';

import { DashboardLayout } from '@/components/DashboardLayout';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard, type StatColor } from '@/components/common/StatCard';
import { StatusChip } from '@/components/common/StatusChip';
import { useEcgRequests } from '@/api/hooks';
import type { EcgRequestSummary } from '@/api/types';

type FilterKey = 'all' | 'urgent' | 'pending' | 'processing' | 'completed' | 'rejected';

/**
 * Prédicat par filtre rapide, exprimé sur l'énumération technique du serveur.
 *
 * Filtrer sur le libellé français serait fragile : la moindre reformulation
 * côté serveur viderait silencieusement un onglet.
 */
const FILTER_PREDICATE: Record<FilterKey, (r: EcgRequestSummary) => boolean> = {
  all: () => true,
  urgent: (r) => r.priority === 'URGENT',
  pending: (r) =>
    r.status === 'PENDING_ANALYSIS' ||
    r.status === 'ANALYZING' ||
    r.status === 'ANALYSIS_FAILED' ||
    r.status === 'PENDING_REVIEW',
  processing: (r) => r.status === 'UNDER_REVIEW',
  completed: (r) => r.status === 'VALIDATED' || r.status === 'CORRECTED',
  rejected: (r) => r.status === 'REJECTED',
};

const FILTERS: {
  key: FilterKey;
  label: string;
  color: 'default' | 'primary' | 'error' | 'warning' | 'info' | 'success';
}[] = [
  { key: 'all', label: 'Toutes', color: 'primary' },
  { key: 'urgent', label: 'Urgentes', color: 'error' },
  { key: 'pending', label: 'En attente', color: 'warning' },
  { key: 'processing', label: 'En cours', color: 'info' },
  { key: 'completed', label: 'Conclues', color: 'success' },
  { key: 'rejected', label: 'Rejetées', color: 'error' },
];

export default function MyRequests() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterKey>('all');
  const query = useEcgRequests();

  const requests = useMemo(() => query.data ?? [], [query.data]);
  const rows = useMemo(() => requests.filter(FILTER_PREDICATE[filter]), [requests, filter]);

  const stats: { label: string; value: number; color: StatColor }[] = [
    { label: 'Total', value: requests.length, color: 'primary' },
    { label: 'Urgentes', value: requests.filter(FILTER_PREDICATE.urgent).length, color: 'error' },
    { label: 'En attente', value: requests.filter(FILTER_PREDICATE.pending).length, color: 'warning' },
    { label: 'Conclues', value: requests.filter(FILTER_PREDICATE.completed).length, color: 'success' },
  ];

  const columns: GridColDef<EcgRequestSummary>[] = [
    { field: 'reference', headerName: 'Référence', width: 120 },
    {
      field: 'patient',
      headerName: 'Patient',
      flex: 1,
      minWidth: 150,
      valueGetter: (_value, row) => row.patient.fullName,
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 150,
      valueGetter: (value: string) => new Date(value),
      valueFormatter: (value: Date) => value.toLocaleDateString('fr-FR'),
    },
    {
      field: 'indicationLabel',
      headerName: 'Motif',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'priorityLabel',
      headerName: 'Priorité',
      width: 110,
      renderCell: ({ row }) => <StatusChip status={row.priorityLabel} statusKey={row.priority} />,
    },
    {
      field: 'statusLabel',
      headerName: 'Statut',
      flex: 1,
      minWidth: 190,
      renderCell: ({ row }) => <StatusChip status={row.statusLabel} statusKey={row.status} />,
    },
    {
      field: 'finalDiagnosis',
      headerName: 'Diagnostic retenu',
      flex: 1,
      minWidth: 180,
      valueGetter: (value: string | null) => value ?? '—',
    },
    {
      field: 'actions',
      headerName: 'Action',
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={() => navigate(`/request/${row.id}`)}
        >
          Voir
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Stack spacing={3}>
        <PageHeader
          title="Mes demandes"
          subtitle="Gérez et suivez toutes vos demandes d'analyse ECG"
        />

        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        >
          <Stack spacing={3}>
            <Grid container spacing={2}>
              {stats.map((stat) => (
                <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <StatCard label={stat.label} value={stat.value} color={stat.color} />
                </Grid>
              ))}
            </Grid>

            <SectionCard
              title="Demandes"
              subheader="Utilisez la barre d'outils pour rechercher, trier ou exporter"
              action={
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {FILTERS.map((f) => (
                    <Chip
                      key={f.key}
                      label={`${f.label} (${requests.filter(FILTER_PREDICATE[f.key]).length})`}
                      color={filter === f.key ? f.color : 'default'}
                      variant={filter === f.key ? 'filled' : 'outlined'}
                      // Le remplissage signale le filtre actif à l'œil ; `aria-pressed`
                      // le signale au lecteur d'écran, qui ne voit ni couleur ni contour.
                      aria-pressed={filter === f.key}
                      onClick={() => setFilter(f.key)}
                    />
                  ))}
                </Stack>
              }
              disableContentPadding
            >
              <DataTable<EcgRequestSummary>
                rows={rows}
                columns={columns}
                height={520}
                initialState={{ sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] } }}
              />
            </SectionCard>
          </Stack>
        </QueryBoundary>
      </Stack>
    </DashboardLayout>
  );
}
