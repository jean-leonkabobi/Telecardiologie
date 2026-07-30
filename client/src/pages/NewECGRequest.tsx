import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs, { type Dayjs } from 'dayjs';
import type { ReactNode } from 'react';
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

/**
 * Motifs d'examen proposés, dans l'ordre de fréquence en consultation.
 *
 * Les valeurs correspondent à l'énumération du serveur ; les libellés sont
 * répliqués ici parce qu'un `<select>` doit s'afficher avant tout appel réseau.
 * `suggereUrgence` reproduit la règle du domaine — une douleur thoracique ou une
 * syncope sont des urgences jusqu'à preuve du contraire.
 */
const INDICATIONS: { value: string; label: string; suggereUrgence?: boolean }[] = [
  { value: 'douleur_thoracique', label: 'Douleur thoracique', suggereUrgence: true },
  { value: 'palpitations', label: 'Palpitations' },
  { value: 'dyspnee', label: 'Dyspnée' },
  { value: 'syncope', label: 'Syncope', suggereUrgence: true },
  { value: 'malaise', label: 'Malaise' },
  { value: 'hypertension', label: 'Hypertension artérielle' },
  { value: 'suivi_traitement', label: 'Suivi de traitement' },
  { value: 'bilan_preoperatoire', label: 'Bilan préopératoire' },
  { value: 'depistage', label: 'Dépistage' },
  { value: 'autre', label: 'Autre motif' },
];

/** Entier facultatif saisi au clavier : la chaîne vide vaut « non renseigné ». */
const entierFacultatif = (min: number, max: number, libelle: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d+$/.test(v), 'Saisissez un nombre entier')
    .refine((v) => v === '' || (Number(v) >= min && Number(v) <= max), `${libelle} : ${min} à ${max}`);

const requestSchema = z
  .object({
    // Pas d'identifiant patient : le serveur le dérive de l'identité saisie.
    firstName: z.string().trim().min(1, 'Le prénom est requis'),
    lastName: z.string().trim().min(1, 'Le nom est requis'),
    dateOfBirth: z
      .custom<Dayjs>((v) => Boolean(v), 'La date de naissance est requise')
      .refine((d) => d.isValid(), 'Date invalide')
      .refine((d) => !d.isAfter(), 'La date ne peut pas être dans le futur'),
    gender: z.enum(['M', 'F'], { message: 'Sélectionnez le sexe du patient' }),
    weightKg: entierFacultatif(2, 400, 'Poids en kg'),
    heightCm: entierFacultatif(30, 250, 'Taille en cm'),

    indication: z.string().min(1, "Sélectionnez le motif de l'examen"),
    priority: z.enum(['normal', 'urgent']),
    recordedAt: z
      .custom<Dayjs | null>(() => true)
      .refine((d) => !d || d.isValid(), 'Date et heure invalides')
      .refine((d) => !d || !d.isAfter(dayjs()), "L'enregistrement ne peut pas être dans le futur"),
    deviceModel: z.string().trim().max(160),
    systolicBp: entierFacultatif(50, 300, 'Systolique'),
    diastolicBp: entierFacultatif(20, 200, 'Diastolique'),
    hasPacemaker: z.boolean(),
    currentMedication: z.string().trim().max(2000),

    symptoms: z.string().trim().min(1, 'Décrivez les symptômes observés'),
    clinicalContext: z.string(),
    medicalHistory: z.string(),
    additionalComments: z.string(),
  })
  // Contrôle croisé : une diastolique supérieure à la systolique est une
  // inversion de saisie, que le serveur refuserait de toute façon. La signaler
  // ici évite un aller-retour et un message d'erreur en fin de parcours.
  .refine(
    (v) =>
      v.systolicBp === '' || v.diastolicBp === '' || Number(v.diastolicBp) < Number(v.systolicBp),
    { path: ['diastolicBp'], message: 'Doit être inférieure à la systolique' },
  );

type RequestValues = z.infer<typeof requestSchema>;

const STEPS = ['Patient', 'Examen', 'Contexte clinique', 'Tracé ECG', 'Récapitulatif'];

/** Champs validés à chaque étape avant d'autoriser « Suivant ». */
const STEP_FIELDS: Path<RequestValues>[][] = [
  ['firstName', 'lastName', 'dateOfBirth', 'gender', 'weightKg', 'heightCm'],
  [
    'indication',
    'priority',
    'recordedAt',
    'deviceModel',
    'systolicBp',
    'diastolicBp',
    'currentMedication',
  ],
  ['symptoms', 'clinicalContext', 'medicalHistory', 'additionalComments'],
  [],
  [],
];

/**
 * Sous-section d'un formulaire : un intitulé, un filet, des champs.
 *
 * Les groupes étaient composés à la main à chaque endroit, avec des espacements
 * qui divergeaient d'une étape à l'autre. Un formulaire de dix-huit champs se lit
 * par blocs — si les blocs ne se ressemblent pas, il se lit champ par champ.
 */
function Section({
  titre,
  aide,
  children,
}: {
  titre: string;
  aide?: string;
  children: ReactNode;
}) {
  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
          {titre}
        </Typography>
        <Divider sx={{ mt: 0.5 }} />
      </Box>
      {aide && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {aide}
        </Typography>
      )}
      {children}
    </Stack>
  );
}

export default function NewECGRequest() {
  const [, navigate] = useLocation();
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('sm'));
  const [ecgFile, setEcgFile] = useState<File | null>(null);
  const submitRequest = useSubmitEcgRequest();

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    getValues,
    formState: { errors },
  } = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      weightKg: '',
      heightCm: '',
      indication: '',
      priority: 'normal',
      recordedAt: null,
      deviceModel: '',
      systolicBp: '',
      diastolicBp: '',
      hasPacemaker: false,
      currentMedication: '',
      symptoms: '',
      clinicalContext: '',
      medicalHistory: '',
      additionalComments: '',
    },
  });

  // Surveillés pour l'avertissement d'urgence : `watch` et non `getValues`, qui
  // ne provoque pas de nouveau rendu.
  const indicationChoisie = watch('indication');
  const prioriteChoisie = watch('priority');
  const urgenceSuggeree =
    INDICATIONS.find((i) => i.value === indicationChoisie)?.suggereUrgence === true &&
    prioriteChoisie === 'normal';

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[activeStep]);
    if (valid) setActiveStep((s) => s + 1);
  };

  const onSubmit = async (values: RequestValues): Promise<void> => {
    // Le fichier vit hors du formulaire : l'étape du tracé ne le validait pas, on
    // s'assure ici qu'il est bien présent avant d'envoyer.
    if (!ecgFile) {
      notify.error('Fichier manquant', "Sélectionnez le tracé ECG à l'étape « Tracé ECG ».");
      setActiveStep(3);
      return;
    }

    // Les entiers facultatifs voyagent en nombre, ou pas du tout : envoyer une
    // chaîne vide ferait enregistrer un zéro.
    const nombre = (v: string): number | undefined => (v === '' ? undefined : Number(v));

    try {
      const request = await submitRequest.mutateAsync({
        // `patientRef` n'est pas transmis : le serveur le dérive de l'identité.
        patientFirstName: values.firstName,
        patientLastName: values.lastName,
        patientBirthDate: values.dateOfBirth.format('YYYY-MM-DD'),
        patientGender: values.gender,
        indication: values.indication,
        symptoms: values.symptoms,
        clinicalContext: values.clinicalContext,
        medicalHistory: values.medicalHistory,
        additionalComments: values.additionalComments,
        priority: values.priority,
        recordedAt: values.recordedAt?.toISOString(),
        currentMedication: values.currentMedication,
        hasPacemaker: values.hasPacemaker,
        systolicBp: nombre(values.systolicBp),
        diastolicBp: nombre(values.diastolicBp),
        weightKg: nombre(values.weightKg),
        heightCm: nombre(values.heightCm),
        deviceModel: values.deviceModel,
        file: ecgFile,
      });

      notify.success(
        `Demande ${request.reference} enregistrée`,
        "L'analyse automatique démarre, vous serez prévenu dès qu'elle est terminée.",
      );
      navigate(`/request/${request.id}`);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "L'envoi de la demande a échoué.";
      notify.error('Envoi impossible', message);
    }
  };

  const values = getValues();

  /** Réglages partagés par tous les contrôles monolignes : une seule hauteur. */
  const champ = { size: 'medium' as const, sx: tallFieldSx };

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 860, mx: 'auto' }}>
        <Stack spacing={3}>
          <PageHeader
            title="Nouvelle demande d'analyse ECG"
            subtitle={`Étape ${activeStep + 1} sur ${STEPS.length} — ${STEPS[activeStep]}`}
          />

          {/**
            * Deux présentations de l'avancement, selon la largeur.
            *
            * Cinq libellés côte à côte tiennent sur un écran d'ordinateur. Sur un
            * téléphone de 360 points, ils se réduisaient à quelques lettres
            * coupées : un fil d'étapes illisible occupe de la place sans rien
            * apprendre. Une barre dit la même chose en une ligne, le nom de
            * l'étape courante étant déjà dans le sous-titre.
            */}
          {compact ? (
            <LinearProgress
              variant="determinate"
              value={((activeStep + 1) / STEPS.length) * 100}
              aria-label={`Étape ${activeStep + 1} sur ${STEPS.length}`}
              sx={{ height: 6, borderRadius: 3 }}
            />
          ) : (
            <Stepper activeStep={activeStep} alternativeLabel>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          <Card>
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Stack component="form" spacing={3} noValidate onSubmit={handleSubmit(onSubmit)}>
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
                      Ordre de lecture : l'identité d'abord, la démographie ensuite,
                      la morphologie en dernier. C'est l'ordre dans lequel un
                      soignant lit une étiquette de dossier.
                    */}
                    <Section titre="Identité">
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Prénom"
                            placeholder="Awa"
                            {...champ}
                            error={Boolean(errors.firstName)}
                            helperText={errors.firstName?.message ?? ' '}
                            {...register('firstName')}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Nom"
                            placeholder="Diop"
                            {...champ}
                            error={Boolean(errors.lastName)}
                            helperText={errors.lastName?.message ?? ' '}
                            {...register('lastName')}
                          />
                        </Grid>
                      </Grid>
                    </Section>

                    <Section titre="Naissance et sexe">
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
                                    ...champ,
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
                                {...champ}
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
                    </Section>

                    <Section
                      titre="Morphologie"
                      aide="Facultatif. Sert au calcul de l'indice de masse corporelle et à l'interprétation des amplitudes."
                    >
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            label="Poids"
                            placeholder="72"
                            inputMode="numeric"
                            {...champ}
                            slotProps={{
                              input: {
                                endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                              },
                            }}
                            error={Boolean(errors.weightKg)}
                            helperText={errors.weightKg?.message ?? ' '}
                            {...register('weightKg')}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            label="Taille"
                            placeholder="165"
                            inputMode="numeric"
                            {...champ}
                            slotProps={{
                              input: {
                                endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                              },
                            }}
                            error={Boolean(errors.heightCm)}
                            helperText={errors.heightCm?.message ?? ' '}
                            {...register('heightCm')}
                          />
                        </Grid>
                      </Grid>
                    </Section>
                  </Stack>
                )}

                {activeStep === 1 && (
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h2">Examen</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Les conditions de l'enregistrement changent la lecture du tracé :
                        une bradycardie sous bêtabloquant est un effet attendu, des
                        spicules chez un porteur de stimulateur ne sont pas un artefact.
                      </Typography>
                    </Box>

                    <Section titre="Motif et priorité">
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 7 }}>
                          <Controller
                            name="indication"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                select
                                label="Motif de l'examen"
                                {...champ}
                                {...field}
                                error={Boolean(errors.indication)}
                                helperText={errors.indication?.message ?? ' '}
                              >
                                {INDICATIONS.map((i) => (
                                  <MenuItem key={i.value} value={i.value}>
                                    {i.label}
                                  </MenuItem>
                                ))}
                              </TextField>
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 5 }}>
                          <Controller
                            name="priority"
                            control={control}
                            render={({ field }) => (
                              <TextField select label="Priorité" {...champ} {...field} helperText=" ">
                                <MenuItem value="normal">Normale</MenuItem>
                                <MenuItem value="urgent">Urgente</MenuItem>
                              </TextField>
                            )}
                          />
                        </Grid>
                      </Grid>

                      {/* Suggestion, pas contrainte : le professionnel a vu le
                          patient, lui pas. Mais un motif urgent envoyé en routine
                          peut attendre des heures dans la file. */}
                      {urgenceSuggeree && (
                        <InfoPanel tone="warning" title="Ce motif appelle souvent une urgence">
                          Une douleur thoracique ou une syncope sont des urgences jusqu'à
                          preuve du contraire. La demande est actuellement en priorité
                          normale — passez-la en urgente si l'état du patient le justifie.
                        </InfoPanel>
                      )}
                    </Section>

                    <Section
                      titre="Enregistrement"
                      aide="Facultatif, mais un tracé pris pendant la douleur ne se lit pas comme un tracé pris deux jours après."
                    >
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            name="recordedAt"
                            control={control}
                            render={({ field }) => (
                              <DateTimePicker
                                label="Date et heure du tracé"
                                value={field.value ?? null}
                                onChange={field.onChange}
                                disableFuture
                                format="DD/MM/YYYY HH:mm"
                                ampm={false}
                                slotProps={{
                                  textField: {
                                    ...champ,
                                    error: Boolean(errors.recordedAt),
                                    helperText: errors.recordedAt?.message ?? ' ',
                                    onBlur: field.onBlur,
                                  },
                                }}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Appareil utilisé"
                            placeholder="Schiller Cardiovit FT-1"
                            {...champ}
                            helperText=" "
                            {...register('deviceModel')}
                          />
                        </Grid>
                      </Grid>
                    </Section>

                    <Section titre="Constantes et porteur d'appareil">
                      <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            label="Systolique"
                            placeholder="128"
                            inputMode="numeric"
                            {...champ}
                            slotProps={{
                              input: {
                                endAdornment: <InputAdornment position="end">mmHg</InputAdornment>,
                              },
                            }}
                            error={Boolean(errors.systolicBp)}
                            helperText={errors.systolicBp?.message ?? ' '}
                            {...register('systolicBp')}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            label="Diastolique"
                            placeholder="76"
                            inputMode="numeric"
                            {...champ}
                            slotProps={{
                              input: {
                                endAdornment: <InputAdornment position="end">mmHg</InputAdornment>,
                              },
                            }}
                            error={Boolean(errors.diastolicBp)}
                            helperText={errors.diastolicBp?.message ?? ' '}
                            {...register('diastolicBp')}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Controller
                            name="hasPacemaker"
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                // Même hauteur que les champs voisins : un
                                // interrupteur qui flotte au-dessus de la ligne
                                // casse l'alignement de la rangée.
                                sx={{ minHeight: 56, ml: 0 }}
                                control={
                                  <Switch
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                  />
                                }
                                label="Porteur d'un stimulateur ou d'un défibrillateur"
                              />
                            )}
                          />
                        </Grid>
                      </Grid>

                      <TextField
                        label="Traitement en cours"
                        placeholder="Bisoprolol 5 mg, amiodarone 200 mg…"
                        multiline
                        rows={2}
                        helperText="Bêtabloquants, antiarythmiques, digitaliques et psychotropes modifient le tracé."
                        {...register('currentMedication')}
                      />
                    </Section>
                  </Stack>
                )}

                {activeStep === 2 && (
                  <Stack spacing={3}>
                    <Typography variant="h2">Contexte clinique</Typography>

                    <TextField
                      label="Symptômes"
                      placeholder="Décrivez les symptômes observés…"
                      multiline
                      rows={3}
                      error={Boolean(errors.symptoms)}
                      helperText={errors.symptoms?.message ?? 'Seul champ obligatoire de cette étape.'}
                      {...register('symptoms')}
                    />

                    <TextField
                      label="Contexte clinique"
                      placeholder="Circonstances de survenue, examen d'entrée, suivi…"
                      multiline
                      rows={3}
                      {...register('clinicalContext')}
                    />

                    <TextField
                      label="Antécédents"
                      placeholder="Antécédents cardiovasculaires, facteurs de risque…"
                      multiline
                      rows={3}
                      {...register('medicalHistory')}
                    />

                    <TextField
                      label="Commentaires supplémentaires"
                      placeholder="Informations additionnelles pour le cardiologue…"
                      multiline
                      rows={2}
                      {...register('additionalComments')}
                    />
                  </Stack>
                )}

                {activeStep === 3 && (
                  <Stack spacing={2.5}>
                    <Typography variant="h2">Tracé ECG</Typography>

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
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', display: 'block', mb: 2 }}
                      >
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

                    <InfoPanel title="Ce que chaque format permet">
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        <Typography variant="body2">
                          <strong>XML ou CSV d'échantillons</strong> — le tracé est redessiné
                          dans l'application aux conventions 25 mm/s et 10 mm/mV, mesurable
                          au compas, et reproduit dans le compte rendu.
                        </Typography>
                        <Typography variant="body2">
                          <strong>PDF</strong> — le document est affiché tel quel et annexé au
                          compte rendu. Les mesures sont lues dans son texte si l'appareil
                          les y a écrites.
                        </Typography>
                        <Typography variant="body2">
                          <strong>Image scannée</strong> — lisible par le cardiologue, mais
                          l'analyse automatique n'en tirera aucune mesure.
                        </Typography>
                      </Stack>
                    </InfoPanel>
                  </Stack>
                )}

                {activeStep === 4 && (
                  <Stack spacing={2.5}>
                    <Typography variant="h2">Récapitulatif de la demande</Typography>

                    <Grid container spacing={2}>
                      {[
                        { label: 'Patient', value: `${values.firstName} ${values.lastName}` },
                        {
                          label: 'Naissance et sexe',
                          value: `${
                            values.dateOfBirth?.isValid()
                              ? values.dateOfBirth.format('DD/MM/YYYY')
                              : '—'
                          } · ${values.gender === 'M' ? 'Masculin' : 'Féminin'}`,
                        },
                        {
                          label: 'Identifiant patient',
                          value: 'Attribué automatiquement à l’enregistrement',
                        },
                        {
                          label: 'Morphologie',
                          value:
                            [
                              values.weightKg && `${values.weightKg} kg`,
                              values.heightCm && `${values.heightCm} cm`,
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'Non renseignée',
                        },
                        {
                          label: "Motif de l'examen",
                          value:
                            INDICATIONS.find((i) => i.value === values.indication)?.label ?? '—',
                        },
                        {
                          label: 'Priorité',
                          value: values.priority === 'urgent' ? 'Urgente' : 'Normale',
                        },
                        {
                          label: 'Enregistré le',
                          value: values.recordedAt?.isValid()
                            ? values.recordedAt.format('DD/MM/YYYY à HH:mm')
                            : 'Non précisé',
                        },
                        {
                          label: 'Tension artérielle',
                          value:
                            values.systolicBp || values.diastolicBp
                              ? `${values.systolicBp || '—'}/${values.diastolicBp || '—'} mmHg`
                              : 'Non mesurée',
                        },
                        {
                          label: 'Stimulateur / défibrillateur',
                          value: values.hasPacemaker ? 'Oui' : 'Non',
                        },
                        {
                          label: 'Traitement en cours',
                          value: values.currentMedication || 'Aucun renseigné',
                        },
                        { label: 'Symptômes', value: values.symptoms || '—' },
                        {
                          label: 'Fichier ECG',
                          value: ecgFile
                            ? `${ecgFile.name} · ${formatFileSize(ecgFile.size)}`
                            : 'Aucun fichier',
                        },
                      ].map((row) => (
                        <Grid key={row.label} size={{ xs: 12, sm: 6 }}>
                          <Paper
                            variant="outlined"
                            sx={{ p: 2, bgcolor: 'surfaceMuted', height: '100%' }}
                          >
                            <DetailItem label={row.label} value={row.value} />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Stack>
                )}

                <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
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
