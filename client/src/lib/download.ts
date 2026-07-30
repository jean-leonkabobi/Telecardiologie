/**
 * Déclenche le téléchargement d'un fichier depuis une URL.
 *
 * **Pourquoi pas `window.open`.** L'URL du tracé n'est connue qu'après un
 * aller-retour vers l'API pour obtenir une signature temporaire. Or un
 * `window.open` appelé après un `await` a perdu le contexte de geste
 * utilisateur : le navigateur le traite comme une fenêtre surgissante non
 * sollicitée et la bloque. Le clic ne produit alors **rien du tout** — pas
 * d'erreur, pas d'onglet, juste un bouton qui semble mort.
 *
 * Une ancre porteuse de l'attribut `download`, cliquée par programme, n'est pas
 * soumise à ce blocage : le navigateur y voit un téléchargement, pas une
 * fenêtre.
 *
 * `rel="noopener"` reste posé par principe, même si `download` empêche déjà la
 * page cible d'obtenir une référence vers la nôtre.
 */
export function triggerDownload(url: string, fileName: string): void {
  const ancre = document.createElement('a');
  ancre.href = url;
  // Indication seulement : sur une origine différente, le navigateur ignore ce
  // nom et suit le `Content-Disposition` renvoyé par le stockage — que l'API
  // demande justement dans l'URL signée.
  ancre.download = fileName;
  ancre.rel = 'noopener';
  ancre.style.display = 'none';

  document.body.appendChild(ancre);
  ancre.click();
  ancre.remove();
}
