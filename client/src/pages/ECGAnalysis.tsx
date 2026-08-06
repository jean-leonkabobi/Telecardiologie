import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { useState } from "react";
import { useLocation, useParams } from "wouter";

import { DashboardLayout } from "@/components/DashboardLayout";
import { DetailItem } from "@/components/common/DetailItem";
import { InfoPanel } from "@/components/common/InfoPanel";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusChip } from "@/components/common/StatusChip";
import {
  useClaimEcgRequest,
  useEcgFileUrl,
  useEcgReport,
  useEcgRequest,
  useEcgWaveform,
  useReleaseEcgRequest,
  useReviewEcgRequest,
} from "@/api/hooks";
import type {
  EcgAnalysisResult,
  EcgRequestFullDetail,
  ReviewAction,
} from "@/api/types";
import { EcgDocumentViewer } from "@/components/ecg/EcgDocumentViewer";
import { EcgRecordingContext } from "@/components/ecg/EcgRecordingContext";
import { EcgWaveformViewer } from "@/components/ecg/EcgWaveformViewer";
import { describeRedFlag, hasCriticalFlag } from "@/api/redFlags";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/apiClient";
import { triggerDownload } from "@/lib/download";
import { confirm, notify } from "@/lib/alerts";

/**
 * Rend les intervalles sous forme compacte, ou rien s'ils sont tous absents.
 *
 * Afficher « PR : — · QRS : — » sur un tracé non mesuré n'informerait pas, il
 * encombrerait.
 */
function formatIntervals(
  intervals: EcgAnalysisResult["intervals"]
): string | null {
  const parties = [
    intervals.prMs !== null && `PR ${intervals.prMs} ms`,
    intervals.qrsMs !== null && `QRS ${intervals.qrsMs} ms`,
    intervals.qtMs !== null && `QT ${intervals.qtMs} ms`,
    intervals.qtcMs !== null && `QTc ${intervals.qtcMs} ms`,
    intervals.axisDegrees !== null && `axe ${intervals.axisDegrees}°`,
  ].filter((p): p is string => typeof p === "string");

  return parties.length > 0 ? parties.join(" · ") : null;
}

const DECISION_TITLES: Record<ReviewAction, string> = {
  validate: "Confirmer la validation",
  correct: "Corriger l'interprétation",
  reject: "Motif du rejet",
};

const DECISION_SUCCESS: Record<ReviewAction, string> = {
  validate: "Analyse validée",
  correct: "Correction enregistrée",
  reject: "Demande rejetée",
};

export default function ECGAnalysis() {
  const params = useParams<{ id: string }>();
  const query = useEcgRequest(params.id);

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1280, mx: "auto" }}>
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
  const [comment, setComment] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [errors, setErrors] = useState<{
    comment?: boolean;
    diagnosis?: boolean;
  }>({});

  const claim = useClaimEcgRequest();
  const release = useReleaseEcgRequest();
  const review = useReviewEcgRequest();
  const fileUrl = useEcgFileUrl();
  const report = useEcgReport();
  const waveform = useEcgWaveform(request.id);

  const mine =
    request.assignedToId !== null && request.assignedToId === user?.id;
  const analysisRunning =
    request.status === "PENDING_ANALYSIS" || request.status === "ANALYZING";

  // « Corriger » impose les deux champs : sans conclusion de remplacement, la
  // correction ne dit pas ce qui remplace l'interprétation de l'IA.
  const commentRequired = decision === "correct" || decision === "reject";
  const diagnosisRequired = decision === "validate" || decision === "correct";

  const resetDecision = () => {
    setDecision(null);
    setComment("");
    setDiagnosis("");
    setErrors({});
  };

  const startDecision = (next: ReviewAction) => {
    setDecision(next);
    setErrors({});
    // Pré-remplir avec l'interprétation de l'IA fait gagner du temps sur une
    // validation, et donne un point de départ concret à une correction.
    setDiagnosis(
      next === "reject" ? "" : (request.analysis?.interpretation ?? "")
    );
  };

  const handleClaim = async () => {
    try {
      await claim.mutateAsync(request.id);
      notify.success(
        "Demande prise en charge",
        `${request.reference} vous est assignée.`
      );
    } catch (error) {
      notify.error(
        "Prise en charge impossible",
        error instanceof ApiError ? error.message : "Veuillez réessayer."
      );
    }
  };

  const handleRelease = async () => {
    const confirmed = await confirm({
      title: "Relâcher la demande ?",
      text: "Elle retournera dans la file commune et un confrère pourra la reprendre.",
      confirmLabel: "Relâcher",
    });
    if (!confirmed) return;

    try {
      await release.mutateAsync(request.id);
      notify.success(
        "Demande relâchée",
        `${request.reference} est de retour dans la file.`
      );
      navigate("/queue");
    } catch (error) {
      notify.error(
        "Impossible de relâcher",
        error instanceof ApiError ? error.message : "Veuillez réessayer."
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) return;

    const nextErrors = {
      comment: commentRequired && comment.trim() === "",
      diagnosis: diagnosisRequired && diagnosis.trim() === "",
    };
    if (nextErrors.comment || nextErrors.diagnosis) {
      setErrors(nextErrors);
      notify.error(
        "Formulaire incomplet",
        "Les champs obligatoires doivent être renseignés."
      );
      return;
    }

    try {
      await review.mutateAsync({
        id: request.id,
        decision,
        comment: comment.trim() === "" ? undefined : comment.trim(),
        finalDiagnosis: diagnosis.trim() === "" ? undefined : diagnosis.trim(),
      });
      notify.success(
        DECISION_SUCCESS[decision],
        `${request.reference} est conclue.`
      );
      navigate("/queue");
    } catch (error) {
      notify.error(
        "Enregistrement impossible",
        error instanceof ApiError ? error.message : "Veuillez réessayer."
      );
    }
  };

  /**
   * Télécharge le compte rendu PDF.
   *
   * Action principale : c'est le document lisible et versable au dossier. Le
   * fichier d'origine reste accessible à côté, mais un XML brut n'a d'intérêt que
   * pour un autre logiciel.
   */
  const handleReport = async () => {
    try {
      const { url, fileName } = await report.mutateAsync(request.id);
      triggerDownload(url, fileName);
      // L'objet URL est révoqué après le clic : sans cela le blob resterait en
      // mémoire jusqu'au rechargement de la page.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      notify.error(
        "Compte rendu indisponible",
        error instanceof ApiError ? error.message : "Veuillez réessayer."
      );
    }
  };

  const handleDownload = async () => {
    try {
      const { url, fileName } = await fileUrl.mutateAsync(request.id);
      triggerDownload(url, fileName);
    } catch (error) {
      notify.error(
        "Téléchargement impossible",
        error instanceof ApiError ? error.message : "Veuillez réessayer."
      );
    }
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Analyse ECG"
        subtitle={`${request.reference} · ${request.patient.fullName}`}
        backTo={{ href: "/queue", label: "Retour à la file d'attente" }}
        action={
          <Stack direction="row" spacing={1}>
            <StatusChip
              status={request.priorityLabel}
              statusKey={request.priority}
              size="medium"
            />
            <StatusChip
              status={request.statusLabel}
              statusKey={request.status}
              size="medium"
            />
          </Stack>
        }
      />

      {request.status !== "UNDER_REVIEW" &&
        request.reviewedAt === null &&
        !analysisRunning && (
          <InfoPanel tone="warning" title="Demande non prise en charge">
            <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
              <Typography variant="body2">
                Vous devez prendre la demande en charge avant de pouvoir rendre
                une conclusion.
              </Typography>
              <Button
                variant="contained"
                onClick={() => void handleClaim()}
                loading={claim.isPending}
              >
                Prendre en charge
              </Button>
            </Stack>
          </InfoPanel>
        )}

      {request.openToExternalReview && (
        <InfoPanel tone="info" title="Sollicitation hors structure">
          <Stack spacing={0.75} sx={{ mt: 1 }}>
            <Typography variant="body2">
              Cette demande a été ouverte à un avis extérieur à l'établissement
              d'origine
              {request.externalReviewRequestedAt !== null &&
                ` le ${new Date(request.externalReviewRequestedAt).toLocaleString("fr-FR")}`}
              .
            </Typography>
            {request.externalReviewReason !== null && (
              <DetailItem
                label="Motif invoqué"
                value={request.externalReviewReason}
              />
            )}
          </Stack>
        </InfoPanel>
      )}

      {request.status === "UNDER_REVIEW" && !mine && (
        <InfoPanel tone="warning" title="Demande détenue par un confrère">
          {request.assignedToName ?? "Un autre cardiologue"} examine
          actuellement ce tracé.
        </InfoPanel>
      )}

      {request.reviewedAt !== null && (
        <InfoPanel
          tone="info"
          title={`Conclusion rendue — ${request.reviewDecisionLabel}`}
        >
          <Stack spacing={1} sx={{ mt: 1 }}>
            {request.finalDiagnosis && (
              <DetailItem
                label="Diagnostic retenu"
                value={request.finalDiagnosis}
              />
            )}
            {request.reviewComment && (
              <DetailItem label="Commentaire" value={request.reviewComment} />
            )}
            <DetailItem
              label="Par"
              value={`${request.reviewedByName ?? "—"} le ${new Date(request.reviewedAt).toLocaleString("fr-FR")}`}
            />
          </Stack>
        </InfoPanel>
      )}

      <Grid container spacing={3}>
        {/**
         * Le tracé occupe toute la largeur, et vient en premier.
         *
         * Il était logé dans une colonne d'un tiers, à côté de l'identité et de
         * l'interprétation. Or un ECG douze dérivations à l'échelle réglementaire
         * demande environ mille pixels : dans un tiers d'écran, la disposition ne
         * pouvait afficher que deux des quatre groupes de colonnes — V1 à V6
         * n'apparaissaient jamais, sans que rien ne le signale.
         *
         * C'est aussi la pièce sur laquelle porte la décision : la mettre en tête
         * suit l'ordre dans lequel le cardiologue travaille — il regarde le tracé,
         * puis confronte l'interprétation proposée.
         */}
        <Grid size={12}>
          <SectionCard title="Tracé ECG">
            <Stack spacing={2}>
              {waveform.isLoading && <LinearProgress />}

              {/**
               * Deux façons de voir le tracé, selon ce que porte le fichier.
               *
               * Un export XML donne les échantillons : le tracé est redessiné aux
               * conventions de l'électrocardiographe, mesurable, avec vitesse et
               * gain réglables. Un PDF ou une photo porte un dessin : c'est le
               * document lui-même qu'il faut montrer.
               *
               * L'écran affichait auparavant un avertissement invitant à
               * télécharger le fichier — ce qui obligeait le cardiologue à quitter
               * l'écran d'analyse pour voir ce sur quoi il doit se prononcer.
               */}
              {waveform.data?.waveform ? (
                <EcgWaveformViewer waveform={waveform.data.waveform} />
              ) : (
                <Stack spacing={1.5}>
                  <EcgDocumentViewer
                    requestId={request.id}
                    file={request.file}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Document d'origine. Les exports XML des électrocardiographes
                    (HL7 aECG, formats constructeur) sont redessinés ici en 12
                    dérivations, avec vitesse et gain réglables.
                  </Typography>
                </Stack>
              )}

              <Stack
                direction="row"
                spacing={1}
                sx={{ justifyContent: "flex-start", flexWrap: "wrap", gap: 1 }}
              >
                <Button
                  variant="contained"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={() => void handleReport()}
                  loading={report.isPending}
                >
                  Compte rendu PDF
                </Button>
                <Tooltip title="Fichier d'origine, tel qu'il a été déposé">
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => void handleDownload()}
                      loading={fileUrl.isPending}
                    >
                      Fichier source
                    </Button>
                  </span>
                </Tooltip>
              </Stack>

              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {request.file.name} · {request.file.mimeType} ·{" "}
                {(request.file.sizeBytes / 1024).toFixed(0)} Ko
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Informations du patient">
            <Stack spacing={2}>
              <DetailItem label="Nom" value={request.patient.fullName} />
              <DetailItem
                label="Référence patient"
                value={request.patient.reference}
              />
              <DetailItem label="Âge" value={`${request.patient.age} ans`} />
              <DetailItem label="Sexe" value={request.patient.genderLabel} />
              <Divider />
              {/* Les conditions de l'enregistrement avant les symptômes : elles
                  disent comment lire le tracé, pas seulement pourquoi il a été
                  demandé. */}
              <EcgRecordingContext
                indicationLabel={request.indicationLabel}
                recording={request.recording}
              />
              <Divider />
              <DetailItem label="Symptômes" value={request.symptoms} />
              <DetailItem
                label="Contexte clinique"
                value={request.clinicalContext ?? "—"}
              />
              <DetailItem
                label="Antécédents"
                value={request.medicalHistory ?? "—"}
              />
              <DetailItem
                label="Commentaires"
                value={request.additionalComments ?? "—"}
              />
              <Divider />
              <DetailItem
                label="Soumise par"
                value={`${request.submittedByName ?? "—"} le ${new Date(request.createdAt).toLocaleString("fr-FR")}`}
              />
            </Stack>
          </SectionCard>
        </Grid>

        {/* Deux tiers pour l'interprétation et la conclusion, un tiers pour
            l'identité : le tracé ayant pris sa propre ligne, laisser trois
            colonnes de quatre laissait un vide d'un tiers en bout de rangée. Et
            c'est ici qu'on lit et qu'on rédige — le champ de diagnostic mérite
            plus large qu'une liste de six lignes. */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard title="Interprétation et conclusion">
            <Stack spacing={2}>
              {analysisRunning && (
                <InfoPanel title="Analyse en cours">
                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Le moteur d'analyse traite le tracé. Cette page se met à
                      jour toute seule.
                    </Typography>
                    <LinearProgress />
                  </Stack>
                </InfoPanel>
              )}

              {!analysisRunning && request.analysis === null && (
                <InfoPanel
                  tone="warning"
                  title="Analyse automatique indisponible"
                >
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      {request.analysisFailureReason ??
                        "Le moteur d'analyse n'a pas pu traiter ce tracé."}
                    </Typography>
                    <Typography variant="caption">
                      {request.analysisAttempts} tentative
                      {request.analysisAttempts > 1 ? "s" : ""}. Le tracé reste
                      consultable : votre lecture prime sur l'aide automatique.
                    </Typography>
                  </Stack>
                </InfoPanel>
              )}

              {request.analysis && request.analysis.redFlags.length > 0 && (
                <InfoPanel
                  tone={
                    hasCriticalFlag(request.analysis.redFlags)
                      ? "error"
                      : "warning"
                  }
                  title={
                    hasCriticalFlag(request.analysis.redFlags)
                      ? "Signes d’alarme — demande passée en urgence"
                      : "Points de vigilance mesurés"
                  }
                >
                  <Stack spacing={1.25} sx={{ mt: 1 }}>
                    {request.analysis.redFlags.map(code => {
                      const flag = describeRedFlag(code);
                      return (
                        <Stack key={code} spacing={0.25}>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: "center" }}
                          >
                            <Chip
                              label={flag.label}
                              size="small"
                              color={
                                flag.severity === "critical"
                                  ? "error"
                                  : "warning"
                              }
                            />
                          </Stack>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {flag.hint}
                          </Typography>
                        </Stack>
                      );
                    })}
                    <Typography variant="caption">
                      Détectés par des seuils cliniques, indépendamment du
                      modèle de langage.
                    </Typography>
                  </Stack>
                </InfoPanel>
              )}

              {request.analysis && !request.analysis.measuredSignal && (
                <InfoPanel tone="warning" title="Tracé non lu par l'analyseur">
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Aucune mesure n'a pu être extraite du fichier : l'avis
                    ci-dessous s'appuie uniquement sur le dossier clinique.
                    Rythme et fréquence restent à établir par votre lecture.
                  </Typography>
                </InfoPanel>
              )}

              {request.analysis && (
                <InfoPanel title="Interprétation proposée par l'IA">
                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                    <DetailItem
                      label="Rythme"
                      value={request.analysis.rhythmLabel}
                    />
                    <DetailItem
                      label="Fréquence cardiaque"
                      value={request.analysis.heartRateLabel}
                    />
                    <DetailItem
                      label={
                        request.analysis.measuredSignal
                          ? "Anomalies"
                          : "Points à vérifier"
                      }
                      value={
                        request.analysis.anomalies.length === 0 ? (
                          "Aucune anomalie détectée"
                        ) : (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{ flexWrap: "wrap", gap: 0.5 }}
                          >
                            {request.analysis.anomalies.map(anomaly => (
                              <Chip
                                key={anomaly}
                                label={anomaly}
                                size="small"
                                color="warning"
                              />
                            ))}
                          </Stack>
                        )
                      }
                    />
                    {formatIntervals(request.analysis.intervals) && (
                      <DetailItem
                        label="Intervalles"
                        value={formatIntervals(request.analysis.intervals)}
                      />
                    )}
                    <DetailItem
                      label="Score de confiance"
                      value={request.analysis.confidenceLabel}
                    />
                    <DetailItem
                      label="Conclusion"
                      value={request.analysis.interpretation}
                    />
                    <Divider />
                    <Typography variant="caption">
                      Modèle {request.analysis.modelVersion} · aide à la
                      décision, non validée.
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
                      onClick={() => startDecision("validate")}
                    >
                      Valider
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => startDecision("correct")}
                    >
                      Corriger
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      startIcon={<CloseIcon />}
                      onClick={() => startDecision("reject")}
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
                <Stack
                  component="form"
                  spacing={2}
                  onSubmit={handleSubmit}
                  noValidate
                >
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
                      helperText={
                        errors.diagnosis === true
                          ? "Le diagnostic est obligatoire."
                          : " "
                      }
                      value={diagnosis}
                      onChange={e => {
                        setDiagnosis(e.target.value);
                        if (errors.diagnosis === true)
                          setErrors(p => ({ ...p, diagnosis: false }));
                      }}
                    />
                  )}

                  <TextField
                    label="Commentaire"
                    placeholder={
                      commentRequired
                        ? "Commentaire obligatoire…"
                        : "Commentaire optionnel…"
                    }
                    multiline
                    rows={3}
                    required={commentRequired}
                    error={errors.comment === true}
                    helperText={
                      errors.comment === true
                        ? "Un commentaire est obligatoire pour cette action."
                        : " "
                    }
                    value={comment}
                    onChange={e => {
                      setComment(e.target.value);
                      if (errors.comment === true)
                        setErrors(p => ({ ...p, comment: false }));
                    }}
                  />

                  <Stack direction="row" spacing={1}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={resetDecision}
                    >
                      Annuler
                    </Button>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      loading={review.isPending}
                      color={
                        decision === "validate"
                          ? "success"
                          : decision === "reject"
                            ? "error"
                            : "primary"
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
