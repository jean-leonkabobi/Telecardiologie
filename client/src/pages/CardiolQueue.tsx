import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import { useLocation } from 'wouter';

import { DashboardLayout } from '@/components/DashboardLayout';
import { DetailItem } from '@/components/common/DetailItem';
import { EmptyState } from '@/components/common/EmptyState';
import { InfoPanel } from '@/components/common/InfoPanel';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { StatCard } from '@/components/common/StatCard';
import { StatusChip } from '@/components/common/StatusChip';
import { useClaimEcgRequest, useReviewQueue } from '@/api/hooks';
import { formatDuration, type QueueItem } from '@/api/types';
import { ApiError } from '@/lib/apiClient';
import { notify } from '@/lib/alerts';

export default function CardiolQueue() {
  const [, navigate] = useLocation();
  const queue = useReviewQueue();
  const claim = useClaimEcgRequest();

  const items = queue.data ?? [];
  const mine = items.filter((item) => item.mine);
  const available = items.filter((item) => !item.mine);
  const urgentCount = available.filter((item) => item.priority === 'URGENT').length;

  const handleClaim = async (item: QueueItem): Promise<void> => {
    try {
      await claim.mutateAsync(item.id);
      notify.success('Demande prise en charge', `${item.reference} vous est assignée.`);
      navigate(`/analyze/${item.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'REQUEST_ALREADY_ASSIGNED') {
        // Un confrère a été plus rapide. L'invalidation du cache rafraîchit la
        // file toute seule : inutile de demander à l'utilisateur de recharger.
        notify.warning('Trop tard', error.message);
        return;
      }
      notify.error(
        'Prise en charge impossible',
        error instanceof ApiError ? error.message : 'Veuillez réessayer.',
      );
    }
  };

  return (
    <DashboardLayout>
      <Stack spacing={3}>
        <PageHeader
          title="File d'attente"
          subtitle="Demandes analysées, en attente de votre validation"
        />

        <QueryBoundary
          isLoading={queue.isLoading}
          error={queue.error}
          onRetry={() => void queue.refetch()}
        >
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <StatCard label="Disponibles" value={available.length} color="primary" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <StatCard label="Urgentes" value={urgentCount} color="error" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <StatCard label="En cours chez vous" value={mine.length} color="info" />
              </Grid>
            </Grid>

            {urgentCount > 0 && (
              <InfoPanel
                tone="error"
                title={`${urgentCount} demande${urgentCount > 1 ? 's' : ''} urgente${urgentCount > 1 ? 's' : ''} en attente`}
              >
                Les demandes urgentes sont présentées en premier dans la file.
              </InfoPanel>
            )}

            {mine.length > 0 && (
              <Stack spacing={2}>
                <Typography variant="h3">Vos demandes en cours</Typography>
                {mine.map((item) => (
                  <QueueCard
                    key={item.id}
                    item={item}
                    position={null}
                    actionLabel="Reprendre l'analyse"
                    onAction={() => navigate(`/analyze/${item.id}`)}
                    pending={false}
                  />
                ))}
              </Stack>
            )}

            {available.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<CheckCircleIcon fontSize="inherit" sx={{ color: 'success.main' }} />}
                  title="Aucune demande en attente"
                  description="Toutes les demandes analysées ont été prises en charge."
                />
              </Card>
            ) : (
              <Stack spacing={2}>
                <Typography variant="h3">À prendre en charge</Typography>
                {available.map((item, index) => (
                  <QueueCard
                    key={item.id}
                    item={item}
                    position={index + 1}
                    actionLabel="Prendre en charge"
                    onAction={() => void handleClaim(item)}
                    /**
                     * Seule la carte cliquée passe en attente.
                     *
                     * `claim.isPending` seul était vrai pour **toutes** les
                     * cartes : prendre une demande en charge faisait tourner les
                     * trente boutons de la file, sans qu'on sache lequel agissait
                     * — ni s'il fallait cliquer ailleurs.
                     *
                     * `claim.variables` porte l'identifiant de la mutation en
                     * cours, ce qui évite un état local à tenir à jour.
                     */
                    pending={claim.isPending && claim.variables === item.id}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </QueryBoundary>
      </Stack>
    </DashboardLayout>
  );
}

interface QueueCardProps {
  item: QueueItem;
  position: number | null;
  actionLabel: string;
  onAction: () => void;
  pending: boolean;
}

function QueueCard({ item, position, actionLabel, onAction, pending }: QueueCardProps) {
  const urgent = item.priority === 'URGENT';

  return (
    <Card sx={{ borderColor: urgent ? 'error.main' : 'divider', borderWidth: urgent ? 2 : 1 }}>
      <CardContent>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { md: 'flex-start' } }}
        >
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontWeight: 700 }}>
            {position ?? '•'}
          </Avatar>

          <Stack spacing={1.5} sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="h3">{item.patient.fullName}</Typography>
              <StatusChip status={item.priorityLabel} statusKey={item.priority} />
              {/* Le motif de l'examen, sur la carte : c'est ce qui permet de
                  hiérarchiser la file sans ouvrir chaque dossier. Une douleur
                  thoracique et un bilan préopératoire ne s'attendent pas. */}
              <Chip label={item.indicationLabel} color="primary" variant="outlined" />
              <Chip label={item.reference} variant="outlined" />
              {/* L'analyse a pu échouer : le tracé reste consultable. */}
              {item.status === 'ANALYSIS_FAILED' && (
                <Chip label="Analyse IA indisponible" color="warning" />
              )}
              {/* Sollicitation venue d'une autre structure : le cardiologue doit
                  savoir qu'il sort de son périmètre habituel. */}
              {item.openToExternalReview && (
                <Chip label="Expertise externe demandée" color="info" variant="outlined" />
              )}
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6, md: 3 }}>
                <DetailItem label="Âge" value={`${item.patient.age} ans`} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <DetailItem label="Symptômes" value={item.symptoms} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <DetailItem
                  label="Confiance IA"
                  value={item.confidence === null ? '—' : `${Math.round(item.confidence * 100)} %`}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <DetailItem
                  label="En attente depuis"
                  value={
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <AccessTimeIcon sx={{ fontSize: 14 }} />
                      <span>{formatDuration(item.waitedMs)}</span>
                    </Stack>
                  }
                />
              </Grid>
            </Grid>

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Soumise par {item.submittedByName ?? 'un professionnel'} le{' '}
              {new Date(item.createdAt).toLocaleString('fr-FR')}
            </Typography>
          </Stack>

          <Button variant="contained" onClick={onAction} loading={pending} sx={{ flexShrink: 0 }}>
            {actionLabel}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
