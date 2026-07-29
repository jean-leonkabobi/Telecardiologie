import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { useState } from 'react';
import { useLocation, useParams } from 'wouter';

import { DashboardLayout } from '@/components/DashboardLayout';
import { DetailItem } from '@/components/common/DetailItem';
import { InfoPanel } from '@/components/common/InfoPanel';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusChip } from '@/components/common/StatusChip';
import {
  useClaimEcgRequest,
  useEcgFileUrl,
  useEcgRequest,
  useReleaseEcgRequest,
  useReviewEcgRequest,
} from '@/api/hooks';
import type { EcgRequestFullDetail, ReviewAction } from '@/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/apiClient';
import { confirm, notify } from '@/lib/alerts';

const DECISION_TITLES: Record<ReviewAction, string> = {
  validate: 'Confirmer la validation',
  correct: "Corriger l'interprétation",
  reject: 'Motif du rejet',
};

const DECISION_SUCCESS: Record<ReviewAction, string> = {
  validate: 'Analyse validée',
  correct: 'Correction enregistrée',
  reject: 'Demande rejetée',
};

export default function ECGAnalysis() {
  const params = useParams<{ id: string }>();
  const query = useEcgRequest(params.id);

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        >
          {query.data && <AnalysisView request={query.data} />}
        </QueryBoundary>
      </Box>
    </DashboardLayout>
  );
}

function AnalysisView({ request }: { request: EcgRequestFullDetail }) {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const [decision, setDecision] = useState<ReviewAction | null>(null);
  const [comment, setComment] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [errors, setErrors] = useState<{ comment?: boolean; diagnosis?: boolean }>({});

  const claim = useClaimEcgRequest();
  const release = useReleaseEcgRequest();
  const review = useReviewEcgRequest();
  const fileUrl = useEcgFileUrl();

  const mine = request.assignedToId !== null && request.assignedToId === user?.id;
  const analysisRunning = request.status === 'PENDING_ANALYSIS' || request.status === 'ANALYZING';

  // « Corriger » impose les deux champs : sans conclusion de remplacement, la
  // correction ne dit pas ce qui remplace l'interprétation de l'IA.
  const commentRequired = decision === 'correct' || decision === 'reject';
  const diagnosisRequired = decision === 'validate' || decision === 'correct';

  const resetDecision = () => {
    setDecision(null);
    setComment('');
    setDiagnosis('');
    setErrors({});
  };

  const startDecision = (next: ReviewAction) => {
    setDecision(next);
    setErrors({});
    // Pré-remplir avec l'interprétation de l'IA fait gagner du temps sur une
    // validation, et donne un point de départ concret à une correction.
    setDiagnosis(next === 'reject' ? '' : (request.analysis?.interpretation ?? ''));
  };

  const handleClaim = async () => {
    try {
      await claim.mutateAsync(request.id);
      notify.success('Demande prise en charge', `${request.reference} vous est assignée.`);
    } catch (error) {
      notify.error(
        'Prise en charge impossible',
        error instanceof ApiError ? error.message : 'Veuillez réessayer.',
      );
    }
  };

  const handleRelease = async () => {
    const confirmed = await confirm({
      title: 'Relâcher la demande ?',
      text: 'Elle retournera dans la file commune et un confrère pourra la reprendre.',
      confirmLabel: 'Relâcher',
    });
    if (!confirmed) return;

    try {
      await release.mutateAsync(request.id);
      notify.success('Demande relâchée', `${request.reference} est de retour dans la file.`);
      navigate('/queue');
    } catch (error) {
      notify.error(
        'Impossible de relâcher',
        error instanceof ApiError ? error.message : 'Veuillez réessayer.',
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) return;

    const nextErrors = {
      comment: commentRequired && comment.trim() === '',
      diagnosis: diagnosisRequired && diagnosis.trim() === '',
    };
    if (nextErrors.comment || nextErrors.diagnosis) {
      setErrors(nextErrors);
      notify.error('Formulaire incomplet', 'Les champs obligatoires doivent être renseignés.');
      return;
    }

    try {
      await review.mutateAsync({
        id: request.id,
        decision,
        comment: comment.trim() === '' ? undefined : comment.trim(),
        finalDiagnosis: diagnosis.trim() === '' ? undefined : diagnosis.trim(),
      });
      notify.success(DECISION_SUCCESS[decision], `${request.reference} est conclue.`);
      navigate('/queue');
    } catch (error) {
      notify.error(
        'Enregistrement impossible',
        error instanceof ApiError ? error.message : 'Veuillez réessayer.',
      );
    }
  };

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
      <PageHeader
        title="Analyse ECG"
        subtitle={`${request.reference} · ${request.patient.fullName}`}
        action={
          <Stack direction="row" spacing={1}>
            <StatusChip status={request.priorityLabel} statusKey={request.priority} size="medium" />
            <StatusChip status={request.statusLabel} statusKey={request.status} size="medium" />
          </Stack>
        }
      />

      {request.status !== 'UNDER_REVIEW' && request.reviewedAt === null && !analysisRunning && (
        <InfoPanel tone="warning" title="Demande non prise en charge">
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="body2">
              Vous devez prendre la demande en charge avant de pouvoir rendre une conclusion.
            </Typography>
            <Button variant="contained" onClick={() => void handleClaim()} loading={claim.isPending}>
              Prendre en charge
            </Button>
          </Stack>
        </InfoPanel>
      )}

      {request.status === 'UNDER_REVIEW' && !mine && (
        <InfoPanel tone="warning" title="Demande détenue par un confrère">
          {request.assignedToName ?? 'Un autre cardiologue'} examine actuellement ce tracé.
        </InfoPanel>
      )}

      {request.reviewedAt !== null && (
        <InfoPanel tone="info" title={`Conclusion rendue — ${request.reviewDecisionLabel}`}>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {request.finalDiagnosis && (
              <DetailItem label="Diagnostic retenu" value={request.finalDiagnosis} />
            )}
            {request.reviewComment && (
              <DetailItem label="Commentaire" value={request.reviewComment} />
            )}
            <DetailItem
              label="Par"
              value={`${request.reviewedByName ?? '—'} le ${new Date(request.reviewedAt).toLocaleString('fr-FR')}`}
            />
          </Stack>
        </InfoPanel>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Informations du patient">
            <Stack spacing={2}>
              <DetailItem label="Nom" value={request.patient.fullName} />
              <DetailItem label="Référence patient" value={request.patient.reference} />
              <DetailItem label="Âge" value={`${request.patient.age} ans`} />
              <DetailItem label="Sexe" value={request.patient.genderLabel} />
              <DetailItem label="Symptômes" value={request.symptoms} />
              <DetailItem label="Contexte clinique" value={request.clinicalContext ?? '—'} />
              <DetailItem label="Antécédents" value={request.medicalHistory ?? '—'} />
              <DetailItem label="Commentaires" value={request.additionalComments ?? '—'} />
              <Divider />
              <DetailItem
                label="Soumise par"
                value={`${request.submittedByName ?? '—'} le ${new Date(request.createdAt).toLocaleString('fr-FR')}`}
              />
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Tracé ECG">
            <Stack spacing={2}>
              {/*
                Aperçu décoratif : ce tracé est statique, il ne reflète pas le
                signal du patient. Un rendu ECG réel (12 dérivations, grille
                25 mm/s · 10 mm/mV) reste à implémenter — le fichier original
                est en revanche téléchargeable ci-dessous.
              */}
              <Paper
                variant="outlined"
                sx={{
                  bgcolor: 'surfaceMuted',
                  p: 3,
                  minHeight: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Stack spacing={1.5} sx={{ width: '100%', alignItems: 'center' }}>
                  <Box
                    component="svg"
                    viewBox="0 0 300 100"
                    preserveAspectRatio="none"
                    sx={{ width: '100%', height: 128, color: 'primary.main', opacity: 0.35 }}
                  >
                    <polyline
                      points="0,50 10,50 15,40 20,50 30,50 40,45 50,50 60,50 70,35 80,50 90,50 100,48 110,50 120,50 130,40 140,50 150,50 160,45 170,50 180,50 190,35 200,50 210,50 220,48 230,50 240,50 250,40 260,50 270,50 280,45 290,50 300,50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Aperçu — le fichier réel est {request.file.name}
                  </Typography>
                </Stack>
              </Paper>

              <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                <Tooltip title="Télécharger le tracé original">
                  <span>
                    <IconButton onClick={() => void handleDownload()} disabled={fileUrl.isPending}>
                      <DownloadIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>

              <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                {request.file.mimeType} · {(request.file.sizeBytes / 1024).toFixed(0)} Ko
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Interprétation">
            <Stack spacing={2}>
              {analysisRunning && (
                <InfoPanel title="Analyse en cours">
                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Le moteur d'analyse traite le tracé. Cette page se met à jour toute seule.
                    </Typography>
                    <LinearProgress />
                  </Stack>
                </InfoPanel>
              )}

              {!analysisRunning && request.analysis === null && (
                <InfoPanel tone="warning" title="Analyse automatique indisponible">
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      {request.analysisFailureReason ??
                        "Le moteur d'analyse n'a pas pu traiter ce tracé."}
                    </Typography>
                    <Typography variant="caption">
                      {request.analysisAttempts} tentative
                      {request.analysisAttempts > 1 ? 's' : ''}. Le tracé reste consultable : votre
                      lecture prime sur l'aide automatique.
                    </Typography>
                  </Stack>
                </InfoPanel>
              )}

              {request.analysis && !request.analysis.measuredSignal && (
                <InfoPanel tone="warning" title="Tracé non lu par l'analyseur">
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Aucune mesure n'a pu être extraite du fichier : l'avis ci-dessous s'appuie
                    uniquement sur le dossier clinique. Rythme et fréquence restent à établir par
                    votre lecture.
                  </Typography>
                </InfoPanel>
              )}

              {request.analysis && (
                <InfoPanel title="Interprétation proposée par l'IA">
                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                    <DetailItem label="Rythme" value={request.analysis.rhythmLabel} />
                    <DetailItem
                      label="Fréquence cardiaque"
                      value={request.analysis.heartRateLabel}
                    />
                    <DetailItem
                      label={
                        request.analysis.measuredSignal ? 'Anomalies' : 'Points à vérifier'
                      }
                      value={
                        request.analysis.anomalies.length === 0 ? (
                          'Aucune anomalie détectée'
                        ) : (
                          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                            {request.analysis.anomalies.map((anomaly) => (
                              <Chip key={anomaly} label={anomaly} size="small" color="warning" />
                            ))}
                          </Stack>
                        )
                      }
                    />
                    <DetailItem
                      label="Score de confiance"
                      value={request.analysis.confidenceLabel}
                    />
                    <DetailItem label="Conclusion" value={request.analysis.interpretation} />
                    <Divider />
                    <Typography variant="caption">
                      Modèle {request.analysis.modelVersion} · aide à la décision, non validée.
                    </Typography>
                  </Stack>
                </InfoPanel>
              )}

              {mine && !decision && (
                <Stack spacing={1.5}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Avis du cardiologue
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => startDecision('validate')}
                    >
                      Valider
                    </Button>
                    <Button fullWidth variant="outlined" onClick={() => startDecision('correct')}>
                      Corriger
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      startIcon={<CloseIcon />}
                      onClick={() => startDecision('reject')}
                    >
                      Rejeter
                    </Button>
                  </Stack>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => void handleRelease()}
                    loading={release.isPending}
                  >
                    Relâcher la demande
                  </Button>
                </Stack>
              )}

              {mine && decision && (
                <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {DECISION_TITLES[decision]}
                  </Typography>

                  {diagnosisRequired && (
                    <TextField
                      label="Diagnostic retenu"
                      placeholder="Conclusion médicale qui fait foi…"
                      multiline
                      rows={3}
                      required
                      error={errors.diagnosis === true}
                      helperText={errors.diagnosis === true ? 'Le diagnostic est obligatoire.' : ' '}
                      value={diagnosis}
                      onChange={(e) => {
                        setDiagnosis(e.target.value);
                        if (errors.diagnosis === true) setErrors((p) => ({ ...p, diagnosis: false }));
                      }}
                    />
                  )}

                  <TextField
                    label="Commentaire"
                    placeholder={
                      commentRequired ? 'Commentaire obligatoire…' : 'Commentaire optionnel…'
                    }
                    multiline
                    rows={3}
                    required={commentRequired}
                    error={errors.comment === true}
                    helperText={
                      errors.comment === true
                        ? 'Un commentaire est obligatoire pour cette action.'
                        : ' '
                    }
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      if (errors.comment === true) setErrors((p) => ({ ...p, comment: false }));
                    }}
                  />

                  <Stack direction="row" spacing={1}>
                    <Button fullWidth variant="outlined" onClick={resetDecision}>
                      Annuler
                    </Button>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      loading={review.isPending}
                      color={
                        decision === 'validate'
                          ? 'success'
                          : decision === 'reject'
                            ? 'error'
                            : 'primary'
                      }
                    >
                      Confirmer
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
