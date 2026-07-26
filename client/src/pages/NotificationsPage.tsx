import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Bell, CheckCircle2, AlertCircle, Clock, Trash2, Archive } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'validated',
      title: 'Résultat validé',
      message: 'L\'analyse de la demande REQ-001 (Jean Dupont) a été validée par Dr. Martin Leclerc',
      time: '2026-07-26 14:15',
      read: false,
      requestId: 'REQ-001',
    },
    {
      id: 2,
      type: 'processing',
      title: 'Analyse terminée',
      message: 'L\'analyse IA de la demande REQ-002 (Marie Durand) est terminée et en attente de validation',
      time: '2026-07-26 12:45',
      read: false,
      requestId: 'REQ-002',
    },
    {
      id: 3,
      type: 'submitted',
      title: 'Demande reçue',
      message: 'Votre demande REQ-003 (Pierre Bernard) a été reçue avec succès',
      time: '2026-07-25 10:30',
      read: true,
      requestId: 'REQ-003',
    },
    {
      id: 4,
      type: 'urgent',
      title: 'Demande urgente prise en charge',
      message: 'La demande urgente REQ-004 (Sophie Martin) a été prise en charge par Dr. Dupont',
      time: '2026-07-24 16:20',
      read: true,
      requestId: 'REQ-004',
    },
    {
      id: 5,
      type: 'rejected',
      title: 'Demande rejetée',
      message: 'La demande REQ-005 (Luc Moreau) a été rejetée. Veuillez consulter les commentaires du cardiologue',
      time: '2026-07-23 09:15',
      read: true,
      requestId: 'REQ-005',
    },
    {
      id: 6,
      type: 'comment',
      title: 'Nouveau commentaire',
      message: 'Dr. Bernard a ajouté un commentaire à la demande REQ-006 (Anne Petit)',
      time: '2026-07-22 15:45',
      read: true,
      requestId: 'REQ-006',
    },
  ]);

  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const handleDelete = (id: number) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'validated':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'submitted':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'comment':
        return <Bell className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'validated':
        return 'bg-green-50 border-green-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'submitted':
        return 'bg-blue-50 border-blue-200';
      case 'urgent':
        return 'bg-red-50 border-red-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'comment':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-muted border-border';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0
                ? `Vous avez ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                : 'Toutes les notifications sont lues'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="text-primary hover:bg-primary/10"
            >
              Marquer tout comme lu
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card className="p-12 border border-border text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground">Aucune notification</p>
            </Card>
          ) : (
            notifications.map((notif) => (
              <Card
                key={notif.id}
                className={`p-4 border transition-all ${
                  notif.read
                    ? 'bg-background border-border'
                    : `${getNotificationColor(notif.type)} border-2`
                }`}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 pt-1">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {notif.title}
                          </h3>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-foreground mt-1">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <p className="text-xs text-muted-foreground">
                            {notif.time}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {notif.requestId}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        {!notif.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="text-primary hover:bg-primary/10"
                          >
                            Marquer comme lu
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(notif.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
