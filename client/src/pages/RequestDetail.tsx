import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { useLocation, useParams } from 'wouter';

import { DashboardLayout } from '@/components/DashboardLayout';
import { DetailItem } from '@/components/common/DetailItem';
import { InfoPanel } from '@/components/common/InfoPanel';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusChip } from '@/components/common/StatusChip';
import { useEcgFileUrl, useEcgRequest } from '@/api/hooks';
import type { EcgRequestFullDetail } from '@/api/types';
import { ApiError } from '@/lib/apiClient';
import { notify } from '@/lib/alerts';

export default function RequestDetail() {
  const params = useParams<{ id: string }>();
  const query = useEcgRequest(params.id);

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        >
          {query.data && <RequestView request={query.data} />}
        </QueryBoundary>
      </Box>
    </DashboardLayout>
  );
}

/** Ton de l'encadré de conclusion selon la décision rendue. */
const CONCLUSION_TONE = {
  VALIDATED: 'success',
  CORRECTED: 'info',
  REJECTED: 'error',
} as const;

function RequestView({ request }: { request: EcgRequestFullDetail }) {
  const [, navigate] = useLocation();
  const fileUrl = useEcgFileUrl();

  const analysisRunning = request.status === 'PENDING_ANALYSIS' || request.status === 'ANALYZING';

  const handleDownload = async () => {
    try {
      const { url } = await fileUrl.mutateAsync(request.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      notify.error(
        'Téléchargement impossible',
        error instanceof ApiError ? error.message : 'Veuillez réessayer.',
      );
    }
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Tooltip title="Retour aux demandes">
            <IconButton onClick={() => navigate('/my-requests')}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h1">{request.reference}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Créée le {new Date(request.createdAt).toLocaleString('fr-FR')}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <StatusChip status={request.priorityLabel} statusKey={request.priority} size="medium" />
          <StatusChip status={request.statusLabel} statusKey={request.status} size="medium" />
        </Stack>
      </Stack>

      {analysisRunning && (
        <InfoPanel title="Analyse automatique en cours">
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="body2">
              Le tracé est en cours de traitement. Cette page se met à jour toute seule, puis la
              demande entrera dans la file d'un cardiologue.
            </Typography>
            <LinearProgress />
          </Stack>
        </InfoPanel>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <SectionCard title="Informations du patient">
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <DetailItem label="Nom" value={request.patient.fullName} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <DetailItem label="Âge" value={`${request.patient.age} ans`} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <DetailItem label="Identifiant" value={request.patient.reference} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <DetailItem label="Sexe" value={request.patient.genderLabel} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <DetailItem
                    label="Date de naissance"
                    value={new Date(request.patient.birthDate).toLocaleDateString('fr-FR')}
                  />
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard title="Contexte clinique">
              <Stack spacing={2}>
                <DetailItem label="Symptômes" value={request.symptoms} />
                <DetailItem label="Contexte" value={request.clinicalContext ?? '—'} />
                <DetailItem label="Antécédents" value={request.medicalHistory ?? '—'} />
                <DetailItem label="Commentaires" value={request.additionalComments ?? '—'} />
              </Stack>
            </SectionCard>

            <SectionCard title="Résultat final">
              {request.reviewedAt === null ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Aucun cardiologue n'a encore rendu de conclusion.
                  {request.assignedToName !== null &&
                    ` La demande est prise en charge par ${request.assignedToName}.`}
                </Typography>
              ) : (
                <InfoPanel
                  tone={CONCLUSION_TONE[request.reviewDecision ?? 'VALIDATED']}
                  title={request.reviewDecisionLabel ?? 'Conclusion'}
                  hideIcon
                >
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {request.finalDiagnosis !== null && (
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {request.finalDiagnosis}
                      </Typography>
                    )}
                    {request.reviewComment !== null && (
                      <Typography variant="body2">
                        <strong>Commentaires : </strong>
                        {request.reviewComment}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Par {request.reviewedByName ?? '—'} le{' '}
                      {new Date(request.reviewedAt).toLocaleString('fr-FR')}
                    </Typography>
                  </Stack>
                </InfoPanel>
              )}
            </SectionCard>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <SectionCard title="Analyse IA">
              {request.analysis === null ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {analysisRunning
                    ? 'Analyse en cours…'
                    : (request.analysisFailureReason ??
                      "L'analyse automatique n'a pas abouti. Le cardiologue lit le tracé directement.")}
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {!request.analysis.measuredSignal && (
                    <Typography variant="caption" sx={{ color: 'warning.main' }}>
                      Le tracé n'a pas pu être lu automatiquement : cet avis ne remplace pas la
                      lecture du cardiologue.
                    </Typography>
                  )}
                  <DetailItem label="Rythme" value={request.analysis.rhythmLabel} />
                  <DetailItem label="Fréquence" value={request.analysis.heartRateLabel} />
                  <DetailItem
                    label={request.analysis.measuredSignal ? 'Anomalies' : 'Points à vérifier'}
                    value={
                      request.analysis.anomalies.length === 0 ? (
                        'Aucune anomalie significative détectée'
                      ) : (
                        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          {request.analysis.anomalies.map((anomaly) => (
                            <Chip key={anomaly} label={anomaly} size="small" color="warning" />
                          ))}
                        </Stack>
                      )
                    }
                  />
                  <DetailItem label="Confiance" value={request.analysis.confidenceLabel} />
                </Stack>
              )}
            </SectionCard>

            <SectionCard title="Progression">
              {/*
                La chronologie est dérivée des horodatages de la demande, jamais
                du journal d'audit : celui-ci est réservé aux administrateurs.
              */}
              <Stack spacing={0}>
                {request.timeline.map((item, idx) => (
                  <Stack key={`${item.at}-${item.event}`} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center', pt: 0.75 }}>
                      <Box
                        sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }}
                      />
                      {idx < request.timeline.length - 1 && (
                        <Divider
                          orientation="vertical"
                          flexItem
                          sx={{ minHeight: 40, my: 0.5 }}
                        />
                      )}
                    </Stack>
                    <Box sx={{ pb: idx < request.timeline.length - 1 ? 2 : 0 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {new Date(item.at).toLocaleString('fr-FR')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.event}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {item.actor}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </SectionCard>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => void handleDownload()}
              loading={fileUrl.isPending}
            >
              Télécharger le tracé
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
