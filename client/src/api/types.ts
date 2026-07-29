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

export interface EcgRequestSummary {
  id: string;
  reference: string;
  status: EcgRequestStatus;
  statusApi: string;
  statusLabel: string;
  priority: EcgPriority;
  priorityApi: string;
  priorityLabel: string;
  patient: PatientSnapshot;
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
  confidence: number;
  confidenceLabel: string;
  interpretation: string;
  modelVersion: string;
  /** Faux quand l'avis repose sur le seul dossier clinique. */
  measuredSignal: boolean;
  computedAt: string;
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
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  status: string;
  details: string;
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
