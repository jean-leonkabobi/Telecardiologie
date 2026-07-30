import Swal, { type SweetAlertOptions } from 'sweetalert2';

/**
 * Alertes et confirmations, sur SweetAlert2 — **toutes centrées à l'écran**.
 *
 * Tout passe par ce module plutôt que par `Swal` directement : la charte, les
 * libellés français et l'accessibilité sont définis une seule fois, et les
 * écrans n'ont plus à les répéter.
 *
 * Les couleurs sont lues sur les variables CSS du thème MUI, donc le mode
 * sombre est suivi sans configuration supplémentaire.
 */

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Options communes, relues à chaque appel pour refléter le mode courant. */
function baseOptions(): SweetAlertOptions {
  return {
    buttonsStyling: false,
    reverseButtons: true,
    focusConfirm: false,
    heightAuto: false,
    background: cssVar('--mui-palette-background-paper', '#ffffff'),
    color: cssVar('--mui-palette-text-primary', '#1b1414'),
    customClass: {
      popup: 'tc-swal-popup',
      title: 'tc-swal-title',
      htmlContainer: 'tc-swal-text',
      confirmButton: 'tc-swal-confirm',
      denyButton: 'tc-swal-deny',
      cancelButton: 'tc-swal-cancel',
      actions: 'tc-swal-actions',
    },
  };
}

export interface ToastOptions {
  title: string;
  text?: string;
}

/** Couleur de l'icône, alignée sur la sémantique du thème. */
const ICON_COLOR_VAR: Record<'success' | 'error' | 'warning' | 'info', string> = {
  success: '--mui-palette-success-main',
  error: '--mui-palette-error-main',
  warning: '--mui-palette-warning-main',
  info: '--mui-palette-info-main',
};

/**
 * Notification centrée, au milieu de l'écran.
 *
 * Choix assumé plutôt qu'une pastille en coin : dans un contexte de soins, une
 * notification qui glisse discrètement peut passer inaperçue — un résultat
 * validé ou un envoi refusé doivent être vus.
 *
 * Le comportement diffère selon la gravité, et ce n'est pas une incohérence :
 *
 * - **succès et information** se referment seuls après quelques secondes, avec
 *   une barre de progression. Exiger un clic après chaque action réussie
 *   ajouterait un geste à chaque étape du parcours ;
 * - **erreur et avertissement** attendent un acquittement explicite. Une erreur
 *   qui disparaît toute seule est une erreur que l'utilisateur n'a pas lue —
 *   inacceptable quand elle signale un envoi perdu ou un tracé refusé.
 */
function centeredAlert(
  icon: 'success' | 'error' | 'warning' | 'info',
  options: ToastOptions,
): void {
  const mustAcknowledge = icon === 'error' || icon === 'warning';

  void Swal.fire({
    ...baseOptions(),
    position: 'center',
    icon,
    iconColor: cssVar(ICON_COLOR_VAR[icon], '#b51e26'),
    title: options.title,
    text: options.text,
    showConfirmButton: mustAcknowledge,
    confirmButtonText: 'Fermer',
    focusConfirm: mustAcknowledge,
    ...(mustAcknowledge
      ? {}
      : {
          timer: 3200,
          timerProgressBar: true,
          // Le survol suspend le compte à rebours : laisse le temps de lire.
          didOpen: (el) => {
            el.addEventListener('mouseenter', Swal.stopTimer);
            el.addEventListener('mouseleave', Swal.resumeTimer);
          },
        }),
  });
}

/**
 * Point d'entrée unique des notifications.
 *
 * Les 44 appels du frontend passent par ici : changer la présentation — coin
 * d'écran, centre, durée — se fait à cet endroit et nulle part ailleurs.
 */
export const notify = {
  success: (title: string, text?: string) => centeredAlert('success', { title, text }),
  error: (title: string, text?: string) => centeredAlert('error', { title, text }),
  warning: (title: string, text?: string) => centeredAlert('warning', { title, text }),
  info: (title: string, text?: string) => centeredAlert('info', { title, text }),
};

export interface ConfirmOptions {
  title: string;
  text: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` pour une action destructrice (suppression, rejet). */
  tone?: 'danger' | 'default';
}

/**
 * Demande une confirmation explicite. Résout à `true` si l'utilisateur confirme.
 *
 * L'annulation est le choix par défaut au clavier : une validation par erreur
 * ne doit pas suffire à déclencher une suppression.
 */
export async function confirm(options: ConfirmOptions): Promise<boolean> {
  const danger = options.tone === 'danger';

  const result = await Swal.fire({
    ...baseOptions(),
    icon: danger ? 'warning' : 'question',
    iconColor: cssVar(
      danger ? '--mui-palette-error-main' : '--mui-palette-primary-main',
      danger ? '#841521' : '#b51e26',
    ),
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmLabel ?? (danger ? 'Supprimer' : 'Confirmer'),
    cancelButtonText: options.cancelLabel ?? 'Annuler',
    focusCancel: true,
    customClass: {
      ...(baseOptions().customClass as Record<string, string>),
      confirmButton: danger ? 'tc-swal-confirm tc-swal-danger' : 'tc-swal-confirm',
    },
  });

  return result.isConfirmed;
}

/** Message bloquant, pour une information qui doit être acquittée. */
export async function alertDialog(
  icon: 'success' | 'error' | 'warning' | 'info',
  title: string,
  text?: string,
): Promise<void> {
  await Swal.fire({
    ...baseOptions(),
    icon,
    iconColor: cssVar(
      icon === 'error' ? '--mui-palette-error-main' : '--mui-palette-primary-main',
      '#b51e26',
    ),
    title,
    text,
    confirmButtonText: 'Fermer',
  });
}

export interface PromptOptions {
  title: string;
  text: string;
  label: string;
  placeholder?: string;
  confirmLabel?: string;
  /** Longueur minimale exigée. Le message de refus est produit ici. */
  minLength?: number;
}

/**
 * Demande une saisie libre, centrée à l'écran.
 *
 * Résout à la valeur saisie, ou `null` si l'utilisateur annule. La validation se
 * fait dans la boîte elle-même — refermer puis rouvrir pour signaler un motif
 * trop court ferait perdre ce qui a déjà été écrit.
 */
export async function promptText(options: PromptOptions): Promise<string | null> {
  const minLength = options.minLength ?? 1;

  const result = await Swal.fire({
    ...baseOptions(),
    position: 'center',
    icon: 'question',
    iconColor: cssVar('--mui-palette-primary-main', '#b51e26'),
    title: options.title,
    text: options.text,
    input: 'textarea',
    inputLabel: options.label,
    inputPlaceholder: options.placeholder ?? '',
    inputAttributes: { 'aria-label': options.label },
    showCancelButton: true,
    confirmButtonText: options.confirmLabel ?? 'Confirmer',
    cancelButtonText: 'Annuler',
    focusCancel: false,
    inputValidator: (value) => {
      const saisie = value?.trim() ?? '';
      if (saisie.length < minLength) {
        return `Précisez le motif (${minLength} caractères minimum).`;
      }
      return null;
    },
  });

  return result.isConfirmed ? (result.value as string).trim() : null;
}

/** Indicateur d'attente pour une opération dont on ne connaît pas la durée. */
export function showLoading(title = 'Traitement en cours…'): void {
  void Swal.fire({
    ...baseOptions(),
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading(),
  });
}

export function closeLoading(): void {
  Swal.close();
}
