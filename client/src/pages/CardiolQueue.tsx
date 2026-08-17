import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActiveOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import PsychologyIcon from "@mui/icons-material/PsychologyOutlined";
import { useState } from "react";
import { useLocation } from "wouter";

import { DashboardLayout } from "@/components/DashboardLayout";
import { DetailItem } from "@/components/common/DetailItem";
import { EmptyState } from "@/components/common/EmptyState";
import { InfoPanel } from "@/components/common/InfoPanel";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { StatCard } from "@/components/common/StatCard";
import { StatusChip } from "@/components/common/StatusChip";
import { EcgInterpretationPanel } from "@/components/ecg/EcgInterpretationPanel";
import { useClaimEcgRequest, useEcgRequest, useReviewQueue } from "@/api/hooks";
import { formatDuration, type QueueItem } from "@/api/types";
import { ApiError } from "@/lib/apiClient";
import { notify } from "@/lib/alerts";

export default function CardiolQueue() {
  const [, navigate] = useLocation();
  const queue = useReviewQueue();
  const claim = useClaimEcgRequest();

  /**
   * Demande dont on regarde l'interprétation IA sans encore la prendre.
   *
   * Le cardiologue jauge d'abord ce que l'IA propose, puis décide d'entrer dans
   * le dossier — ou non. On garde l'élément entier plutôt que son seul
   * identifiant : le dialogue a besoin de `mine`, de la référence et du patient
   * pour son en-tête, sans attendre le chargement du détail.
   */
  const [preview, setPreview] = useState<QueueItem | null>(null);

  const items = queue.data ?? [];
  const mine = items.filter(item => item.mine);
  const available = items.filter(item => !item.mine);
  const urgentCount = available.filter(
    item => item.priority === "URGENT"
  ).length;

  const handleClaim = async (item: QueueItem): Promise<void> => {
    try {
      await claim.mutateAsync(item.id);
      notify.success(
        "Demande prise en charge",
        `${item.reference} vous est assignée.`
      );
      navigate(`/analyze/${item.id}`);
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === "REQUEST_ALREADY_ASSIGNED"
      ) {
        // Un confrère a été plus rapide. L'invalidation du cache rafraîchit la
        // file toute seule : inutile de demander à l'utilisateur de recharger.
        notify.warning("Trop tard", error.message);
        return;
      }
      notify.error(
        "Prise en charge impossible",
        error instanceof ApiError ? error.message : "Veuillez réessayer."
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
                <StatCard
                  label="Disponibles"
                  value={available.length}
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <StatCard label="Urgentes" value={urgentCount} color="error" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <StatCard
                  label="En cours chez vous"
                  value={mine.length}
                  color="info"
                />
              </Grid>
            </Grid>

            {urgentCount > 0 && (
              <InfoPanel
                tone="error"
                title={`${urgentCount} demande${urgentCount > 1 ? "s" : ""} urgente${urgentCount > 1 ? "s" : ""} en attente`}
              >
                Les demandes urgentes sont présentées en premier dans la file.
              </InfoPanel>
            )}

            {mine.length > 0 && (
              <Stack spacing={2}>
                <Typography variant="h3">Vos demandes en cours</Typography>
                {mine.map(item => (
                  <QueueCard
                    key={item.id}
                    item={item}
                    position={null}
                    actionLabel="Reprendre l'analyse"
                    onAction={() => navigate(`/analyze/${item.id}`)}
                    onPreview={() => setPreview(item)}
                    pending={false}
                  />
                ))}
              </Stack>
            )}

            {available.length === 0 ? (
              <Card>
                <EmptyState
                  icon={
                    <CheckCircleIcon
                      fontSize="inherit"
                      sx={{ color: "success.main" }}
                    />
                  }
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
                    onPreview={() => setPreview(item)}
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

      {/**
       * Aperçu de l'interprétation IA, monté en permanence.
       *
       * Le composant reste rendu même sans sélection pour que son `useEcgRequest`
       * garde un ordre de Hooks stable ; la requête ne part qu'une fois un
       * élément choisi (`enabled` sur l'identifiant).
       */}
      <InterpretationDialog
        item={preview}
        onClose={() => setPreview(null)}
        onClaim={handleClaim}
        claimPending={claim.isPending}
        onResume={id => navigate(`/analyze/${id}`)}
      />
    </DashboardLayout>
  );
}

interface QueueCardProps {
  item: QueueItem;
  position: number | null;
  actionLabel: string;
  onAction: () => void;
  onPreview: () => void;
  pending: boolean;
}

function QueueCard({
  item,
  position,
  actionLabel,
  onAction,
  onPreview,
  pending,
}: QueueCardProps) {
  const urgent = item.priority === "URGENT";

  return (
    <Card
      sx={{
        borderColor: urgent ? "error.main" : "divider",
        borderWidth: urgent ? 2 : 1,
      }}
    >
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ alignItems: { md: "flex-start" } }}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 40,
              height: 40,
              fontWeight: 700,
            }}
          >
            {position ?? "•"}
          </Avatar>

          <Stack spacing={1.5} sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <Typography variant="h3">{item.patient.fullName}</Typography>
              <StatusChip
                status={item.priorityLabel}
                statusKey={item.priority}
              />
              {/* Le motif de l'examen, sur la carte : c'est ce qui permet de
                  hiérarchiser la file sans ouvrir chaque dossier. Une douleur
                  thoracique et un bilan préopératoire ne s'attendent pas. */}
              <Chip
                label={item.indicationLabel}
                color="primary"
                variant="outlined"
              />
              <Chip label={item.reference} variant="outlined" />
              {/* L'analyse a pu échouer : le tracé reste consultable. */}
              {item.status === "ANALYSIS_FAILED" && (
                <Chip label="Analyse IA indisponible" color="warning" />
              )}
              {/* Sollicitation venue d'une autre structure : le cardiologue doit
                  savoir qu'il sort de son périmètre habituel. */}
              {item.openToExternalReview && (
                <Chip
                  label="Expertise externe demandée"
                  color="info"
                  variant="outlined"
                />
              )}
              {/**
               * Demande déjà réannoncée sans avoir été prise.
               *
               * L'information change la lecture de la file : un dossier proposé
               * trois fois n'est pas une demande qui vient d'arriver, c'est une
               * demande que les confrères ont laissée passer. Rien ne l'indiquait.
               */}
              {item.solicitation.rounds > 1 && (
                <Chip
                  icon={<NotificationsActiveIcon />}
                  label={`Relancée ${item.solicitation.rounds - 1} fois`}
                  color="warning"
                />
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
                  value={
                    item.confidence === null
                      ? "—"
                      : `${Math.round(item.confidence * 100)} %`
                  }
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <DetailItem
                  label="En attente depuis"
                  value={
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ alignItems: "center" }}
                    >
                      <AccessTimeIcon sx={{ fontSize: 14 }} />
                      <span>{formatDuration(item.waitedMs)}</span>
                    </Stack>
                  }
                />
              </Grid>
            </Grid>

            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Soumise par {item.submittedByName ?? "un professionnel"} le{" "}
              {new Date(item.createdAt).toLocaleString("fr-FR")}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>

      <Divider />

      {/**
       * Barre d'actions en pied de carte.
       *
       * Deux gestes distincts, séparés visuellement : à gauche, consulter l'avis
       * de l'IA sans s'engager ; à droite, l'action qui engage — prendre en
       * charge, ou reprendre son propre dossier. Sur mobile, les boutons passent
       * en pleine largeur, l'un au-dessus de l'autre.
       */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{
          px: 2,
          py: 1.5,
          justifyContent: "space-between",
          alignItems: { sm: "center" },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<PsychologyIcon />}
          onClick={onPreview}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Voir l'interprétation IA
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={onAction}
          loading={pending}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {actionLabel}
        </Button>
      </Stack>
    </Card>
  );
}

interface InterpretationDialogProps {
  item: QueueItem | null;
  onClose: () => void;
  onClaim: (item: QueueItem) => Promise<void>;
  claimPending: boolean;
  onResume: (id: string) => void;
}

/**
 * Aperçu de l'analyse IA avant de s'engager sur un dossier.
 *
 * Le résumé de la file ne porte que le score de confiance ; l'interprétation
 * complète — rythme, signes d'alarme, conclusion — n'est chargée qu'ici, à la
 * demande, via le détail de la demande. Le cardiologue lit, puis entre dans le
 * dossier pour valider, corriger ou rejeter ce que l'IA a proposé.
 */
function InterpretationDialog({
  item,
  onClose,
  onClaim,
  claimPending,
  onResume,
}: InterpretationDialogProps) {
  const detail = useEcgRequest(item?.id);
  const data = detail.data;
  const analysisRunning =
    data?.status === "PENDING_ANALYSIS" || data?.status === "ANALYZING";

  const handlePrimary = async () => {
    if (!item) return;
    if (item.mine) {
      onClose();
      onResume(item.id);
      return;
    }
    // La prise en charge navigue d'elle-même vers l'analyse en cas de succès ;
    // en cas d'échec, elle notifie et la file se rafraîchit. Dans les deux cas,
    // on referme l'aperçu.
    await onClaim(item);
    onClose();
  };

  return (
    <Dialog
      open={item !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="h3" component="span">
            Interprétation IA
          </Typography>
          {item && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {item.reference} · {item.patient.fullName} · {item.patient.age}{" "}
              ans · {item.indicationLabel}
            </Typography>
          )}
        </Stack>
        <IconButton onClick={onClose} size="small" aria-label="Fermer">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <QueryBoundary
          isLoading={detail.isLoading}
          error={detail.error}
          onRetry={() => void detail.refetch()}
        >
          {data && (
            <Stack spacing={2}>
              {analysisRunning && (
                <InfoPanel title="Analyse en cours">
                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Le moteur d'analyse traite le tracé. Cet aperçu se met à
                      jour tout seul.
                    </Typography>
                    <LinearProgress />
                  </Stack>
                </InfoPanel>
              )}

              {!analysisRunning && data.analysis === null && (
                <InfoPanel
                  tone="warning"
                  title="Analyse automatique indisponible"
                >
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      {data.analysisFailureReason ??
                        "Le moteur d'analyse n'a pas pu traiter ce tracé."}
                    </Typography>
                    <Typography variant="caption">
                      {data.analysisAttempts} tentative
                      {data.analysisAttempts > 1 ? "s" : ""}. Le tracé reste
                      consultable : votre lecture prime sur l'aide automatique.
                    </Typography>
                  </Stack>
                </InfoPanel>
              )}

              {data.analysis && (
                <EcgInterpretationPanel analysis={data.analysis} />
              )}
            </Stack>
          )}
        </QueryBoundary>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose}>
          Fermer
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          loading={item !== null && !item.mine && claimPending}
          onClick={() => void handlePrimary()}
        >
          {item?.mine ? "Reprendre l'analyse" : "Prendre en charge et examiner"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
