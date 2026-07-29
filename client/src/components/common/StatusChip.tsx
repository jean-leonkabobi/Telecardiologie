import Chip from '@mui/material/Chip';
import type { ChipProps } from '@mui/material/Chip';

type Severity = 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info';

/**
 * Correspondance statut → couleur sémantique.
 *
 * Le serveur envoie désormais l'énumération technique (`status`) **et** son
 * libellé français (`statusLabel`). La couleur se déduit de l'énumération —
 * stable, non accentuée — et le libellé sert uniquement à l'affichage. Les
 * clés françaises restent acceptées pour les quelques champs qui n'existent
 * qu'en libellé (audit, comptes).
 */
const SEVERITY_BY_KEY: Record<string, Severity> = {
  // Cycle de vie d'une demande — énumération technique
  pending_analysis: 'warning',
  analyzing: 'info',
  analysis_failed: 'warning',
  pending_review: 'warning',
  under_review: 'info',
  validated: 'success',
  corrected: 'info',
  rejected: 'error',
  // Priorité
  normal: 'default',
  urgent: 'error',
  // Décision de revue (mêmes clés que les statuts terminaux)

  // Libellés français — écrans sans énumération correspondante
  "en attente d'analyse": 'warning',
  'analyse ia en cours': 'info',
  "echec de l'analyse ia": 'warning',
  'en attente de validation': 'warning',
  'en cours de validation': 'info',
  'en attente': 'warning',
  'en cours': 'info',
  validee: 'success',
  rejetee: 'error',
  corrigee: 'info',
  normale: 'default',
  urgente: 'error',
  // Comptes utilisateurs
  pending_activation: 'warning',
  "en attente d'activation": 'warning',
  actif: 'success',
  active: 'success',
  inactif: 'default',
  inactive: 'default',
  suspendu: 'error',
  suspended: 'error',
  // Journal d'audit
  succes: 'success',
  success: 'success',
  erreur: 'error',
  error: 'error',
  failure: 'error',
  // Disponibilité d'un cardiologue
  disponible: 'success',
  available: 'success',
  occupe: 'warning',
  busy: 'warning',
  absent: 'default',
  offline: 'default',
};

/**
 * Retire accents, casse et apostrophe typographique.
 *
 * Le serveur emploie l'apostrophe courbe dans ses libelles de statut ; sans
 * cette normalisation, la cle du tableau ne correspondrait jamais.
 */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .trim()
    .toLowerCase();
}

export function statusSeverity(status: string): Severity {
  return SEVERITY_BY_KEY[normalize(status)] ?? 'default';
}

interface StatusChipProps extends Omit<ChipProps, 'color' | 'label'> {
  /** Texte affiché — le libellé français fourni par le serveur. */
  status: string;
  /**
   * Énumération technique correspondante (`PENDING_REVIEW`, `URGENT`…).
   * Quand elle est fournie, la couleur en dérive plutôt que du libellé.
   */
  statusKey?: string;
  /** Force une couleur au lieu de la déduire. */
  severity?: Severity;
}

/** Pastille de statut colorée selon la sémantique métier. */
export function StatusChip({
  status,
  statusKey,
  severity,
  variant = 'filled',
  ...rest
}: StatusChipProps) {
  const color = severity ?? statusSeverity(statusKey ?? status);

  return <Chip label={status} color={color} variant={variant} {...rest} />;
}

export default StatusChip;
