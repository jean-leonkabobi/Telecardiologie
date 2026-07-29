import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LockOpenIcon from '@mui/icons-material/LockOpenOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';

import { DashboardLayout } from '@/components/DashboardLayout';
import { DataTable } from '@/components/common/DataTable';
import { InfoPanel } from '@/components/common/InfoPanel';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/common/StatCard';
import { StatusChip } from '@/components/common/StatusChip';
import { useEcgRequests, useReleaseEcgRequest, useRetryEcgAnalysis } from '@/api/hooks';
import { formatDuration, type EcgRequestSummary } from '@/api/types';
import { ApiError } from '@/lib/apiClient';
import { confirm, notify } from '@/lib/alerts';

type FilterKey = 'all' | 'blocked' | 'inFlight' | 'concluded';

const FILTER_PREDICATE: Record<FilterKey, (r: EcgRequestSummary) => boolean> = {
  all: () => true,
  // Les deux situations qui réclament une intervention d'administrateur.
  blocked: (r) => r.status === 'ANALYSIS_FAILED' || r.status === 'UNDER_REVIEW',
  inFlight: (r) =>
    r.status === 'PENDING_ANALYSIS' || r.status === 'ANALYZING' || r.status === 'PENDING_REVIEW',
  concluded: (r) => r.reviewedAt !== null,
};

const FILTERS: { key: FilterKey; label: string; color: 'primary' | 'error' | 'info' | 'success' }[] =
  [
    { key: 'all', label: 'Toutes', color: 'primary' },
    { key: 'blocked', label: 'À débloquer', color: 'error' },
    { key: 'inFlight', label: 'En circulation', color: 'info' },
    { key: 'concluded', label: 'Conclues', color: 'success' },
  ];

/**
 * Supervision des demandes, réservée à l'administrateur.
 *
 * Deux blocages ne se résolvent pas tout seuls dans les délais utiles :
 *
 * - une analyse en échec définitif (`ANALYSIS_FAILED`) n'est plus jamais
 *   retentée — le balayage automatique ne s'occupe que des analyses *en cours*
 *   trop longues ;
 * - une prise en charge oubliée immobilise un dossier jusqu'à expiration du
 *   délai d'assignation, ce qui peut représenter des heures sur une urgence.
 *
 * Les deux routes existaient côté serveur sans aucun appelant. Cet écran est ce
 * qui leur manquait.
 */
export default function AdminRequests() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const query = useEcgRequests();
  const retry = useRetryEcgAnalysis();
  const release = useReleaseEcgRequest();

  const requests = useMemo(() => query.data ?? [], [query.data]);
  const rows = useMemo(() => requests.filter(FILTER_PREDICATE[filter]), [requests, filter]);

  const failed = requests.filter((r) => r.status === 'ANALYSIS_FAILED').length;
  const held = requests.filter((r) => r.status === 'UNDER_REVIEW').length;

  const handleRetry = async (row: EcgRequestSummary) => {
    const confirmed = await confirm({
      title: "Relancer l'analyse ?",
      text: `${row.reference} repassera en file d'analyse. La demande reste examinable pendant ce temps.`,
      confirmLabel: 'Relancer',
    });
    if (!confirmed) return;

    try {
      await retry.mutateAsync(row.id);
      notify.success('Analyse relancée', `${row.reference} attend un nouveau passage du moteur.`);
    } catch (error) {
      notify.error(
        'Relance impossible',
        error instanceof ApiError ? error.message : 'Veuillez réessayer.',
      );
    }
  };

  const handleRelease = async (row: EcgRequestSummary) => {
    const confirmed = await confirm({
      title: 'Libérer la demande ?',
      text: `${row.reference} retournera dans la file commune. Le cardiologue qui la détenait perdra sa prise en charge.`,
      confirmLabel: 'Libérer',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      await release.mutateAsync(row.id);
      notify.success('Demande libérée', `${row.reference} est de retour dans la file.`);
    } catch (error) {
      notify.error(
        'Libération impossible',
        error instanceof ApiError ? error.message : 'Veuillez réessayer.',
      );
    }
  };

  const columns: GridColDef<EcgRequestSummary>[] = [
    { field: 'reference', headerName: 'Référence', width: 110 },
    {
      field: 'patient',
      headerName: 'Patient',
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => row.patient.fullName,
    },
    {
      field: 'priorityLabel',
      headerName: 'Priorité',
      width: 100,
      renderCell: ({ row }) => <StatusChip status={row.priorityLabel} statusKey={row.priority} />,
    },
    {
      field: 'statusLabel',
      headerName: 'Statut',
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => <StatusChip status={row.statusLabel} statusKey={row.status} />,
    },
    {
      field: 'waitedMs',
      headerName: 'Ancienneté',
      width: 120,
      renderCell: ({ value }) => formatDuration(value as number),
    },
    {
      field: 'createdAt',
      headerName: 'Soumise le',
      width: 160,
      valueGetter: (value: string) => new Date(value),
      valueFormatter: (value: Date) => value.toLocaleString('fr-FR'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          {row.status === 'ANALYSIS_FAILED' && (
            <Tooltip title="Relancer l'analyse automatique">
              <Button
                size="small"
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={() => void handleRetry(row)}
              >
                Relancer
              </Button>
            </Tooltip>
          )}
          {row.status === 'UNDER_REVIEW' && (
            <Tooltip title="Libérer la prise en charge">
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<LockOpenIcon />}
                onClick={() => void handleRelease(row)}
              >
                Libérer
              </Button>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Stack spacing={3}>
        <PageHeader
          title="Supervision des demandes"
          subtitle="Débloquer les analyses en échec et les prises en charge oubliées"
        />

        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        >
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard label="Total" value={requests.length} color="primary" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard label="Analyses en échec" value={failed} color="error" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard label="En cours de validation" value={held} color="info" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard
                  label="Conclues"
                  value={requests.filter(FILTER_PREDICATE.concluded).length}
                  color="success"
                />
              </Grid>
            </Grid>

            {failed > 0 && (
              <InfoPanel
                tone="warning"
                title={`${failed} analyse${failed > 1 ? 's' : ''} en échec définitif`}
              >
                Le moteur a épuisé ses tentatives. Ces demandes restent examinables par un
                cardiologue — l'IA n'est pas un péage — mais leur analyse ne repartira pas
                d'elle-même.
              </InfoPanel>
            )}

            <SectionCard
              title="Demandes"
              action={
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {FILTERS.map((f) => (
                    <Chip
                      key={f.key}
                      label={`${f.label} (${requests.filter(FILTER_PREDICATE[f.key]).length})`}
                      color={filter === f.key ? f.color : 'default'}
                      variant={filter === f.key ? 'filled' : 'outlined'}
                      onClick={() => setFilter(f.key)}
                    />
                  ))}
                </Stack>
              }
              disableContentPadding
            >
              {rows.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', p: 3 }}>
                  Aucune demande dans cette catégorie.
                </Typography>
              ) : (
                <DataTable<EcgRequestSummary>
                  rows={rows}
                  columns={columns}
                  height={520}
                  initialState={{ sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] } }}
                />
              )}
            </SectionCard>
          </Stack>
        </QueryBoundary>
      </Stack>
    </DashboardLayout>
  );
}
