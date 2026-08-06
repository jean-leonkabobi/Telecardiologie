import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import DescriptionIcon from "@mui/icons-material/DescriptionOutlined";
import ErrorIcon from "@mui/icons-material/ErrorOutlined";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { useLocation } from "wouter";

import { DashboardLayout } from "@/components/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard, type StatColor } from "@/components/common/StatCard";
import { StatusChip } from "@/components/common/StatusChip";
import { useEcgRequests, useNotifications } from "@/api/hooks";
import type { EcgRequestSummary } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";

/** Les cinq dernières demandes suffisent : le reste vit dans « Mes demandes ». */
const RECENT_LIMIT = 5;

export default function HealthcareProfessionalDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const requests = useEcgRequests();
  const notifications = useNotifications();

  const all = useMemo(() => requests.data ?? [], [requests.data]);

  const stats: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: StatColor;
  }[] = [
    {
      label: "Demandes totales",
      value: all.length,
      icon: <DescriptionIcon />,
      color: "primary",
    },
    {
      label: "En attente",
      value: all.filter(
        r =>
          r.status === "PENDING_ANALYSIS" ||
          r.status === "ANALYZING" ||
          r.status === "ANALYSIS_FAILED" ||
          r.status === "PENDING_REVIEW"
      ).length,
      icon: <AccessTimeIcon />,
      color: "warning",
    },
    {
      label: "En cours de validation",
      value: all.filter(r => r.status === "UNDER_REVIEW").length,
      icon: <ErrorIcon />,
      color: "info",
    },
    {
      label: "Terminées",
      value: all.filter(r => r.reviewedAt !== null).length,
      icon: <CheckCircleIcon />,
      color: "success",
    },
  ];

  // Le serveur trie déjà par date décroissante ; on se contente de tronquer.
  const recent = all.slice(0, RECENT_LIMIT);
  const recentNotifications = (notifications.data?.notifications ?? []).slice(
    0,
    6
  );

  const columns: GridColDef<EcgRequestSummary>[] = [
    { field: "reference", headerName: "Référence", width: 120 },
    {
      field: "patient",
      headerName: "Patient",
      flex: 1,
      minWidth: 150,
      valueGetter: (_value, row) => row.patient.fullName,
    },
    {
      field: "priorityLabel",
      headerName: "Priorité",
      width: 110,
      renderCell: ({ row }) => (
        <StatusChip status={row.priorityLabel} statusKey={row.priority} />
      ),
    },
    {
      field: "statusLabel",
      headerName: "Statut",
      flex: 1,
      minWidth: 190,
      renderCell: ({ row }) => (
        <StatusChip status={row.statusLabel} statusKey={row.status} />
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Stack spacing={3}>
        <PageHeader
          title="Tableau de bord"
          subtitle={`Bienvenue, ${user?.name ?? ""}`}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/new-request")}
            >
              Nouvelle demande ECG
            </Button>
          }
        />

        <QueryBoundary
          isLoading={requests.isLoading}
          error={requests.error}
          onRetry={() => void requests.refetch()}
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

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <SectionCard
                  title="Demandes récentes"
                  action={
                    <Button
                      size="small"
                      onClick={() => navigate("/my-requests")}
                    >
                      Voir tout
                    </Button>
                  }
                  disableContentPadding
                >
                  {recent.length === 0 ? (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", p: 3 }}
                    >
                      Vous n'avez encore soumis aucune demande.
                    </Typography>
                  ) : (
                    <DataTable<EcgRequestSummary>
                      rows={recent}
                      columns={columns}
                      height={320}
                      hideFooter
                      showToolbar={false}
                      onRowClick={({ row }) => navigate(`/request/${row.id}`)}
                      sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
                    />
                  )}
                </SectionCard>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <SectionCard
                  title="Notifications"
                  action={
                    <Button
                      size="small"
                      onClick={() => navigate("/notifications")}
                    >
                      Voir tout
                    </Button>
                  }
                  disableContentPadding
                >
                  {recentNotifications.length === 0 ? (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", p: 3 }}
                    >
                      Aucune notification pour le moment.
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {recentNotifications.map(notif => (
                        <ListItemButton
                          key={notif.id}
                          onClick={() =>
                            navigate(
                              notif.requestId === null
                                ? "/notifications"
                                : `/request/${notif.requestId}`
                            )
                          }
                        >
                          <ListItemText
                            primary={notif.title}
                            secondary={new Date(notif.createdAt).toLocaleString(
                              "fr-FR"
                            )}
                            slotProps={{
                              primary: {
                                variant: "body2",
                                sx: { fontWeight: notif.read ? 400 : 600 },
                              },
                              secondary: { variant: "caption" },
                            }}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  )}
                </SectionCard>
              </Grid>
            </Grid>
          </Stack>
        </QueryBoundary>
      </Stack>
    </DashboardLayout>
  );
}
