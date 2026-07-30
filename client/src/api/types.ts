/**
 * Contrats de l'API, côté client.
 *
 * Le serveur expose chaque énumération sous trois formes — valeur technique,
 * forme API et libellé français — pour que le frontend n'ait jamais à filtrer
 * sur des chaînes accentuées ni à maintenir sa propre table de traduction.
 */

export type EcgRequestStatus =
  | 'PENDING_ANALYSIS'
  | 'ANALYZING'
  | 'ANALYSIS_FAILED'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'VALIDATED'
  | 'CORRECTED'
  | 'REJECTED';

export type EcgPriority = 'NORMAL' | 'URGENT';
export type ReviewDecisionValue = 'VALIDATED' | 'CORRECTED' | 'REJECTED';
export type ReviewAction = 'validate' | 'correct' | 'reject';

export interface PatientSnapshot {
  reference: string;
  firstName: string;
  lastName: string;
  fullName: string;
  birthDate: string;
  age: number;
  gender: 'M' | 'F';
  genderLabel: string;
}

/**
 * Motifs d'examen, alignés sur l'énumération du serveur.
 *
 * Les libellés viennent de l'API (`indicationLabel`) et ne sont pas recopiés
 * ici : un intitulé traduit à deux endroits finit par différer. La liste des
 * valeurs, elle, sert au formulaire — d'où `ECG_INDICATION_OPTIONS`.
 */
export const ECG_INDICATION_VALUES = [
  'DOULEUR_THORACIQUE',
  'DYSPNEE',
  'PALPITATIONS',
  'SYNCOPE',
  'MALAISE',
  'BILAN_PREOPERATOIRE',
  'SUIVI_TRAITEMENT',
  'HYPERTENSION',
  'DEPISTAGE',
  'AUTRE',
] as const;

export type EcgIndicationValue = (typeof ECG_INDICATION_VALUES)[number];

export interface EcgRequestSummary {
  id: string;
  reference: string;
  status: EcgRequestStatus;
  statusApi: string;
  statusLabel: string;
  priority: EcgPriority;
  priorityApi: string;
  priorityLabel: string;
  /** Structure du demandeur, figée à la soumission. */
  organizationId: string | null;
  /** Vrai quand la demande est ouverte aux cardiologues hors structure. */
  openToExternalReview: boolean;
  externalReviewReason: string | null;
  externalReviewRequestedAt: string | null;
  patient: PatientSnapshot;
  /**
   * Sollicitation des cardiologues : nombre de tours et date du dernier.
   *
   * `rounds: 0` signifie qu'aucune annonce n'a encore eu lieu — l'analyse est
   * peut-être en cours. Au-delà de 1, la demande a été réannoncée sans être prise.
   */
  solicitation: { lastAt: string | null; rounds: number };
  /** Motif codé de l'examen, et son libellé français. */
  indication: EcgIndicationValue;
  indicationApi: string;
  indicationLabel: string;
  symptoms: string;
  submittedById: string;
  assignedToId: string | null;
  reviewedById: string | null;
  reviewDecision: ReviewDecisionValue | null;
  reviewDecisionLabel: string | null;
  finalDiagnosis: string | null;
  confidence: number | null;
  waitedMs: number;
  createdAt: string;
  analysisCompletedAt: string | null;
  reviewedAt: string | null;
}

/** Élément de file d'attente : ajoute le demandeur et l'appartenance. */
export interface QueueItem extends EcgRequestSummary {
  submittedByName: string | null;
  /** Vrai si la demande est déjà prise en charge par l'utilisateur courant. */
  mine: boolean;
}

export interface EcgAnalysisResult {
  /**
   * Rythme et fréquence sont **nuls quand l'analyseur n'a pas lu le signal**.
   *
   * Les libellés correspondants (`rhythmLabel`, `heartRateLabel`) portent alors
   * « Non évaluée » / « Non mesurée » : le client affiche, il ne décide pas.
   */
  rhythm: string | null;
  rhythmLabel: string;
  heartRateBpm: number | null;
  heartRateLabel: string;
  anomalies: string[];
  /** Intervalles lus sur le tracé, en millisecondes. Nuls si non mesurés. */
  intervals: {
    prMs: number | null;
    qrsMs: number | null;
    qtMs: number | null;
    qtcMs: number | null;
    axisDegrees: number | null;
  };
  /**
   * Codes des signes d'alarme, déduits par règles déterministes côté serveur.
   *
   * Le client choisit le libellé et la couleur : les codes sont stables, les
   * formulations peuvent évoluer sans casser l'affichage.
   */
  redFlags: string[];
  confidence: number;
  confidenceLabel: string;
  interpretation: string;
  modelVersion: string;
  /** Faux quand l'avis repose sur le seul dossier clinique. */
  measuredSignal: boolean;
  computedAt: string;
}

/**
 * Signal ECG décodé, prêt pour le visualiseur.
 *
 * Jamais stocké en base : décodé à la demande depuis le fichier d'origine. Un
 * tracé de dix secondes sur douze dérivations à 500 Hz représente 60 000
 * échantillons — le dupliquer n'apporterait rien.
 */
export interface EcgWaveform {
  samplingHz: number;
  durationSeconds: number;
  /** « HL7 aECG », « XML constructeur ». */
  sourceFormat: string;
  /** Mesurée sur les pics R du signal, pas lue dans un rapport. */
  estimatedHeartRateBpm: number | null;
  /**
   * Grille d'affichage, calculée par le serveur d'après les dérivations reçues.
   *
   * Servie plutôt que recalculée ici : le compte rendu PDF et ce visualiseur
   * doivent produire des tracés **superposables**. Deux implémentations de la
   * même convention finiraient par divergerie — un cardiologue qui mesure à
   * l'écran puis vérifie sur l'impression ne doit pas trouver deux géométries.
   */
  layout: string[][];
  leads: { name: string; samples: number[] }[];
}

/** Réponse de `GET /ecg-requests/:id/waveform`. */
export interface EcgWaveformResponse {
  /** Nul quand le fichier ne porte pas de signal exploitable. */
  waveform: EcgWaveform | null;
  fileName: string;
  mimeType: string;
}

export interface TimelineEvent {
  at: string;
  event: string;
  actor: string;
}

/**
 * Demande complète telle que la renvoient les mutations (soumission, prise en
 * charge, conclusion).
 */
export interface EcgRequestDetail extends EcgRequestSummary {
  clinicalContext: string | null;
  medicalHistory: string | null;
  additionalComments: string | null;
  /** Conditions de l'enregistrement, distinctes du contexte de la demande. */
  recording: {
    recordedAt: string | null;
    currentMedication: string | null;
    hasPacemaker: boolean;
    systolicBp: number | null;
    diastolicBp: number | null;
    weightKg: number | null;
    heightCm: number | null;
    deviceModel: string | null;
    /** Calculé par le serveur quand poids et taille sont tous deux connus. */
    bmi: number | null;
  };
  reviewComment: string | null;
  analysis: EcgAnalysisResult | null;
  analysisFailureReason: string | null;
  analysisAttempts: number;
  file: { name: string; mimeType: string; sizeBytes: number };
  assignedAt: string | null;
  updatedAt: string;
}

/**
 * Ce que renvoie `GET /ecg-requests/:id` : la demande, enrichie des noms des
 * intervenants et de la chronologie.
 *
 * Les mutations ne portent pas ces champs — résoudre trois utilisateurs à
 * chaque écriture coûterait des requêtes pour un résultat que le client
 * recharge de toute façon. Le type le dit plutôt que de le laisser croire.
 */
export interface EcgRequestFullDetail extends EcgRequestDetail {
  submittedByName: string | null;
  assignedToName: string | null;
  reviewedByName: string | null;
  timeline: TimelineEvent[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  requestId: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface AvailabilitySlot {
  id: string | null;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  start: string;
  end: string;
  enabled: boolean;
}

export interface Availability {
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  statusLabel: string;
  slots: AvailabilitySlot[];
  enabledSlotCount: number;
  weeklyMinutes: number;
}

export interface Statistics {
  totals: {
    requests: number;
    concluded: number;
    validationRate: number | null;
    averageReviewDurationMs: number | null;
    activeUsers: number;
    cardiologists: number;
    professionals: number;
  };
  byStatus: { status: EcgRequestStatus; label: string; count: number }[];
  monthly: {
    year: number;
    month: number;
    label: string;
    submitted: number;
    validated: number;
    rejected: number;
  }[];
  topCardiologists: {
    cardiologistId: string;
    name: string;
    reviewed: number;
    validationRate: number | null;
  }[];
}

export interface AuditEntry {
  id: string;
  /** Rang dans la chaîne de scellement, attribué par la base. */
  sequence: number;
  timestamp: string;
  user: string;
  /** Instantané figé à l'écriture : survit à la suppression du compte. */
  userEmail: string | null;
  action: string;
  resource: string;
  status: string;
  details: string;
}

/**
 * Contrôle d'intégrité du journal.
 *
 * La base refuse déjà toute modification par déclencheur. Ce rapport couvre ce
 * qu'un déclencheur ne peut pas empêcher — une intervention qui l'aurait
 * désactivé : il rend l'altération détectable à défaut d'impossible.
 */
export interface AuditIntegrity {
  checked: number;
  intact: boolean;
  brokenLinks: number;
  firstBrokenSequence: number | null;
  fromSequence: number | null;
  toSequence: number | null;
  /** Entrées antérieures au scellement, hors périmètre de la chaîne. */
  unsealed: number;
}

export interface ManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  roleLabel: string;
  status: 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  statusLabel: string;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Formate une durée en millisecondes pour l'affichage. */
export function formatDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return '—';

  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;

  return `${Math.floor(hours / 24)} j ${hours % 24} h`;
}
