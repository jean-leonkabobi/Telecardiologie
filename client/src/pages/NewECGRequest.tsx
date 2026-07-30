import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { Controller, useForm, type Path } from 'react-hook-form';
import { useLocation } from 'wouter';
import { z } from 'zod';

import { DashboardLayout } from '@/components/DashboardLayout';
import { DetailItem } from '@/components/common/DetailItem';
import { InfoPanel } from '@/components/common/InfoPanel';
import { PageHeader } from '@/components/common/PageHeader';
import { tallFieldSx } from '@/components/common/formStyles';
import {
  checkEcgFile,
  ECG_ACCEPT_ATTRIBUTE,
  ECG_FORMATS_LABEL,
  ECG_MAX_FILE_SIZE_MB,
  formatFileSize,
} from '@/api/ecgFormats';
import { notify } from '@/lib/alerts';
import { useSubmitEcgRequest } from '@/api/hooks';
import { ApiError } from '@/lib/apiClient';

const requestSchema = z.object({
  // Pas d'identifiant patient : le serveur le dérive de l'identité saisie.
  gender: z.enum(['M', 'F'], { message: 'Sélectionnez le sexe du patient' }),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  dateOfBirth: z
    .custom<Dayjs>((v) => Boolean(v), 'La date de naissance est requise')
    .refine((d) => d.isValid(), 'Date invalide')
    .refine((d) => !d.isAfter(), 'La date ne peut pas être dans le futur'),
  symptoms: z.string().min(1, 'Décrivez les symptômes observés'),
  clinicalContext: z.string(),
  medicalHistory: z.string(),
  priority: z.enum(['normal', 'urgent']),
  additionalComments: z.string(),
});

type RequestValues = z.infer<typeof requestSchema>;

const STEPS = ['Patient', 'Informations cliniques', 'Fichier ECG', 'Récapitulatif'];

/** Champs validés à chaque étape avant d'autoriser « Suivant ». */
const STEP_FIELDS: Path<RequestValues>[][] = [
  ['firstName', 'lastName', 'dateOfBirth', 'gender'],
  ['symptoms', 'clinicalContext', 'medicalHistory', 'priority', 'additionalComments'],
  [],
  [],
];

export default function NewECGRequest() {
  const [, navigate] = useLocation();
  const [activeStep, setActiveStep] = useState(0);
  const [ecgFile, setEcgFile] = useState<File | null>(null);
  const submitRequest = useSubmitEcgRequest();

  const {
    register,
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      symptoms: '',
      clinicalContext: '',
      medicalHistory: '',
      priority: 'normal',
      additionalComments: '',
    },
  });

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[activeStep]);
    if (valid) setActiveStep((s) => s + 1);
  };

  const onSubmit = async (values: RequestValues): Promise<void> => {
    // Le fichier vit hors du formulaire : l'étape 3 ne le validait pas, on
    // s'assure ici qu'il est bien présent avant d'envoyer.
    if (!ecgFile) {
      notify.error('Fichier manquant', "Sélectionnez le tracé ECG à l'étape 3.");
      setActiveStep(2);
      return;
    }

    try {
      const request = await submitRequest.mutateAsync({
        // `patientRef` n'est pas transmis : le serveur le dérive de l'identité.
        patientFirstName: values.firstName,
        patientLastName: values.lastName,
        patientBirthDate: values.dateOfBirth.format('YYYY-MM-DD'),
        patientGender: values.gender,
        symptoms: values.symptoms,
        clinicalContext: values.clinicalContext,
        medicalHistory: values.medicalHistory,
        additionalComments: values.additionalComments,
        priority: values.priority,
        file: ecgFile,
      });

      notify.success(
        `Demande ${request.reference} enregistrée`,
        "L'analyse automatique démarre, vous serez prévenu dès qu'elle est terminée.",
      );
      // Redirection vers la référence réelle, plus vers un identifiant fictif.
      navigate(`/request/${request.id}`);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "L'envoi de la demande a échoué.";
      notify.error('Envoi impossible', message);
    }
  };

  const values = getValues();

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 760, mx: 'auto' }}>
        <Stack spacing={3}>
          <PageHeader
            title="Nouvelle demande d'analyse ECG"
            subtitle={`Étape ${activeStep + 1} sur ${STEPS.length}`}
          />

          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Card>
            <CardContent sx={{ p: 4 }}>
              <Stack
                component="form"
                spacing={3}
                noValidate
                onSubmit={handleSubmit(onSubmit)}
              >
                {activeStep === 0 && (
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h2">Informations du patient</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        L'identifiant patient est attribué automatiquement à
                        l'enregistrement, à partir de l'identité saisie ci-dessous.
                      </Typography>
                    </Box>

                    {/*
                      Ordre de lecture : l'identité d'abord (prénom, nom), la
                      démographie ensuite (naissance, sexe). C'est l'ordre dans
                      lequel un soignant lit une étiquette de dossier.
                    */}
                    <Stack spacing={1.5}>
                      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                        Identité
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Prénom"
                            placeholder="Awa"
                            size="medium"
                            sx={tallFieldSx}
                            error={Boolean(errors.firstName)}
                            helperText={errors.firstName?.message ?? ' '}
                            {...register('firstName')}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Nom"
                            placeholder="Diop"
                            size="medium"
                            sx={tallFieldSx}
                            error={Boolean(errors.lastName)}
                            helperText={errors.lastName?.message ?? ' '}
                            {...register('lastName')}
                          />
                        </Grid>
                      </Grid>
                    </Stack>

                    <Stack spacing={1.5}>
                      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                        Naissance et sexe
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            name="dateOfBirth"
                            control={control}
                            render={({ field }) => (
                              <DatePicker
                                label="Date de naissance"
                                value={field.value ?? null}
                                onChange={field.onChange}
                                disableFuture
                                slotProps={{
                                  textField: {
                                    size: 'medium',
                                    sx: tallFieldSx,
                                    error: Boolean(errors.dateOfBirth),
                                    helperText: errors.dateOfBirth?.message ?? ' ',
                                    onBlur: field.onBlur,
                                  },
                                }}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            name="gender"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                select
                                label="Sexe"
                                size="medium"
                                sx={tallFieldSx}
                                value={field.value ?? ''}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                error={Boolean(errors.gender)}
                                helperText={errors.gender?.message ?? ' '}
                              >
                                <MenuItem value="M">Masculin</MenuItem>
                                <MenuItem value="F">Féminin</MenuItem>
                              </TextField>
                            )}
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Stack>
                )}

                {activeStep === 1 && (
                  <Stack spacing={2.5}>
                    <Typography variant="h2">Informations cliniques</Typography>

                    <TextField
                      label="Symptômes"
                      placeholder="Décrivez les symptômes observés…"
                      multiline
                      rows={3}
                      error={Boolean(errors.symptoms)}
                      helperText={errors.symptoms?.message}
                      {...register('symptoms')}
                    />

                    <TextField
                      label="Contexte clinique"
                      placeholder="Contexte de la demande…"
                      multiline
                      rows={3}
                      {...register('clinicalContext')}
                    />

                    <TextField
                      label="Antécédents"
                      placeholder="Antécédents médicaux pertinents…"
                      multiline
                      rows={3}
                      {...register('medicalHistory')}
                    />

                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        // Seul contrôle monoligne de cette étape : même hauteur
                        // que ceux de l'étape Patient, sinon il paraît rétréci.
                        <TextField
                          select
                          label="Priorité"
                          size="medium"
                          sx={[tallFieldSx, { maxWidth: 280 }]}
                          {...field}
                        >
                          <MenuItem value="normal">Normale</MenuItem>
                          <MenuItem value="urgent">Urgente</MenuItem>
                        </TextField>
                      )}
                    />

                    <TextField
                      label="Commentaires supplémentaires"
                      placeholder="Informations additionnelles…"
                      multiline
                      rows={2}
                      {...register('additionalComments')}
                    />
                  </Stack>
                )}

                {activeStep === 2 && (
                  <Stack spacing={2.5}>
                    <Typography variant="h2">Fichier ECG</Typography>

                    <Paper
                      variant="outlined"
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                    >
                      <UploadFileIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Sélectionnez votre fichier ECG
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                        {ECG_FORMATS_LABEL} · {ECG_MAX_FILE_SIZE_MB} Mo maximum
                      </Typography>
                      <Button variant="outlined" component="label">
                        Sélectionner un fichier
                        <input
                          type="file"
                          hidden
                          accept={ECG_ACCEPT_ATTRIBUTE}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            // Le champ est réinitialisé pour que resélectionner le
                            // même fichier après un refus déclenche bien `change`.
                            e.target.value = '';

                            if (!file) return;

                            const probleme = checkEcgFile(file);
                            if (probleme) {
                              setEcgFile(null);
                              notify.error('Fichier refusé', probleme);
                              return;
                            }

                            setEcgFile(file);
                            notify.success('Fichier sélectionné', file.name);
                          }}
                        />
                      </Button>
                    </Paper>

                    {ecgFile && (
                      <InfoPanel tone="success">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {ecgFile.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatFileSize(ecgFile.size)}
                        </Typography>
                      </InfoPanel>
                    )}

                    <InfoPanel>
                      Un tracé scanné en image est accepté : le cardiologue le lira. En
                      revanche l'analyse automatique n'en tirera aucune mesure — elle a
                      besoin d'un export contenant du texte, PDF ou XML.
                    </InfoPanel>
                  </Stack>
                )}

                {activeStep === 3 && (
                  <Stack spacing={2.5}>
                    <Typography variant="h2">Récapitulatif de la demande</Typography>

                    <Stack spacing={1.5}>
                      {[
                        { label: 'Patient', value: `${values.firstName} ${values.lastName}` },
                        {
                          label: 'Identifiant patient',
                          value: 'Attribué automatiquement à l’enregistrement',
                        },
                        {
                          label: 'Date de naissance',
                          value: values.dateOfBirth?.isValid() ? values.dateOfBirth.format('DD/MM/YYYY') : '—',
                        },
                        { label: 'Sexe', value: values.gender === 'M' ? 'Masculin' : 'Féminin' },
                        { label: 'Symptômes', value: values.symptoms || '—' },
                        { label: 'Priorité', value: values.priority === 'urgent' ? 'Urgente' : 'Normale' },
                        {
                          label: 'Fichier ECG',
                          value: ecgFile
                            ? `${ecgFile.name} · ${formatFileSize(ecgFile.size)}`
                            : 'Aucun fichier',
                        },
                      ].map((row) => (
                        <Paper key={row.label} variant="outlined" sx={{ p: 2, bgcolor: 'surfaceMuted' }}>
                          <DetailItem label={row.label} value={row.value} />
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                )}

                <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                  {activeStep > 0 && (
                    <Button variant="outlined" onClick={() => setActiveStep((s) => s - 1)}>
                      Précédent
                    </Button>
                  )}
                  {activeStep < STEPS.length - 1 ? (
                    <Button fullWidth variant="contained" onClick={handleNext}>
                      Suivant
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      loading={submitRequest.isPending}
                      loadingPosition="start"
                    >
                      Envoyer la demande
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </DashboardLayout>
  );
}
