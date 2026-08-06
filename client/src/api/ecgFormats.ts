/**
 * Formats de tracé acceptés, côté client.
 *
 * **Le serveur reste l'autorité** : c'est lui qui rejette, en vérifiant la
 * signature réelle du fichier et non le type déclaré par le navigateur. Cette
 * liste ne sert qu'à éviter à l'utilisateur un aller-retour inutile — proposer
 * les bons fichiers dans le sélecteur, et refuser tout de suite l'évidence.
 *
 * Elle réplique `ECG_FORMATS` du domaine backend
 * (`src/domain/value-objects/EcgFile.ts`). Deux projets séparés ne peuvent pas
 * partager de constante ; en cas de divergence, le serveur gagne et affiche son
 * propre message.
 */
export const ECG_ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".xml",
  ".txt",
  ".ecg",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
] as const;

/** Valeur de l'attribut `accept` du champ de fichier. */
export const ECG_ACCEPT_ATTRIBUTE = ECG_ACCEPTED_EXTENSIONS.join(",");

/** Formulation lisible, pour la légende et les messages d'erreur. */
export const ECG_FORMATS_LABEL = "PDF, XML, texte, CSV, PNG ou JPEG";

/** Doit rester alignée sur `ECG_MAX_FILE_SIZE_MB` du serveur. */
export const ECG_MAX_FILE_SIZE_MB = 20;

/** « 1,4 Mo » — l'utilisateur ne compte pas en octets. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;

  const ko = bytes / 1024;
  if (ko < 1024) return `${ko.toFixed(0).replace(".", ",")} Ko`;

  const mo = ko / 1024;
  const arrondi = mo >= 10 ? mo.toFixed(0) : mo.toFixed(1);
  return `${arrondi.replace(".", ",")} Mo`;
}

/**
 * Contrôle préalable, volontairement minimal.
 *
 * Extension et taille seulement : ce sont les deux refus qu'on peut prononcer
 * sans lire le fichier. Le reste — signature, intégrité — demande les octets, et
 * c'est le rôle du serveur.
 */
export function checkEcgFile(file: File): string | null {
  const point = file.name.lastIndexOf(".");
  const extension = point === -1 ? "" : file.name.slice(point).toLowerCase();

  if (
    !ECG_ACCEPTED_EXTENSIONS.includes(
      extension as (typeof ECG_ACCEPTED_EXTENSIONS)[number]
    )
  ) {
    return `Format non supporté${extension ? ` (${extension})` : ""}. Formats acceptés : ${ECG_FORMATS_LABEL}.`;
  }

  const maxBytes = ECG_MAX_FILE_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `Le fichier dépasse la taille maximale de ${ECG_MAX_FILE_SIZE_MB} Mo (il en fait ${formatFileSize(file.size)}).`;
  }

  if (file.size === 0) {
    return "Le fichier est vide. Vérifiez qu'il a été entièrement enregistré avant de le joindre.";
  }

  return null;
}
