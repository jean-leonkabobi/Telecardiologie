import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorIcon from "@mui/icons-material/ErrorOutlined";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeartOutlined";
import { useMemo } from "react";
import { useLocation } from "wouter";

import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard, type StatColor } from "@/components/common/StatCard";
import { StatusChip } from "@/components/common/StatusChip";
import { useCardiologistHistory, useReviewQueue } from "@/api/hooks";
import { formatDuration } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";

/** Le tableau de bord montre un aperçu ; la file complète a son propre écran. */
const PREVIEW_LIMIT = 4;

export default function CardiologistDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const queue = useReviewQueue();
  const history = useCardiologistHistory();

  const items = useMemo(() => queue.data ?? [], [queue.data]);
  const mine = items.filter(i => i.mine);
  const available = items.filter(i => !i.mine);

  const validatedToday = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return (history.data ?? []).filter(
      r => r.reviewedAt !== null && new Date(r.reviewedAt) >= startOfDay
    ).length;
  }, [history.data]);

  const stats: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: StatColor;
  }[] = [
    {
      label: "Urgentes",
      value: available.filter(i => i.priority === "URGENT").length,
      icon: <ErrorIcon />,
      color: "error",
    },
    {
      label: "En attente",
      value: available.length,
      icon: <AccessTimeIcon />,
      color: "warning",
    },
    {
      label: "En cours",
      value: mine.length,
      icon: <MonitorHeartIcon />,
      color: "primary",
    },
    {
      label: "Conclues aujourd'hui",
      value: validatedToday,
      icon: <CheckCircleIcon />,
      color: "success",
    },
  ];

  // Les demandes déjà prises en charge passent devant : ce sont celles que le
  // cardiologue doit terminer avant d'en réclamer de nouvelles.
  const preview = [...mine, ...available].slice(0, PREVIEW_LIMIT);

  return (
    <DashboardLayout>
      <Stack spacing={3}>
        <PageHeader
          title="Tableau de bord"
          subtitle={`Bienvenue, Dr. ${user?.name ?? ""}`}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => navigate("/availability")}
              >
                Gérer la disponibilité
              </Button>
              <Button variant="contained" onClick={() => navigate("/queue")}>
                Voir la file
              </Button>
            </Stack>
          }
        />

        <QueryBoundary
          isLoading={queue.isLoading}
          error={queue.error}
          onRetry={() => void queue.refetch()}
        >
          <Stack spacing={3}>
            <Grid container spacing={2}>
              {stats.map(stat => (
                <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                  />
                </Grid>
              ))}
            </Grid>

            <SectionCard
              title="File d'attente"
              subheader="Triée par urgence et chronologie"
              action={
                <Button size="small" onClick={() => navigate("/queue")}>
                  Voir tout
                </Button>
              }
            >
              {preview.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Aucune demande en attente de validation.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {preview.map(item => (
                    <Grid key={item.id} size={{ xs: 12, md: 6 }}>
                      <Card
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "start",
                            }}
                          >
                            <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{ alignItems: "center" }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {item.reference}
                                </Typography>
                                <StatusChip
                                  status={item.priorityLabel}
                                  statusKey={item.priority}
                                />
                              </Stack>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}
                              >
                                {item.patient.fullName}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {item.patient.age} ans • {item.symptoms}
                              </Typography>
                            </Stack>
                            <Stack sx={{ textAlign: "right", flexShrink: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}
                              >
                                {formatDuration(item.waitedMs)}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {item.submittedByName ?? "—"}
                              </Typography>
                            </Stack>
                          </Stack>
                        </CardContent>
                        <CardActions sx={{ px: 2, pb: 2 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() => navigate(`/analyze/${item.id}`)}
                          >
                            {item.mine ? "Reprendre l'analyse" : "Examiner"}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </SectionCard>
          </Stack>
        </QueryBoundary>
      </Stack>
    </DashboardLayout>
  );
}
