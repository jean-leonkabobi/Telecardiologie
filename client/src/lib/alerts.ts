import Swal, { type SweetAlertOptions } from "sweetalert2";

/**
 * Alertes et confirmations, sur SweetAlert2 — **au rendu par défaut**.
 *
 * Tout passe par ce module plutôt que par `Swal` directement : les libellés
 * français et le comportement sont définis une seule fois, et les écrans n'ont
 * plus à les répéter.
 *
 * **Aucun habillage.** La version précédente redéfinissait les couleurs, les
 * boutons, les rayons et la typographie par une feuille de style dédiée. Elle a
 * été retirée : la bibliothèque a son apparence, elle est cohérente, et la
 * maintenir en parallèle du thème MUI coûtait plus qu'elle ne rapportait. Ne
 * restent ici que des réglages de **comportement** et de **langue**.
 */

/** Options communes à toutes les boîtes. */
function baseOptions(): SweetAlertOptions {
  return {
    /**
     * La boîte peut être déplacée à la souris.
     *
     * Ce n'est pas un ornement : centrée, elle recouvre justement ce que le
     * soignant doit relire pour répondre. Un motif de rejet à rédiger pendant
     * qu'on examine le tracé, une erreur de saisie qui masque le champ fautif —
     * pouvoir pousser la boîte de côté évite de la fermer, de lire, puis de tout
     * recommencer.
     *
     * La prise se fait sur le fond de la boîte ou sur son icône ; les champs et
     * les boutons gardent leur comportement normal.
     */
    draggable: true,

    /**
     * Thème suivant celui du système — un paramètre natif de la bibliothèque, pas
     * une feuille de style.
     *
     * L'application a un mode sombre. Sans cela, une boîte blanche s'ouvrirait en
     * pleine nuit au milieu d'un écran sombre, sur un poste de garde.
     */
    theme: "auto",

    /**
     * Empêche SweetAlert2 de modifier la hauteur du `body`.
     *
     * Réglage fonctionnel : par défaut la bibliothèque ajuste le document pour
     * centrer sa boîte, ce qui fait sauter la page derrière elle à l'ouverture
     * comme à la fermeture.
     */
    heightAuto: false,
  };
}

export interface ToastOptions {
  title: string;
  text?: string;
}

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
  icon: "success" | "error" | "warning" | "info",
  options: ToastOptions
): void {
  const mustAcknowledge = icon === "error" || icon === "warning";

  void Swal.fire({
    ...baseOptions(),
    icon,
    title: options.title,
    text: options.text,
    showConfirmButton: mustAcknowledge,
    confirmButtonText: "Fermer",
    ...(mustAcknowledge
      ? {}
      : {
          timer: 3200,
          timerProgressBar: true,
          // Le survol suspend le compte à rebours : laisse le temps de lire.
          didOpen: el => {
            el.addEventListener("mouseenter", Swal.stopTimer);
            el.addEventListener("mouseleave", Swal.resumeTimer);
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
  success: (title: string, text?: string) =>
    centeredAlert("success", { title, text }),
  error: (title: string, text?: string) =>
    centeredAlert("error", { title, text }),
  warning: (title: string, text?: string) =>
    centeredAlert("warning", { title, text }),
  info: (title: string, text?: string) =>
    centeredAlert("info", { title, text }),
};

export interface ConfirmOptions {
  title: string;
  text: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` pour une action destructrice (suppression, rejet). */
  tone?: "danger" | "default";
}

/**
 * Demande une confirmation explicite. Résout à `true` si l'utilisateur confirme.
 *
 * L'annulation est le choix par défaut au clavier : une validation par erreur
 * ne doit pas suffire à déclencher une suppression.
 */
export async function confirm(options: ConfirmOptions): Promise<boolean> {
  const danger = options.tone === "danger";

  const result = await Swal.fire({
    ...baseOptions(),
    // L'avertissement pour une action destructrice, la question sinon : c'est
    // l'icône qui porte la différence, sans couleur à redéfinir.
    icon: danger ? "warning" : "question",
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText:
      options.confirmLabel ?? (danger ? "Supprimer" : "Confirmer"),
    cancelButtonText: "Annuler",
    focusCancel: true,
  });

  return result.isConfirmed;
}

/** Message bloquant, pour une information qui doit être acquittée. */
export async function alertDialog(
  icon: "success" | "error" | "warning" | "info",
  title: string,
  text?: string
): Promise<void> {
  await Swal.fire({
    ...baseOptions(),
    icon,
    title,
    text,
    confirmButtonText: "Fermer",
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
export async function promptText(
  options: PromptOptions
): Promise<string | null> {
  const minLength = options.minLength ?? 1;

  const result = await Swal.fire({
    ...baseOptions(),
    icon: "question",
    title: options.title,
    text: options.text,
    input: "textarea",
    inputLabel: options.label,
    inputPlaceholder: options.placeholder ?? "",
    inputAttributes: { "aria-label": options.label },
    showCancelButton: true,
    confirmButtonText: options.confirmLabel ?? "Confirmer",
    cancelButtonText: "Annuler",
    inputValidator: value => {
      const saisie = value?.trim() ?? "";
      if (saisie.length < minLength) {
        return `Précisez le motif (${minLength} caractères minimum).`;
      }
      return null;
    },
  });

  return result.isConfirmed ? (result.value as string).trim() : null;
}

/** Indicateur d'attente pour une opération dont on ne connaît pas la durée. */
export function showLoading(title = "Traitement en cours…"): void {
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
