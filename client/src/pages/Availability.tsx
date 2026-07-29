import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import ErrorIcon from '@mui/icons-material/ErrorOutlined';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';

import { DashboardLayout } from '@/components/DashboardLayout';
import { InfoPanel } from '@/components/common/InfoPanel';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusChip } from '@/components/common/StatusChip';
import { useAvailability, useSaveAvailability } from '@/api/hooks';
import type { Availability as AvailabilityDto } from '@/api/types';
import { ApiError } from '@/lib/apiClient';
import { notify } from '@/lib/alerts';

type AvailabilityStatus = AvailabilityDto['status'];

const STATUS_OPTIONS: {
  value: AvailabilityStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: 'success' | 'warning' | 'error';
}[] = [
  {
    value: 'AVAILABLE',
    label: 'Disponible',
    description: 'Vous êtes prêt à traiter les demandes',
    icon: <CheckCircleIcon />,
    color: 'success',
  },
  {
    value: 'BUSY',
    label: 'Temporairement indisponible',
    description: "Vous êtes en pause, les demandes seront assignées à d'autres cardiologues",
    icon: <AccessTimeIcon />,
    color: 'warning',
  },
  {
    value: 'OFFLINE',
    label: 'Hors ligne',
    description: "Vous n'êtes pas disponible, aucune demande ne sera assignée",
    icon: <ErrorIcon />,
    color: 'error',
  },
];

/** 1 = lundi … 7 = dimanche, comme la validation du serveur. */
const DAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

/** Créneaux proposés au premier enregistrement, du lundi au vendredi. */
const DEFAULT_SLOTS: EditableSlot[] = DAYS.slice(0, 5).flatMap((day, index) => [
  { key: `d${index}-am`, dayOfWeek: day.value, startMinute: 8 * 60, endMinute: 12 * 60, enabled: true },
  { key: `d${index}-pm`, dayOfWeek: day.value, startMinute: 13 * 60, endMinute: 17 * 60, enabled: true },
]);

interface EditableSlot {
  /** Clé de rendu locale — le serveur ne conserve pas l'identité des créneaux. */
  key: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  enabled: boolean;
}

/** Minutes depuis minuit ↔ instant du jour, pour alimenter le `TimePicker`. */
function toDayjs(minutes: number): Dayjs {
  return dayjs().startOf('day').add(minutes, 'minute');
}

function toMinutes(value: Dayjs): number {
  return value.hour() * 60 + value.minute();
}

function formatMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export default function Availability() {
  const query = useAvailability();

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 960, mx: 'auto' }}>
        <Stack spacing={3}>
          <PageHeader
            title="Gérer ma disponibilité"
            subtitle="Définissez vos heures de travail et votre statut de disponibilité"
          />

          <QueryBoundary
            isLoading={query.isLoading}
            error={query.error}
            onRetry={() => void query.refetch()}
          >
            {query.data && <AvailabilityEditor initial={query.data} />}
          </QueryBoundary>
        </Stack>
      </Box>
    </DashboardLayout>
  );
}

function AvailabilityEditor({ initial }: { initial: AvailabilityDto }) {
  const save = useSaveAvailability();
  const nextKey = useRef(0);

  const fromServer = useMemo((): EditableSlot[] => {
    // Aucun créneau enregistré : on part d'une semaine type plutôt que d'une
    // page vide, sans rien écrire tant que le cardiologue n'a pas enregistré.
    if (initial.slots.length === 0) return DEFAULT_SLOTS;

    return initial.slots.map((slot, index) => ({
      key: slot.id ?? `s${index}`,
      dayOfWeek: slot.dayOfWeek,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      enabled: slot.enabled,
    }));
  }, [initial.slots]);

  const [status, setStatus] = useState<AvailabilityStatus>(initial.status);
  const [slots, setSlots] = useState<EditableSlot[]>(fromServer);

  // Après un enregistrement, `initial` change : on repart de l'état confirmé
  // par le serveur plutôt que de conserver un brouillon désormais périmé.
  useEffect(() => {
    setStatus(initial.status);
    setSlots(fromServer);
  }, [initial.status, fromServer]);

  const updateSlot = (key: string, patch: Partial<EditableSlot>) => {
    setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const addSlot = (dayOfWeek: number) => {
    nextKey.current += 1;
    setSlots((prev) => [
      ...prev,
      {
        key: `new-${nextKey.current}`,
        dayOfWeek,
        startMinute: 9 * 60,
        endMinute: 12 * 60,
        enabled: true,
      },
    ]);
  };

  const removeSlot = (key: string) => setSlots((prev) => prev.filter((s) => s.key !== key));

  const enabled = slots.filter((s) => s.enabled);
  const weeklyMinutes = enabled.reduce((total, s) => total + (s.endMinute - s.startMinute), 0);
  const invalid = slots.filter((s) => s.endMinute <= s.startMinute);
  const currentStatus = STATUS_OPTIONS.find((o) => o.value === status);

  const handleSave = async () => {
    if (invalid.length > 0) {
      notify.error('Créneau invalide', "L'heure de fin doit suivre l'heure de début.");
      return;
    }

    try {
      await save.mutateAsync({
        status,
        slots: slots.map(({ dayOfWeek, startMinute, endMinute, enabled: on }) => ({
          dayOfWeek,
          startMinute,
          endMinute,
          enabled: on,
        })),
      });
      notify.success('Disponibilités enregistrées', 'Votre planning est à jour.');
    } catch (error) {
      notify.error(
        'Enregistrement impossible',
        error instanceof ApiError ? error.message : 'Veuillez réessayer.',
      );
    }
  };

  const handleReset = () => {
    setStatus(initial.status);
    setSlots(fromServer);
  };

  return (
    <Stack spacing={3}>
      <SectionCard title="Statut de disponibilité">
        <RadioGroup
          value={status}
          onChange={(e) => setStatus(e.target.value as AvailabilityStatus)}
        >
          <Stack spacing={1.5}>
            {STATUS_OPTIONS.map((option) => {
              const selected = status === option.value;
              return (
                <Paper
                  key={option.value}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderColor: selected ? `${option.color}.main` : 'divider',
                    borderWidth: selected ? 2 : 1,
                  }}
                >
                  <FormControlLabel
                    value={option.value}
                    control={<Radio />}
                    sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                    label={
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 0.5 }}>
                        <Box sx={{ color: `${option.color}.main`, display: 'flex' }}>
                          {option.icon}
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {option.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {option.description}
                          </Typography>
                        </Box>
                      </Stack>
                    }
                  />
                </Paper>
              );
            })}
          </Stack>
        </RadioGroup>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Statut actuel :
          </Typography>
          <StatusChip status={currentStatus?.label ?? ''} severity={currentStatus?.color} />
        </Stack>
      </SectionCard>

      <SectionCard
        title="Heures de travail"
        action={
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {enabled.length} créneau{enabled.length > 1 ? 'x' : ''} ·{' '}
            {formatMinutes(weeklyMinutes).replace(':', ' h ')} par semaine
          </Typography>
        }
      >
        <Stack spacing={2}>
          {DAYS.map((day) => {
            const daySlots = slots.filter((s) => s.dayOfWeek === day.value);

            return (
              <Paper key={day.value} variant="outlined" sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}
                >
                  <Typography variant="h4">{day.label}</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => addSlot(day.value)}>
                    Ajouter un créneau
                  </Button>
                </Stack>

                {daySlots.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Aucun créneau ce jour-là.
                  </Typography>
                ) : (
                  <Grid container spacing={1}>
                    {daySlots.map((slot) => {
                      const slotInvalid = slot.endMinute <= slot.startMinute;

                      return (
                        <Grid key={slot.key} size={{ xs: 12, md: 6 }}>
                          <Paper
                            variant="outlined"
                            sx={{
                              px: 2,
                              py: 1.5,
                              bgcolor: 'surfaceMuted',
                              borderColor: slotInvalid ? 'error.main' : 'divider',
                            }}
                          >
                            <Stack spacing={1.5}>
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <TimePicker
                                  label="Début"
                                  ampm={false}
                                  value={toDayjs(slot.startMinute)}
                                  onChange={(value) =>
                                    value &&
                                    updateSlot(slot.key, { startMinute: toMinutes(value) })
                                  }
                                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                                <TimePicker
                                  label="Fin"
                                  ampm={false}
                                  value={toDayjs(slot.endMinute)}
                                  onChange={(value) =>
                                    value && updateSlot(slot.key, { endMinute: toMinutes(value) })
                                  }
                                  slotProps={{
                                    textField: {
                                      size: 'small',
                                      fullWidth: true,
                                      error: slotInvalid,
                                    },
                                  }}
                                />
                                <Tooltip title="Supprimer ce créneau">
                                  <IconButton color="error" onClick={() => removeSlot(slot.key)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>

                              <Stack
                                direction="row"
                                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                              >
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={slot.enabled}
                                      onChange={(e) =>
                                        updateSlot(slot.key, { enabled: e.target.checked })
                                      }
                                    />
                                  }
                                  label={
                                    <Typography variant="body2">
                                      {formatMinutes(slot.startMinute)} –{' '}
                                      {formatMinutes(slot.endMinute)}
                                    </Typography>
                                  }
                                />
                                <StatusChip status={slot.enabled ? 'Actif' : 'Inactif'} />
                              </Stack>
                            </Stack>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Paper>
            );
          })}
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => void handleSave()}
            loading={save.isPending}
          >
            Enregistrer les modifications
          </Button>
          <Button fullWidth variant="outlined" onClick={handleReset}>
            Annuler
          </Button>
        </Stack>
      </SectionCard>

      <InfoPanel title="Conseil">
        Vos créneaux servent à répartir les demandes urgentes : un cardiologue en statut
        « Disponible » et dans une plage active est notifié en priorité.
      </InfoPanel>
    </Stack>
  );
}
