import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Availability() {
  const [status, setStatus] = useState('available');
  const [timeSlots, setTimeSlots] = useState([
    { id: 1, day: 'Lundi', start: '08:00', end: '12:00', enabled: true },
    { id: 2, day: 'Lundi', start: '13:00', end: '17:00', enabled: true },
    { id: 3, day: 'Mardi', start: '08:00', end: '12:00', enabled: true },
    { id: 4, day: 'Mardi', start: '13:00', end: '17:00', enabled: true },
    { id: 5, day: 'Mercredi', start: '08:00', end: '12:00', enabled: true },
    { id: 6, day: 'Mercredi', start: '13:00', end: '17:00', enabled: false },
    { id: 7, day: 'Jeudi', start: '08:00', end: '12:00', enabled: true },
    { id: 8, day: 'Jeudi', start: '13:00', end: '17:00', enabled: true },
    { id: 9, day: 'Vendredi', start: '08:00', end: '12:00', enabled: true },
    { id: 10, day: 'Vendredi', start: '13:00', end: '17:00', enabled: true },
  ]);

  const handleToggleSlot = (id: number) => {
    setTimeSlots((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, enabled: !slot.enabled } : slot))
    );
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
  };

  const enabledSlotsCount = timeSlots.filter((s) => s.enabled).length;
  const totalHours = enabledSlotsCount * 4;

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gérer ma disponibilité</h1>
          <p className="text-muted-foreground mt-1">
            Définissez vos heures de travail et votre statut de disponibilité
          </p>
        </div>

        {/* Status Card */}
        <Card className="p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Statut de disponibilité
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-foreground">Disponible</p>
                  <p className="text-sm text-muted-foreground">
                    Vous êtes prêt à traiter les demandes
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleStatusChange('available')}
                variant={status === 'available' ? 'default' : 'outline'}
                className={status === 'available' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Sélectionner
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-foreground">Temporairement indisponible</p>
                  <p className="text-sm text-muted-foreground">
                    Vous êtes en pause, les demandes seront assignées à d'autres cardiologues
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleStatusChange('unavailable')}
                variant={status === 'unavailable' ? 'default' : 'outline'}
                className={status === 'unavailable' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                Sélectionner
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-foreground">Hors ligne</p>
                  <p className="text-sm text-muted-foreground">
                    Vous n'êtes pas disponible, aucune demande ne sera assignée
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleStatusChange('offline')}
                variant={status === 'offline' ? 'default' : 'outline'}
                className={status === 'offline' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Sélectionner
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground">
              Statut actuel: <Badge>{status === 'available' ? 'Disponible' : status === 'unavailable' ? 'Temporairement indisponible' : 'Hors ligne'}</Badge>
            </p>
          </div>
        </Card>

        {/* Time Slots */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Heures de travail
            </h2>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {enabledSlotsCount} créneaux ({totalHours}h par semaine)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {days.map((day) => {
              const daySlots = timeSlots.filter((s) => s.day === day);
              return (
                <div key={day} className="border border-border rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-3">{day}</h3>
                  <div className="space-y-2">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={slot.enabled}
                            onChange={() => handleToggleSlot(slot.id)}
                            className="w-4 h-4 rounded border-input cursor-pointer"
                          />
                          <span className="text-sm font-medium text-foreground">
                            {slot.start} - {slot.end}
                          </span>
                        </div>
                        <Badge
                          variant={slot.enabled ? 'default' : 'outline'}
                          className={
                            slot.enabled
                              ? 'bg-green-600 hover:bg-green-700'
                              : ''
                          }
                        >
                          {slot.enabled ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-3">
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              Enregistrer les modifications
            </Button>
            <Button variant="outline" className="flex-1">
              Annuler
            </Button>
          </div>
        </Card>

        {/* Info Box */}
        <Card className="p-4 border border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-900">
            <span className="font-medium">💡 Conseil :</span> Définissez vos heures de travail régulièrement pour que les demandes urgentes soient assignées aux cardiologues disponibles.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
