import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { useMemo } from "react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard, type StatColor } from "@/components/common/StatCard";
import { StatusChip } from "@/components/common/StatusChip";
import { useAuditLog, useStatistics } from "@/api/hooks";
import { formatDuration, type Statistics } from "@/api/types";
import { useChartPalette } from "@/theme/useChartPalette";

const RECENT_ACTIVITY_LIMIT = 6;
const TOP_CARDIOLOGISTS_LIMIT = 5;

/** Affiche un taux 0–1 en pourcentage français, ou un tiret s'il est inconnu. */
function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1).replace(".", ",")} %`;
}

export default function AdminStatistics() {
  // Couleurs de série issues du thème : elles suivent le mode clair/sombre.
  const palette = useChartPalette();

  const statistics = useStatistics();
  const audit = useAuditLog();

  return (
    <DashboardLayout>
      <Stack spacing={3}>
        <PageHeader
          title="Statistiques"
          subtitle="Vue d'ensemble des performances et activités de la plateforme"
        />

        <QueryBoundary
          isLoading={statistics.isLoading}
          error={statistics.error}
          onRetry={() => void statistics.refetch()}
        >
          {statistics.data && (
            <StatisticsView
              data={statistics.data}
              palette={palette}
              recentActivity={(audit.data ?? []).slice(
                0,
                RECENT_ACTIVITY_LIMIT
              )}
            />
          )}
        </QueryBoundary>
      </Stack>
    </DashboardLayout>
  );
}

interface StatisticsViewProps {
  data: Statistics;
  palette: string[];
  recentActivity: {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    resource: string;
  }[];
}

function StatisticsView({
  data,
  palette,
  recentActivity,
}: StatisticsViewProps) {
  const { totals, byStatus, monthly, topCardiologists } = data;

  const stats: { label: string; value: string | number; color: StatColor }[] = [
    { label: "Total demandes", value: totals.requests, color: "primary" },
    {
      label: "Taux de validation",
      value: formatRate(totals.validationRate),
      color: "success",
    },
    {
      label: "Temps moyen de validation",
      value: formatDuration(totals.averageReviewDurationMs),
      color: "info",
    },
    {
      label: "Utilisateurs actifs",
      value: totals.activeUsers,
      color: "secondary",
    },
  ];

  // Les mois arrivent triés du serveur ; on ne garde que l'étiquette courte.
  const monthlyDataset = useMemo(
    () =>
      monthly.map(m => ({
        month: m.label,
        submitted: m.submitted,
        validated: m.validated,
        rejected: m.rejected,
      })),
    [monthly]
  );

  // Les statuts à zéro sont écartés : un secteur d'aire nulle encombre la
  // légende sans rien apprendre.
  const statusData = useMemo(
    () =>
      byStatus
        .filter(entry => entry.count > 0)
        .map((entry, index) => ({
          id: index,
          value: entry.count,
          label: entry.label,
          color: palette[index % palette.length],
        })),
    [byStatus, palette]
  );

  const roleData = useMemo(
    () => [
      {
        id: 0,
        value: totals.cardiologists,
        label: "Cardiologues",
        color: palette[3 % palette.length],
      },
      {
        id: 1,
        value: totals.professionals,
        label: "Professionnels",
        color: palette[4 % palette.length],
      },
    ],
    [totals.cardiologists, totals.professionals, palette]
  );

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        {stats.map(stat => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label={stat.label}
              value={stat.value}
              color={stat.color}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard title="Tendance mensuelle">
            {monthlyDataset.length === 0 ? (
              <EmptyChart />
            ) : (
              <LineChart
                dataset={monthlyDataset}
                xAxis={[{ dataKey: "month", scaleType: "point" }]}
                series={[
                  {
                    dataKey: "submitted",
                    label: "Demandes",
                    color: palette[0],
                  },
                  {
                    dataKey: "validated",
                    label: "Validées",
                    color: palette[1],
                  },
                ]}
                grid={{ horizontal: true }}
                height={300}
              />
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Répartition par statut">
            {statusData.length === 0 ? (
              <EmptyChart />
            ) : (
              <PieChart
                series={[{ data: statusData, innerRadius: 40 }]}
                height={300}
              />
            )}
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard title="Conclusions par mois">
            {monthlyDataset.length === 0 ? (
              <EmptyChart />
            ) : (
              <BarChart
                dataset={monthlyDataset}
                xAxis={[{ dataKey: "month" }]}
                series={[
                  {
                    dataKey: "validated",
                    label: "Validées",
                    color: palette[1],
                  },
                  { dataKey: "rejected", label: "Rejetées", color: palette[2] },
                ]}
                grid={{ horizontal: true }}
                height={300}
              />
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Répartition par rôle">
            <PieChart
              series={[{ data: roleData, innerRadius: 40 }]}
              height={300}
            />
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard title="Activité récente" disableContentPadding>
            {recentActivity.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", p: 3 }}
              >
                Aucune activité enregistrée.
              </Typography>
            ) : (
              <List disablePadding>
                {recentActivity.map((activity, idx) => (
                  <ListItem
                    key={activity.id}
                    divider={idx < recentActivity.length - 1}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", minWidth: 100 }}
                    >
                      {new Date(activity.timestamp).toLocaleTimeString(
                        "fr-FR",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </Typography>
                    <ListItemText
                      primary={activity.action}
                      secondary={`${activity.user}${activity.resource === "" ? "" : ` • ${activity.resource}`}`}
                      slotProps={{
                        primary: { variant: "body2", sx: { fontWeight: 500 } },
                        secondary: { variant: "caption" },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard
            title="Cardiologues les plus actifs"
            disableContentPadding
          >
            {topCardiologists.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", p: 3 }}
              >
                Aucune analyse conclue pour le moment.
              </Typography>
            ) : (
              <List disablePadding>
                {topCardiologists
                  .slice(0, TOP_CARDIOLOGISTS_LIMIT)
                  .map((doc, idx) => (
                    <ListItem
                      key={doc.cardiologistId}
                      divider={
                        idx <
                        Math.min(
                          topCardiologists.length,
                          TOP_CARDIOLOGISTS_LIMIT
                        ) -
                          1
                      }
                    >
                      <ListItemText
                        primary={doc.name}
                        secondary={`${doc.reviewed} analyse${doc.reviewed > 1 ? "s" : ""}`}
                        slotProps={{
                          primary: {
                            variant: "body2",
                            sx: { fontWeight: 500 },
                          },
                          secondary: { variant: "caption" },
                        }}
                      />
                      <StatusChip
                        status={formatRate(doc.validationRate)}
                        severity="success"
                      />
                    </ListItem>
                  ))}
              </List>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}

/** Placeholder d'un graphique sans donnée — un graphe vide induit en erreur. */
function EmptyChart() {
  return (
    <Stack sx={{ height: 300, alignItems: "center", justifyContent: "center" }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Pas encore assez de données pour tracer ce graphique.
      </Typography>
    </Stack>
  );
}
