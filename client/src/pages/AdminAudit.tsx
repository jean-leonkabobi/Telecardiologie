import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo, useState } from "react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import { InfoPanel } from "@/components/common/InfoPanel";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { StatusChip } from "@/components/common/StatusChip";
import { useAuditIntegrity, useAuditLog } from "@/api/hooks";
import type { AuditEntry } from "@/api/types";

type StatusFilter = "all" | "success" | "error";

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "Toutes",
  success: "Succès",
  error: "Erreurs",
};

/**
 * Couleur d'une action selon son verbe.
 *
 * Le serveur envoie des libellés déjà rédigés (« Analyse validée », « Connexion
 * refusée »…) : on colore sur le participe plutôt que de dupliquer côté client
 * une énumération que le journal n'expose pas.
 */
function actionColor(
  action: string
): "success.main" | "error.main" | "warning.main" | "primary.main" {
  const normalized = action.toLowerCase();
  if (
    normalized.includes("créé") ||
    normalized.includes("validé") ||
    normalized.includes("réussie")
  )
    return "success.main";
  if (
    normalized.includes("rejeté") ||
    normalized.includes("refusé") ||
    normalized.includes("supprimé") ||
    normalized.includes("expiré")
  )
    return "error.main";
  if (
    normalized.includes("modifié") ||
    normalized.includes("corrigé") ||
    normalized.includes("relâché") ||
    normalized.includes("réinitialisé")
  )
    return "warning.main";
  return "primary.main";
}

export default function AdminAudit() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const query = useAuditLog();
  const integrity = useAuditIntegrity();

  const entries = useMemo(() => query.data ?? [], [query.data]);

  const rows = useMemo(() => {
    if (statusFilter === "all") return entries;
    const wanted = statusFilter === "success" ? "Succès" : "Erreur";
    return entries.filter(log => log.status === wanted);
  }, [entries, statusFilter]);

  const successCount = entries.filter(l => l.status === "Succès").length;
  const errorCount = entries.length - successCount;

  const columns: GridColDef<AuditEntry>[] = [
    {
      field: "sequence",
      headerName: "Rang",
      width: 80,
      // Le rang est attribué par la base dans la section critique du scellement :
      // c'est l'ordre canonique de la chaîne, pas un simple compteur d'affichage.
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {value as number}
        </Typography>
      ),
    },
    {
      field: "timestamp",
      headerName: "Horodatage",
      width: 180,
      valueGetter: (value: string) => new Date(value),
      valueFormatter: (value: Date) => value.toLocaleString("fr-FR"),
    },
    {
      field: "user",
      headerName: "Utilisateur",
      width: 200,
      // Nom et adresse sont figés à l'écriture : ils subsistent même après la
      // suppression du compte, sinon l'attribution disparaîtrait avec lui.
      renderCell: ({ row }) => (
        <Stack spacing={0} sx={{ py: 0.5 }}>
          <Typography variant="body2">{row.user}</Typography>
          {row.userEmail && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {row.userEmail}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      field: "action",
      headerName: "Action",
      width: 200,
      renderCell: ({ value }) => (
        <Typography
          variant="body2"
          sx={{ color: actionColor(value as string), fontWeight: 500 }}
        >
          {value as string}
        </Typography>
      ),
    },
    {
      field: "resource",
      headerName: "Ressource",
      width: 160,
      renderCell: ({ value }) =>
        (value as string) === "" ? (
          "—"
        ) : (
          <Chip label={value as string} variant="outlined" />
        ),
    },
    {
      field: "status",
      headerName: "Statut",
      width: 110,
      renderCell: ({ value }) => <StatusChip status={value as string} />,
    },
    { field: "details", headerName: "Détails", flex: 1, minWidth: 260 },
  ];

  return (
    <DashboardLayout>
      <Stack spacing={3}>
        <PageHeader
          title="Journal d'audit"
          subtitle="Historique des actions réalisées sur la plateforme"
        />

        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        >
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <StatCard
                  label="Événements"
                  value={entries.length}
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <StatCard label="Succès" value={successCount} color="success" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <StatCard label="Erreurs" value={errorCount} color="error" />
              </Grid>
            </Grid>

            {integrity.data && (
              <InfoPanel
                tone={integrity.data.intact ? "success" : "error"}
                title={
                  integrity.data.intact
                    ? "Journal scellé et intègre"
                    : `Altération détectée — ${integrity.data.brokenLinks} maillon(s) rompu(s)`
                }
              >
                {integrity.data.intact ? (
                  <>
                    Les {integrity.data.checked} entrées scellées forment une
                    chaîne continue
                    {integrity.data.fromSequence !== null &&
                      ` (rangs ${integrity.data.fromSequence} à ${integrity.data.toSequence})`}
                    . La base refuse toute modification et toute suppression ;
                    ce contrôle détecte en plus une intervention qui aurait
                    désactivé cette protection.
                    {integrity.data.unsealed > 0 &&
                      ` ${integrity.data.unsealed} entrées antérieures au scellement ne sont pas couvertes.`}
                  </>
                ) : (
                  <>
                    La chaîne est rompue à partir du rang{" "}
                    {integrity.data.firstBrokenSequence}. Une entrée a été
                    modifiée ou supprimée hors de l'application. À signaler au
                    responsable de la conformité.
                  </>
                )}
              </InfoPanel>
            )}

            <SectionCard
              title="Événements"
              subheader="Les 200 entrées les plus récentes"
              action={
                <Stack direction="row" spacing={1}>
                  {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map(
                    key => (
                      <Chip
                        key={key}
                        label={STATUS_FILTER_LABELS[key]}
                        color={statusFilter === key ? "primary" : "default"}
                        variant={statusFilter === key ? "filled" : "outlined"}
                        onClick={() => setStatusFilter(key)}
                      />
                    )
                  )}
                </Stack>
              }
              disableContentPadding
            >
              <DataTable<AuditEntry>
                rows={rows}
                columns={columns}
                height={560}
                initialState={{
                  sorting: {
                    sortModel: [{ field: "timestamp", sort: "desc" }],
                  },
                }}
              />
            </SectionCard>
          </Stack>
        </QueryBoundary>
      </Stack>
    </DashboardLayout>
  );
}
