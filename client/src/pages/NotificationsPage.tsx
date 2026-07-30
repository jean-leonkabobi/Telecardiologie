import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ErrorIcon from '@mui/icons-material/ErrorOutlined';
import GroupAddIcon from '@mui/icons-material/GroupAddOutlined';
import NotificationsIcon from '@mui/icons-material/NotificationsNoneOutlined';
import WarningIcon from '@mui/icons-material/WarningAmberOutlined';
import { useLocation } from 'wouter';

import { DashboardLayout } from '@/components/DashboardLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/api/hooks';
import type { AppNotification } from '@/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/apiClient';
import { confirm, notify } from '@/lib/alerts';

type Tone = 'success' | 'info' | 'error' | 'warning' | 'primary';

/**
 * Icône et couleur par type de notification.
 *
 * Les clés sont l'énumération du serveur : un type inconnu (ajouté côté backend
 * avant que le frontend ne soit redéployé) retombe sur un style neutre plutôt
 * que de faire planter le rendu.
 */
const TYPE_STYLE: Record<string, { icon: React.ReactNode; color: Tone }> = {
  REQUEST_SUBMITTED: { icon: <NotificationsIcon />, color: 'info' },
  URGENT_REQUEST_QUEUED: { icon: <ErrorIcon />, color: 'error' },
  ANALYSIS_COMPLETED: { icon: <AccessTimeIcon />, color: 'info' },
  ANALYSIS_FAILED: { icon: <WarningIcon />, color: 'warning' },
  REQUEST_CLAIMED: { icon: <AccessTimeIcon />, color: 'primary' },
  REQUEST_VALIDATED: { icon: <CheckCircleIcon />, color: 'success' },
  REQUEST_CORRECTED: { icon: <EditNoteIcon />, color: 'info' },
  REQUEST_REJECTED: { icon: <ErrorIcon />, color: 'error' },
  EXTERNAL_REVIEW_REQUESTED: { icon: <GroupAddIcon />, color: 'primary' },
};

const FALLBACK_STYLE = { icon: <NotificationsIcon />, color: 'primary' as Tone };

export default function NotificationsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const query = useNotifications();

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  const notifications = query.data?.notifications ?? [];
  const unreadCount = query.data?.unreadCount ?? 0;

  // Le cardiologue travaille depuis l'écran d'analyse, le professionnel depuis
  // le détail de sa demande : la même notification ne mène pas au même endroit.
  const targetFor = (n: AppNotification): string | null =>
    n.requestId === null
      ? null
      : user?.role === 'cardiologist'
        ? `/analyze/${n.requestId}`
        : `/request/${n.requestId}`;

  const handleOpen = (n: AppNotification) => {
    const target = targetFor(n);
    if (!n.read) markRead.mutate(n.id);
    if (target !== null) navigate(target);
  };

  const handleDelete = async (n: AppNotification) => {
    const confirmed = await confirm({
      title: 'Supprimer cette notification ?',
      text: 'Elle disparaîtra définitivement de votre liste.',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      await remove.mutateAsync(n.id);
      notify.info('Notification supprimée');
    } catch (error) {
      notify.error(
        'Suppression impossible',
        error instanceof ApiError ? error.message : 'Veuillez réessayer.',
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const { updated } = await markAllRead.mutateAsync();
      notify.success(
        'Notifications lues',
        `${updated} notification${updated > 1 ? 's ont' : ' a'} été marquée${updated > 1 ? 's' : ''} comme lue${updated > 1 ? 's' : ''}.`,
      );
    } catch (error) {
      notify.error(
        'Opération impossible',
        error instanceof ApiError ? error.message : 'Veuillez réessayer.',
      );
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 880, mx: 'auto' }}>
        <Stack spacing={3}>
          <PageHeader
            title="Notifications"
            subtitle={
              unreadCount > 0
                ? `Vous avez ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                : 'Toutes les notifications sont lues'
            }
            action={
              unreadCount > 0 ? (
                <Button
                  variant="outlined"
                  onClick={() => void handleMarkAllRead()}
                  loading={markAllRead.isPending}
                >
                  Tout marquer comme lu
                </Button>
              ) : undefined
            }
          />

          <QueryBoundary
            isLoading={query.isLoading}
            error={query.error}
            onRetry={() => void query.refetch()}
          >
            {notifications.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<NotificationsIcon fontSize="inherit" />}
                  title="Aucune notification"
                  description="Vous serez prévenu ici dès qu'une de vos demandes évolue."
                />
              </Card>
            ) : (
              <Stack spacing={1.5}>
                {notifications.map((notif) => {
                  const style = TYPE_STYLE[notif.type] ?? FALLBACK_STYLE;
                  const target = targetFor(notif);

                  return (
                    <Card
                      key={notif.id}
                      sx={{
                        borderWidth: notif.read ? 1 : 2,
                        borderColor: notif.read ? 'divider' : `${style.color}.main`,
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" spacing={2}>
                          <Avatar
                            sx={{
                              bgcolor: `${style.color}.main`,
                              color: `${style.color}.contrastText`,
                              width: 40,
                              height: 40,
                            }}
                          >
                            {style.icon}
                          </Avatar>

                          <Stack spacing={1} sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <Typography variant="h4">{notif.title}</Typography>
                              {!notif.read && (
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: 'primary.main',
                                  }}
                                />
                              )}
                            </Stack>

                            <Typography variant="body2">{notif.body}</Typography>

                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {new Date(notif.createdAt).toLocaleString('fr-FR')}
                            </Typography>
                          </Stack>

                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ flexShrink: 0, alignItems: 'flex-start' }}
                          >
                            {target !== null && (
                              <Button size="small" onClick={() => handleOpen(notif)}>
                                Ouvrir
                              </Button>
                            )}
                            {!notif.read && (
                              <Button size="small" onClick={() => markRead.mutate(notif.id)}>
                                Marquer comme lu
                              </Button>
                            )}
                            <Tooltip title="Supprimer">
                              <IconButton color="error" onClick={() => void handleDelete(notif)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </QueryBoundary>
        </Stack>
      </Box>
    </DashboardLayout>
  );
}
