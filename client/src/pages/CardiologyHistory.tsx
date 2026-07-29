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
import { StatCard } from '@/components/common/StatCard';
import { StatusChip } from '@/components/common/StatusChip';
import { useCardiologistHistory } from '@/api/hooks';
import { formatDuration, type EcgRequestSummary } from '@/api/types';

type DateFilter = 'all' | 'today' | 'week' | 'month';

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: 'Toutes',
  today: "Aujourd'hui",
  week: '7 derniers jours',
  month: '30 derniers jours',
};

/** Nombre de jours couverts par chaque filtre. `null` = pas de borne. */
const FILTER_DAYS: Record<DateFilter, number | null> = {
  all: null,
  today: 1,
  week: 7,
  month: 30,
};

/**
 * Durée de traitement : de l'arrivée en file à la conclusion.
 *
 * `analysisCompletedAt` est le meilleur point de départ disponible — c'est le
 * moment où la demande devient examinable. Quand l'analyse a échoué, on retombe
 * sur la date de soumission.
 */
function reviewDurationMs(row: EcgRequestSummary): number | null {
  if (row.reviewedAt === null) return null;
  const start = new Date(row.analysisCompletedAt ?? row.createdAt).getTime();
  return new Date(row.reviewedAt).getTime() - start;
}

export default function CardiologyHistory() {
  const [, navigate] = useLocation();
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const query = useCardiologistHistory();

  const analyses = useMemo(() => query.data ?? [], [query.data]);

  const rows = useMemo(() => {
    const days = FILTER_DAYS[dateFilter];
    if (days === null) return analyses;

    const floor = Date.now() - days * 24 * 60 * 60 * 1000;
    return analyses.filter((a) => a.reviewedAt !== null && new Date(a.reviewedAt).getTime() >= floor);
  }, [analyses, dateFilter]);

  const stats = useMemo(() => {
    const durations = analyses.map(reviewDurationMs).filter((d): d is number => d !== null);
    const average =
      durations.length === 0 ? null : durations.reduce((a, b) => a + b, 0) / durations.length;

    return {
      total: analyses.length,
      validated: analyses.filter((a) => a.reviewDecision === 'VALIDATED').length,
      corrected: analyses.filter((a) => a.reviewDecision === 'CORRECTED').length,
      rejected: analyses.filter((a) => a.reviewDecision === 'REJECTED').length,
      averageDuration: formatDuration(average),
    };
  }, [analyses]);

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
      field: 'reviewedAt',
      headerName: 'Conclue le',
      width: 160,
      valueGetter: (value: string | null) => (value === null ? null : new Date(value)),
      valueFormatter: (value: Date | null) => (value === null ? '—' : value.toLocaleString('fr-FR')),
    },
    {
      field: 'duration',
      headerName: 'Durée',
      width: 110,
      valueGetter: (_value, row) => reviewDurationMs(row),
      renderCell: ({ value }) => formatDuration(value as number | null),
    },
    {
      field: 'reviewDecisionLabel',
      headerName: 'Décision',
      width: 120,
      renderCell: ({ row }) =>
        row.reviewDecision === null ? (
          '—'
        ) : (
          <StatusChip status={row.reviewDecisionLabel ?? ''} statusKey={row.reviewDecision} />
        ),
    },
    {
      field: 'finalDiagnosis',
      headerName: 'Diagnostic',
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
          onClick={() => navigate(`/analyze/${row.id}`)}
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
          title="Historique d'analyses"
          subtitle="Consultez toutes vos analyses ECG passées"
        />

        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        >
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                <StatCard label="Total" value={stats.total} color="primary" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                <StatCard label="Validées" value={stats.validated} color="success" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                <StatCard label="Corrigées" value={stats.corrected} color="info" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                <StatCard label="Rejetées" value={stats.rejected} color="error" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                <StatCard label="Temps moyen" value={stats.averageDuration} color="secondary" />
              </Grid>
            </Grid>

            <SectionCard
              title="Analyses"
              action={
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {(Object.keys(DATE_FILTER_LABELS) as DateFilter[]).map((key) => (
                    <Chip
                      key={key}
                      label={DATE_FILTER_LABELS[key]}
                      color={dateFilter === key ? 'primary' : 'default'}
                      variant={dateFilter === key ? 'filled' : 'outlined'}
                      onClick={() => setDateFilter(key)}
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
                initialState={{ sorting: { sortModel: [{ field: 'reviewedAt', sort: 'desc' }] } }}
              />
            </SectionCard>
          </Stack>
        </QueryBoundary>
      </Stack>
    </DashboardLayout>
  );
}
