import Swal, { type SweetAlertOptions } from 'sweetalert2';

/**
 * Alertes et confirmations, sur SweetAlert2.
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

/** Notification discrète en coin d'écran, qui n'interrompt pas l'utilisateur. */
function toast(icon: 'success' | 'error' | 'warning' | 'info', options: ToastOptions): void {
  void Swal.fire({
    ...baseOptions(),
    toast: true,
    position: 'top-end',
    icon,
    title: options.title,
    text: options.text,
    showConfirmButton: false,
    timer: icon === 'error' ? 6000 : 4000,
    timerProgressBar: true,
    // Laisse le temps de lire quand le pointeur survole la notification.
    didOpen: (el) => {
      el.addEventListener('mouseenter', Swal.stopTimer);
      el.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });
}

export const notify = {
  success: (title: string, text?: string) => toast('success', { title, text }),
  error: (title: string, text?: string) => toast('error', { title, text }),
  warning: (title: string, text?: string) => toast('warning', { title, text }),
  info: (title: string, text?: string) => toast('info', { title, text }),
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
